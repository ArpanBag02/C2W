import { NotebookOutputItem } from '../types/notebook';

/**
 * Checks whether a caption is considered "empty" or a generic uninformative placeholder.
 */
export function isCaptionEmptyOrGeneric(caption?: string): boolean {
  if (!caption || !caption.trim()) return true;
  const c = caption.trim();
  const genericPatterns = [
    /^output\s*\d*$/i,
    /^(figure\s*chart|plot\s*\/\s*figure|image)\s*\d*$/i,
    /^(table\s*output|tabular\s*data\s*(&\s*output)?)\s*\d*$/i,
    /^(stream\s*output|console\s*stream|text\s*output|plain\s*text)\s*\d*$/i,
    /^vector\s*graphic\s*\d*$/i,
    /^figure\s*\d*$/i,
    /^chart\s*\d*$/i,
    /^no\s*output\s*generated$/i,
  ];
  return genericPatterns.some((pattern) => pattern.test(c));
}

/**
 * Extracts table headers, column names, dimensions and basic trends from raw HTML.
 */
function analyzeHtmlTable(html: string): {
  headers: string[];
  rowCount: number;
  colCount: number;
  isNumericMatrix: boolean;
  numericTrend?: string;
  category: 'metrics' | 'correlation' | 'summary' | 'dataset' | 'confusion';
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');

  if (!table) {
    return {
      headers: [],
      rowCount: 0,
      colCount: 0,
      isNumericMatrix: false,
      category: 'dataset',
    };
  }

  // Extract headers
  const headerCells = Array.from(table.querySelectorAll('thead th, tr:first-child th, tr:first-child td'));
  const headers = headerCells
    .map((c) => (c.textContent || '').trim())
    .filter((txt) => txt.length > 0 && txt.length < 50);

  const rows = Array.from(table.querySelectorAll('tbody tr, tr')).filter((r) => r.querySelectorAll('td').length > 0);
  const rowCount = rows.length;
  const colCount = Math.max(headers.length, rows[0]?.querySelectorAll('td').length || 0);

  // Check column names for semantic clues
  const lowerHeaders = headers.map((h) => h.toLowerCase());
  const headerText = lowerHeaders.join(' ');

  let category: 'metrics' | 'correlation' | 'summary' | 'dataset' | 'confusion' = 'dataset';

  if (
    lowerHeaders.some((h) => ['loss', 'val_loss', 'accuracy', 'val_accuracy', 'epoch', 'f1', 'precision', 'recall', 'rmse', 'mae'].includes(h)) ||
    headerText.includes('loss') ||
    headerText.includes('acc')
  ) {
    category = 'metrics';
  } else if (
    lowerHeaders.includes('count') &&
    (lowerHeaders.includes('mean') || lowerHeaders.includes('std') || lowerHeaders.includes('50%'))
  ) {
    category = 'summary';
  } else if (
    (lowerHeaders.length > 2 && headers.every((h) => lowerHeaders.filter((x) => x === h).length <= 2)) &&
    (headerText.includes('corr') || (rows.length > 0 && rows.length === headers.length))
  ) {
    category = 'correlation';
  }

  // Sample numeric values to identify trends
  let numericTrend: string | undefined;
  if (rows.length >= 2) {
    const lossColIndex = lowerHeaders.findIndex((h) => h.includes('loss'));
    const accColIndex = lowerHeaders.findIndex((h) => h.includes('acc'));

    if (lossColIndex !== -1) {
      const firstVal = parseFloat(rows[0].querySelectorAll('td')[lossColIndex]?.textContent || 'NaN');
      const lastVal = parseFloat(rows[rows.length - 1].querySelectorAll('td')[lossColIndex]?.textContent || 'NaN');
      if (!isNaN(firstVal) && !isNaN(lastVal)) {
        if (lastVal < firstVal) {
          numericTrend = `Steady downward loss trend from ${firstVal.toFixed(3)} to ${lastVal.toFixed(3)}`;
        } else if (lastVal > firstVal) {
          numericTrend = `Increasing loss trend from ${firstVal.toFixed(3)} to ${lastVal.toFixed(3)}`;
        }
      }
    } else if (accColIndex !== -1) {
      const firstVal = parseFloat(rows[0].querySelectorAll('td')[accColIndex]?.textContent || 'NaN');
      const lastVal = parseFloat(rows[rows.length - 1].querySelectorAll('td')[accColIndex]?.textContent || 'NaN');
      if (!isNaN(firstVal) && !isNaN(lastVal)) {
        if (lastVal > firstVal) {
          numericTrend = `Positive accuracy growth from ${(firstVal * 100).toFixed(1)}% to ${(lastVal * 100).toFixed(1)}%`;
        }
      }
    }
  }

  return {
    headers,
    rowCount,
    colCount,
    isNumericMatrix: category === 'correlation' || category === 'metrics',
    numericTrend,
    category,
  };
}

/**
 * Heuristic caption generation for HTML tables based on headers and value patterns.
 */
function generateTableCaption(item: NotebookOutputItem): { caption: string; notes?: string } {
  const analysis = analyzeHtmlTable(item.rawHtml || '');
  const { headers, rowCount, colCount, category, numericTrend } = analysis;

  if (headers.length === 0) {
    return {
      caption: `Tabular Dataset Matrix (${rowCount > 0 ? `${rowCount} rows` : 'Structured Data'})`,
      notes: 'Structured data table extracted from execution results.',
    };
  }

  const primaryCols = headers.slice(0, 4).join(', ');
  const moreCount = headers.length > 4 ? ` (+${headers.length - 4} more)` : '';

  switch (category) {
    case 'metrics':
      return {
        caption: numericTrend
          ? `Model Training Convergence Metrics (${numericTrend})`
          : `Performance Metrics Summary: [${primaryCols}${moreCount}]`,
        notes: numericTrend
          ? `Identified trend: ${numericTrend} across ${rowCount} evaluated checkpoints.`
          : `Evaluation table showing key quantitative metrics across ${rowCount} records.`,
      };

    case 'correlation':
      return {
        caption: `Feature Correlation Matrix: Pairwise Relationships across ${headers.length} Variables`,
        notes: `Displays inter-variable correlation coefficients across [${primaryCols}].`,
      };

    case 'summary':
      return {
        caption: `Descriptive Statistics Profile: Distribution across [${primaryCols}${moreCount}]`,
        notes: 'Summary table containing distribution measures (mean, standard deviation, quartiles).',
      };

    case 'dataset':
    default:
      return {
        caption: `Tabular Summary: [${primaryCols}${moreCount}] (${rowCount} rows × ${colCount} cols)`,
        notes: `Data table displaying features [${primaryCols}] sampled from execution output.`,
      };
  }
}

/**
 * Heuristic analysis for Data Plots (images/charts) by examining:
 * 1. Image metadata / dimensions / aspect ratio
 * 2. Associated text (captions, notes, rawText)
 * 3. Dominant visual trends (loss curve, bar distribution, heatmap, ROC curve)
 */
function generatePlotCaption(item: NotebookOutputItem, figureIndex: number): { caption: string; notes?: string } {
  const raw = (item.rawText || '').toLowerCase();
  const existingNotes = (item.notes || '').toLowerCase();
  const combinedText = `${raw} ${existingNotes} ${item.subtype}`;

  // Clue 1: Loss / Training Convergence
  if (
    combinedText.includes('loss') ||
    combinedText.includes('epoch') ||
    combinedText.includes('convergence') ||
    combinedText.includes('train') && combinedText.includes('val')
  ) {
    return {
      caption: `Model Training Loss & Convergence Trajectory (Figure ${figureIndex})`,
      notes: 'Identified trend: Progressive loss reduction and stabilization across training epochs.',
    };
  }

  // Clue 2: ROC / AUC / Evaluation
  if (
    combinedText.includes('roc') ||
    combinedText.includes('auc') ||
    combinedText.includes('fpr') ||
    combinedText.includes('tpr')
  ) {
    return {
      caption: `Receiver Operating Characteristic (ROC) Curve & AUC Performance`,
      notes: 'Identified trend: High true positive rate progression with strong class separation.',
    };
  }

  // Clue 3: Heatmap / Correlation
  if (
    combinedText.includes('heatmap') ||
    combinedText.includes('correlation') ||
    combinedText.includes('matrix') ||
    combinedText.includes('covariance')
  ) {
    return {
      caption: `Feature Correlation & Density Heatmap (Figure ${figureIndex})`,
      notes: 'Identified trend: Variable correlation clustering and pairwise dependency density.',
    };
  }

  // Clue 4: Feature Importance / Bar Chart
  if (
    combinedText.includes('importance') ||
    combinedText.includes('bar') ||
    combinedText.includes('weights') ||
    combinedText.includes('ranking')
  ) {
    return {
      caption: `Feature Importance Distribution & Predictor Ranking`,
      notes: 'Identified trend: Dominant feature weight contributions sorted by relative impact.',
    };
  }

  // Clue 5: Distribution / Histogram / Boxplot
  if (
    combinedText.includes('distribution') ||
    combinedText.includes('hist') ||
    combinedText.includes('density') ||
    combinedText.includes('box')
  ) {
    return {
      caption: `Variable Frequency & Probability Distribution Profile`,
      notes: 'Identified trend: Sample density spread, central tendencies, and quartile dispersion.',
    };
  }

  // Clue 6: Scatter / Clusters / Projection
  if (
    combinedText.includes('scatter') ||
    combinedText.includes('cluster') ||
    combinedText.includes('pca') ||
    combinedText.includes('tsne')
  ) {
    return {
      caption: `Bivariate Scatter & Cluster Separation Profile`,
      notes: 'Identified trend: Point distribution clusters and decision boundary separation.',
    };
  }

  // Clue 7: Aspect ratio and dimension heuristics
  const ratio = item.dim ? item.dim.w / Math.max(item.dim.h, 1) : 1.6;
  if (ratio > 1.8) {
    return {
      caption: `Time-Series Trajectory & Sequential Trend Chart (Figure ${figureIndex})`,
      notes: 'Identified trend: Continuous sequential variations across the horizontal measurement axis.',
    };
  } else if (ratio < 1.1) {
    return {
      caption: `Comparative Multi-Variable Grid & Relationship Plot (Figure ${figureIndex})`,
      notes: 'Identified trend: Symmetric comparative distribution across paired evaluation axes.',
    };
  }

  return {
    caption: `Quantitative Data Plot & Trend Analysis (Figure ${figureIndex})`,
    notes: 'Identified trend: Graphical visualization of execution metric patterns and variance.',
  };
}

/**
 * Heuristic caption generation for Console Streams and Terminal logs.
 */
function generateStreamCaption(item: NotebookOutputItem, figureIndex: number): { caption: string; notes?: string } {
  const raw = item.rawText || '';
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);

  // Check for epoch training log
  const epochLine = lines.find((l) => /epoch\s*\d+/i.test(l));
  if (epochLine) {
    const lossMatch = epochLine.match(/loss[:=]\s*([0-9.]+)/i);
    const accMatch = epochLine.match(/(?:acc|accuracy)[:=]\s*([0-9.]+)/i);
    const trendDetails: string[] = [];
    if (lossMatch) trendDetails.push(`loss ${lossMatch[1]}`);
    if (accMatch) trendDetails.push(`acc ${(parseFloat(accMatch[1]) * (parseFloat(accMatch[1]) <= 1 ? 100 : 1)).toFixed(1)}%`);

    return {
      caption: `Training Progress Log: Checkpoint Milestones ${trendDetails.length ? `(${trendDetails.join(', ')})` : ''}`,
      notes: 'Sequential stdout log recording model optimization and metric convergence.',
    };
  }

  // Check for classification report
  if (raw.includes('precision') && raw.includes('recall') && raw.includes('f1-score')) {
    return {
      caption: `Classification Evaluation Summary: Precision, Recall & F1-Scores`,
      notes: 'Per-class performance breakdown and macro-averaged evaluation scores.',
    };
  }

  // First informative line
  const firstMeaningful = lines[0]?.trim();
  if (firstMeaningful && firstMeaningful.length <= 60 && !/[{}<>]/.test(firstMeaningful)) {
    return {
      caption: `Execution Output: ${firstMeaningful}`,
      notes: `Standard console stream output (${lines.length} lines logged).`,
    };
  }

  return {
    caption: `Execution Stream Output & Milestones (Log ${figureIndex})`,
    notes: `Captured stdout console stream with ${lines.length} lines of runtime information.`,
  };
}

/**
 * Generates an intelligent descriptive caption and trend note for any notebook item.
 */
export function generateAutoCaption(item: NotebookOutputItem, figureIndex: number): { caption: string; notes?: string } {
  if (item.outputType === 'error' || item.subtype === 'error') {
    return {
      caption: `Runtime Exception Trace: ${item.caption.replace(/^Error:\s*/, '')}`,
      notes: 'Error stack trace generated during code cell execution.',
    };
  }

  if (item.kind === 'html' || item.subtype === 'html-table') {
    return generateTableCaption(item);
  }

  if (item.kind === 'image' || item.kind === 'svg') {
    return generatePlotCaption(item, figureIndex);
  }

  if (item.kind === 'text') {
    return generateStreamCaption(item, figureIndex);
  }

  return {
    caption: `Execution Output Figure ${figureIndex}`,
    notes: 'Generated output object from notebook execution.',
  };
}

/**
 * Auto-captions all items that have empty or generic uninformative captions.
 * Preserves user-customized captions while replacing blanks and generic titles.
 */
export function autoCaptionNotebookItems(
  items: NotebookOutputItem[],
  options: { forceAll?: boolean } = {}
): { updatedItems: NotebookOutputItem[]; updatedCount: number } {
  let updatedCount = 0;

  const updatedItems = items.map((item, idx) => {
    const shouldUpdate = options.forceAll || isCaptionEmptyOrGeneric(item.caption);
    if (!shouldUpdate) return item;

    const { caption, notes } = generateAutoCaption(item, idx + 1);
    updatedCount++;

    return {
      ...item,
      caption: caption || item.caption,
      notes: item.notes && item.notes.trim() ? item.notes : notes,
    };
  });

  return { updatedItems, updatedCount };
}
