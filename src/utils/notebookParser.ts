import html2canvas from 'html2canvas';
import { NotebookOutputItem, ExtractionConfig } from '../types/notebook';

// Regular expression to match ANSI escape codes from Python / terminal outputs
const ANSI_REGEX = new RegExp(
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  'g'
);

export function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, '');
}

export function asText(v: unknown): string {
  if (Array.isArray(v)) return v.join('');
  if (typeof v === 'string') return v;
  if (v === null || v === undefined) return '';
  return JSON.stringify(v, null, 2);
}

function literalStringsAfterCall(source: string, patterns: RegExp[]): string[] {
  const found: string[] = [];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(source)) !== null) {
      const tail = m[1] || '';
      const q = tail.match(/["'`]([^"'`]{2,240})["'`]/);
      if (q) found.push(q[1].trim());
    }
  }
  return found;
}

export function inferOutputCaption(cellSource: string, output: any, defaultIndex: number): string {
  const source = cellSource || '';
  const titles = literalStringsAfterCall(source, [
    /(?:plt|pyplot)\.title\s*\(\s*([\s\S]{0,400}?)\)/g,
    /\.set_title\s*\(\s*([\s\S]{0,400}?)\)/g,
    /\.suptitle\s*\(\s*([\s\S]{0,400}?)\)/g,
    /fig\.suptitle\s*\(\s*([\s\S]{0,400}?)\)/g,
    /sns\.(?:heatmap|barplot|scatterplot|lineplot|boxplot|histplot)\s*\([^)]*title\s*=\s*([\s\S]{0,200}?)\)/g,
  ]);

  if (titles.length > 0) {
    let t = titles[0].replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    // Resolve simple f-string placeholders
    t = t.replace(/\{([A-Za-z_]\w*)\}/g, (m, v) => {
      const r = new RegExp(`(?:^|\\n)\\s*${v}\\s*=\\s*([^\\n]+)`);
      const hit = source.match(r);
      if (hit) return String(hit[1]).replace(/^["'`]|["'`]$/g, '').trim();
      return m;
    });
    if (t.length > 0) return t;
  }

  // Check for pandas dataframe display like df.head() or display(df)
  const dfMatch = source.match(/(?:display|print)\s*\(\s*([A-Za-z_]\w*)\b/);
  if (dfMatch && (output.output_type === 'execute_result' || output.output_type === 'display_data')) {
    const varName = dfMatch[1];
    if (output.data && output.data['text/html']) {
      return `DataFrame Preview: ${varName}`;
    }
    return `Results for ${varName}`;
  }

  const data = output.data || {};
  if (data['text/html']) {
    return 'Tabular Data & Output';
  }

  if (data['text/plain']) {
    const rawPlain = stripAnsi(asText(data['text/plain'])).trim();
    const firstLine = rawPlain.split(/\n+/)[0].trim();
    if (
      firstLine &&
      firstLine.length <= 80 &&
      !/^\s*[\[\(\{<]/.test(firstLine) &&
      !/^<matplotlib\./i.test(firstLine) &&
      !/^<Figure/i.test(firstLine) &&
      !/^<seaborn/i.test(firstLine) &&
      !/^dtype\s*:/i.test(firstLine)
    ) {
      return firstLine.replace(/[:：]\s*$/, '');
    }
  }

  const printMatches = literalStringsAfterCall(source, [/\bprint\s*\(\s*([\s\S]{0,200}?)\)/g]);
  if (printMatches.length && output.output_type === 'stream') {
    return printMatches[0].replace(/[:：]\s*$/, '').trim();
  }

  if (output.output_type === 'error') {
    return `Runtime Error: ${output.ename || 'Exception'}`;
  }

  if (data['image/png'] || data['image/jpeg']) {
    return `Figure Chart ${defaultIndex}`;
  }

  return `Output ${defaultIndex}`;
}

export async function captureTextToImage(text: string, isError = false): Promise<string> {
  const clean = stripAnsi(text);
  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;left:-99999px;top:0;width:1000px;background:#ffffff;padding:24px 28px;box-sizing:border-box;' +
    'font-family:Consolas,"Fira Code","Courier New",monospace;font-size:14px;line-height:1.55;white-space:pre-wrap;' +
    'word-break:break-word;overflow-wrap:anywhere;border:1px solid ' +
    (isError ? '#fecaca' : '#e2e8f0') +
    ';border-radius:8px;' +
    (isError ? 'color:#991b1b;background:#fef2f2;' : 'color:#1e293b;');

  const pre = document.createElement('div');
  pre.textContent = clean;
  host.appendChild(pre);
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(host, {
      backgroundColor: isError ? '#fef2f2' : '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return canvas.toDataURL('image/png');
  } finally {
    host.remove();
  }
}

export function sanitizeHtml(html: string): string {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html ?? '');
  tpl.content.querySelectorAll('script,iframe,object,embed,form,base,link,meta').forEach((n) => n.remove());
  tpl.content.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((a) => {
      if (/^on/i.test(a.name)) el.removeAttribute(a.name);
    });
    for (const attr of ['src', 'srcset', 'poster']) {
      if (el.hasAttribute(attr)) {
        const v = el.getAttribute(attr)?.trim() || '';
        if (v && !/^(data:|blob:)/i.test(v)) el.removeAttribute(attr);
      }
    }
    if (el.hasAttribute('href')) {
      const v = el.getAttribute('href')?.trim() || '';
      if (v && !/^(#|data:|blob:|mailto:|tel:)/i.test(v)) el.removeAttribute('href');
    }
  });
  return tpl.innerHTML;
}

export async function captureHtmlToImage(html: string): Promise<string> {
  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;left:-99999px;top:0;width:1050px;background:#ffffff;padding:24px;box-sizing:border-box;' +
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
    'font-size:13px;line-height:1.5;color:#1e293b;border:1px solid #e2e8f0;border-radius:8px;';

  host.innerHTML = sanitizeHtml(html);

  // Normalize dataframe tables
  host.querySelectorAll('table').forEach((tbl) => {
    tbl.style.borderCollapse = 'collapse';
    tbl.style.width = '100%';
    tbl.style.margin = '0';
    tbl.querySelectorAll('th').forEach((th) => {
      th.style.backgroundColor = '#f8fafc';
      th.style.color = '#334155';
      th.style.fontWeight = '600';
      th.style.border = '1px solid #cbd5e1';
      th.style.padding = '8px 12px';
      th.style.textAlign = 'left';
      th.style.fontSize = '12px';
    });
    tbl.querySelectorAll('td').forEach((td) => {
      td.style.border = '1px solid #e2e8f0';
      td.style.padding = '6px 12px';
      td.style.textAlign = 'left';
      td.style.fontSize = '12px';
    });
  });

  document.body.appendChild(host);

  try {
    const images = Array.from(host.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((res) => {
            if (img.complete) res();
            else {
              img.onload = () => res();
              img.onerror = () => res();
            }
          })
      )
    );

    const canvas = await html2canvas(host, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return canvas.toDataURL('image/png');
  } finally {
    host.remove();
  }
}

export function getImageDimensions(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth || 800, h: img.naturalHeight || 600 });
    };
    img.onerror = () => {
      resolve({ w: 800, h: 600 });
    };
    img.src = src;
  });
}

export async function parseNotebook(
  notebookJson: any,
  config: ExtractionConfig,
  onProgress?: (percent: number, statusText: string) => void
): Promise<NotebookOutputItem[]> {
  if (!notebookJson || !Array.isArray(notebookJson.cells)) {
    throw new Error('Invalid notebook file: missing "cells" array.');
  }

  const rawItems: Array<{
    cellIndex: number;
    outputIndex: number;
    executionCount: number | null;
    outputType: string;
    kind: 'image' | 'html' | 'text' | 'svg';
    subtype: string;
    caption: string;
    rawText?: string;
    rawHtml?: string;
    src?: string;
    empty?: boolean;
  }> = [];

  let figCounter = 1;

  notebookJson.cells.forEach((cell: any, cellIdx: number) => {
    // CRITICAL REQUIREMENT: Strictly parse code cell outputs. NEVER read cell.source as output!
    if (cell.cell_type !== 'code') return;

    const cellSource = asText(cell.source);
    const outputs = Array.isArray(cell.outputs) ? cell.outputs : [];

    if (outputs.length === 0) {
      if (config.includeEmpty) {
        rawItems.push({
          cellIndex: cellIdx,
          outputIndex: 0,
          executionCount: cell.execution_count ?? null,
          outputType: 'empty',
          kind: 'text',
          subtype: 'empty',
          caption: 'No Output Generated',
          rawText: '(Cell executed with no visible output)',
          empty: true,
        });
      }
      return;
    }

    // Optionally merge consecutive streams in the same cell
    let pendingStream: { text: string; name: string } | null = null;

    const flushStream = (outIdx: number) => {
      if (pendingStream && config.includeStreams) {
        const cleanText = stripAnsi(pendingStream.text).trim();
        if (cleanText.length > 0) {
          rawItems.push({
            cellIndex: cellIdx,
            outputIndex: outIdx,
            executionCount: cell.execution_count ?? null,
            outputType: 'stream',
            kind: 'text',
            subtype: pendingStream.name || 'stdout',
            caption: config.autoInferCaptions
              ? inferOutputCaption(cellSource, { output_type: 'stream' }, figCounter++)
              : `Stream Output ${figCounter++}`,
            rawText: cleanText,
          });
        }
      }
      pendingStream = null;
    };

    outputs.forEach((out: any, outIdx: number) => {
      if (out.output_type === 'stream') {
        if (!config.includeStreams) return;
        const textChunk = asText(out.text);
        if (config.mergeConsecutiveStreams) {
          if (!pendingStream) {
            pendingStream = { text: textChunk, name: out.name || 'stdout' };
          } else {
            pendingStream.text += textChunk;
          }
        } else {
          const cleanText = stripAnsi(textChunk).trim();
          if (cleanText.length > 0) {
            rawItems.push({
              cellIndex: cellIdx,
              outputIndex: outIdx,
              executionCount: cell.execution_count ?? null,
              outputType: 'stream',
              kind: 'text',
              subtype: out.name || 'stdout',
              caption: config.autoInferCaptions
                ? inferOutputCaption(cellSource, out, figCounter++)
                : `Console Stream ${figCounter++}`,
              rawText: cleanText,
            });
          }
        }
        return;
      }

      // Flush any pending stream if next output is not a stream
      flushStream(outIdx);

      if (out.output_type === 'error') {
        if (!config.includeErrors) return;
        const tb = Array.isArray(out.traceback) ? out.traceback.join('\n') : '';
        const fullErr = stripAnsi([out.ename, out.evalue, tb].filter(Boolean).join('\n'));
        rawItems.push({
          cellIndex: cellIdx,
          outputIndex: outIdx,
          executionCount: cell.execution_count ?? null,
          outputType: 'error',
          kind: 'text',
          subtype: 'error',
          caption: `Error: ${out.ename || 'Runtime Exception'}`,
          rawText: fullErr,
        });
        return;
      }

      if (out.output_type === 'display_data' || out.output_type === 'execute_result') {
        if (!config.includeDisplayData) return;
        const data = out.data || {};

        // Highest fidelity representations first
        if (data['image/png']) {
          const b64 = asText(data['image/png']).trim();
          rawItems.push({
            cellIndex: cellIdx,
            outputIndex: outIdx,
            executionCount: cell.execution_count ?? null,
            outputType: out.output_type,
            kind: 'image',
            subtype: 'png',
            caption: config.autoInferCaptions
              ? inferOutputCaption(cellSource, out, figCounter++)
              : `Plot / Figure ${figCounter++}`,
            src: b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`,
          });
        } else if (data['image/jpeg']) {
          const b64 = asText(data['image/jpeg']).trim();
          rawItems.push({
            cellIndex: cellIdx,
            outputIndex: outIdx,
            executionCount: cell.execution_count ?? null,
            outputType: out.output_type,
            kind: 'image',
            subtype: 'jpeg',
            caption: config.autoInferCaptions
              ? inferOutputCaption(cellSource, out, figCounter++)
              : `Plot / Figure ${figCounter++}`,
            src: b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`,
          });
        } else if (data['image/webp']) {
          const b64 = asText(data['image/webp']).trim();
          rawItems.push({
            cellIndex: cellIdx,
            outputIndex: outIdx,
            executionCount: cell.execution_count ?? null,
            outputType: out.output_type,
            kind: 'image',
            subtype: 'webp',
            caption: config.autoInferCaptions
              ? inferOutputCaption(cellSource, out, figCounter++)
              : `Image ${figCounter++}`,
            src: b64.startsWith('data:') ? b64 : `data:image/webp;base64,${b64}`,
          });
        } else if (data['image/svg+xml']) {
          const rawSvg = asText(data['image/svg+xml']);
          rawItems.push({
            cellIndex: cellIdx,
            outputIndex: outIdx,
            executionCount: cell.execution_count ?? null,
            outputType: out.output_type,
            kind: 'svg',
            subtype: 'svg',
            caption: config.autoInferCaptions
              ? inferOutputCaption(cellSource, out, figCounter++)
              : `Vector Graphic ${figCounter++}`,
            src: rawSvg.startsWith('data:')
              ? rawSvg
              : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rawSvg)}`,
            rawHtml: rawSvg,
          });
        } else if (data['text/html']) {
          const rawHtml = asText(data['text/html']);
          rawItems.push({
            cellIndex: cellIdx,
            outputIndex: outIdx,
            executionCount: cell.execution_count ?? null,
            outputType: out.output_type,
            kind: 'html',
            subtype: 'html-table',
            caption: config.autoInferCaptions
              ? inferOutputCaption(cellSource, out, figCounter++)
              : `Table Output ${figCounter++}`,
            rawHtml,
          });
        } else if (data['text/plain']) {
          const rawText = stripAnsi(asText(data['text/plain'])).trim();
          if (rawText.length > 0) {
            rawItems.push({
              cellIndex: cellIdx,
              outputIndex: outIdx,
              executionCount: cell.execution_count ?? null,
              outputType: out.output_type,
              kind: 'text',
              subtype: 'plain-text',
              caption: config.autoInferCaptions
                ? inferOutputCaption(cellSource, out, figCounter++)
                : `Text Output ${figCounter++}`,
              rawText,
            });
          }
        }
      }
    });

    flushStream(outputs.length);
  });

  const total = rawItems.length;
  const processedItems: NotebookOutputItem[] = [];

  for (let i = 0; i < total; i++) {
    const item = rawItems[i];
    onProgress?.(
      Math.round(((i + 1) / total) * 100),
      `Rendering output ${i + 1} of ${total}: ${item.caption}...`
    );

    let finalSrc = item.src || '';

    try {
      if (item.kind === 'text') {
        finalSrc = await captureTextToImage(item.rawText || '', item.subtype === 'error');
      } else if (item.kind === 'html') {
        finalSrc = await captureHtmlToImage(item.rawHtml || '');
      } else if (item.kind === 'svg' && (!finalSrc || !finalSrc.startsWith('data:image/png'))) {
        // Convert SVG to high-res PNG for universal Word DOCX embedding
        finalSrc = await captureHtmlToImage(item.rawHtml || '');
      }
    } catch (err) {
      console.warn('Fallback rendering for item:', item, err);
      finalSrc = await captureTextToImage(item.rawText || `[${item.caption} could not be rendered]`);
    }

    const dim = await getImageDimensions(finalSrc);

    processedItems.push({
      id: `out_${item.cellIndex}_${item.outputIndex}_${i}`,
      cellIndex: item.cellIndex,
      outputIndex: item.outputIndex,
      executionCount: item.executionCount,
      outputType: item.outputType,
      kind: item.kind,
      subtype: item.subtype,
      caption: item.caption,
      notes: '',
      src: finalSrc,
      rawText: item.rawText,
      rawHtml: item.rawHtml,
      dim,
      selected: true,
      empty: item.empty,
    });
  }

  return processedItems;
}
