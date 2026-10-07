import { NotebookOutputItem, DocxConfig } from '../types/notebook';

export type AspectRatioType = 'wide' | 'tall' | 'square';

export interface IntelligentBlockPreview {
  id: string;
  figNumber: number;
  label: string;
  caption: string;
  aspectRatio: number;
  aspectType: AspectRatioType;
  widthPercent: number; // 100 for full-width, 50 for paired
  colorScheme: 'blue' | 'indigo' | 'emerald';
}

export interface IntelligentPageMockup {
  pageNumber: number;
  isCover: boolean;
  title: string;
  subtitle?: string;
  blocks: IntelligentBlockPreview[];
  layoutType: 'cover' | 'full-width' | 'paired' | 'mixed';
  densityRating: 'optimal' | 'dense' | 'standard';
}

export interface IntelligentLayoutRow {
  type: 'single' | 'pair';
  items: NotebookOutputItem[];
  aspectType: 'wide' | 'paired' | 'single';
  estimatedHeightPt: number;
}

export interface IntelligentLayoutSummary {
  totalActiveFigures: number;
  wideCount: number;
  tallCount: number;
  squareCount: number;
  pairedCount: number;
  rows: IntelligentLayoutRow[];
  intelligentPagesCount: number;
  standardPagesCount: number;
  pagesSaved: number;
  densityIncreasePercent: number;
  whitespaceReductionPercent: number;
  pageMockups: IntelligentPageMockup[];
}

/**
 * Classifies an output item's aspect ratio
 */
export function classifyAspectRatio(item: NotebookOutputItem): {
  ratio: number;
  type: AspectRatioType;
  badge: string;
} {
  const w = item.dim?.w || 800;
  const h = item.dim?.h || 600;
  const ratio = Math.max(0.1, Number((w / h).toFixed(2)));

  if (item.kind === 'html' || item.subtype === 'html-table' || ratio >= 1.6) {
    return { ratio, type: 'wide', badge: 'Wide / Landscape' };
  }
  if (ratio <= 0.95) {
    return { ratio, type: 'tall', badge: 'Tall / Portrait' };
  }
  return { ratio, type: 'square', badge: 'Balanced / Square' };
}

/**
 * Reorders figures by aspect-ratio affinity to maximize document packing density
 * Pairs compact figures together and places wide/hero figures cleanly.
 */
export function rearrangeByIntelligentGrid(
  items: NotebookOutputItem[]
): NotebookOutputItem[] {
  if (items.length <= 1) return [...items];

  // Separate into wide (single-row heroes) and compact (side-by-side candidates)
  const wideItems: NotebookOutputItem[] = [];
  const compactItems: NotebookOutputItem[] = [];

  items.forEach((item) => {
    const { type } = classifyAspectRatio(item);
    if (type === 'wide') {
      wideItems.push(item);
    } else {
      compactItems.push(item);
    }
  });

  // Sort compact items by aspect ratio closeness so paired items have identical heights
  compactItems.sort((a, b) => {
    const ratioA = (a.dim?.w || 800) / (a.dim?.h || 600);
    const ratioB = (b.dim?.w || 800) / (b.dim?.h || 600);
    return ratioA - ratioB;
  });

  // Interleave: Wide figures as section headers, followed by pairs of compact figures
  const arranged: NotebookOutputItem[] = [];
  let wideIdx = 0;
  let compactIdx = 0;

  while (wideIdx < wideItems.length || compactIdx < compactItems.length) {
    // If we have a wide item and we need an opening hero or break
    if (wideIdx < wideItems.length && (arranged.length === 0 || compactIdx % 4 === 0 || compactIdx >= compactItems.length)) {
      arranged.push(wideItems[wideIdx++]);
    }
    // Take a pair of compact items
    if (compactIdx < compactItems.length) {
      arranged.push(compactItems[compactIdx++]);
      if (compactIdx < compactItems.length) {
        arranged.push(compactItems[compactIdx++]);
      }
    } else if (wideIdx < wideItems.length) {
      arranged.push(wideItems[wideIdx++]);
    }
  }

  return arranged;
}

/**
 * Computes intelligent document layout, page footprint, and visual mockups
 */
export function computeIntelligentLayout(
  items: NotebookOutputItem[],
  config: DocxConfig
): IntelligentLayoutSummary {
  const activeItems = items.filter((i) => i.selected !== false);
  const total = activeItems.length;

  let wideCount = 0;
  let tallCount = 0;
  let squareCount = 0;

  activeItems.forEach((it) => {
    const { type } = classifyAspectRatio(it);
    if (type === 'wide') wideCount++;
    else if (type === 'tall') tallCount++;
    else squareCount++;
  });

  // Compute Layout Rows (aspect ratio aware packing)
  const rows: IntelligentLayoutRow[] = [];
  let i = 0;

  while (i < activeItems.length) {
    const current = activeItems[i];
    const { type: currentType } = classifyAspectRatio(current);

    if (currentType === 'wide') {
      // Wide item takes a full row
      rows.push({
        type: 'single',
        items: [current],
        aspectType: 'wide',
        estimatedHeightPt: 340,
      });
      i++;
    } else {
      // Compact item: look for next compact item to pair with
      const next = i + 1 < activeItems.length ? activeItems[i + 1] : null;
      if (next) {
        const { type: nextType } = classifyAspectRatio(next);
        if (nextType !== 'wide') {
          // Pair them side-by-side
          rows.push({
            type: 'pair',
            items: [current, next],
            aspectType: 'paired',
            estimatedHeightPt: 280,
          });
          i += 2;
          continue;
        }
      }
      // Single compact item
      rows.push({
        type: 'single',
        items: [current],
        aspectType: 'single',
        estimatedHeightPt: 300,
      });
      i++;
    }
  }

  const pairedCount = rows.filter((r) => r.type === 'pair').length * 2;

  // Calculate Page Footprint
  const hasCover = Boolean(config.titlePage);
  const addPageBreaks = Boolean(config.addPageBreaks);

  let intelligentContentPages = 0;
  if (addPageBreaks) {
    // 1 row per page
    intelligentContentPages = Math.max(1, rows.length);
  } else {
    // Continuous dense flow: approximately 2 rows per printable page (~650 pt)
    let currentAccumulatedPt = 0;
    let pageCount = 1;
    rows.forEach((r) => {
      if (currentAccumulatedPt + r.estimatedHeightPt > 640) {
        pageCount++;
        currentAccumulatedPt = r.estimatedHeightPt;
      } else {
        currentAccumulatedPt += r.estimatedHeightPt;
      }
    });
    intelligentContentPages = pageCount;
  }

  const intelligentPagesCount = (hasCover ? 1 : 0) + intelligentContentPages;

  // Standard Single-Column baseline
  let standardContentPages = 0;
  if (addPageBreaks) {
    standardContentPages = total;
  } else {
    // 1.5 single figures per page on average
    standardContentPages = Math.max(1, Math.ceil(total / 1.5));
  }
  const standardPagesCount = (hasCover ? 1 : 0) + standardContentPages;

  const pagesSaved = Math.max(0, standardPagesCount - intelligentPagesCount);
  const densityIncreasePercent = Math.min(
    60,
    Math.round((pagesSaved / Math.max(1, standardPagesCount)) * 100) ||
      Math.round((pairedCount / Math.max(1, total * 2)) * 60)
  );
  const whitespaceReductionPercent = Math.min(
    55,
    Math.round(25 + (pairedCount / Math.max(1, total)) * 30)
  );

  // Generate interactive page mockups for the visual helper
  const pageMockups: IntelligentPageMockup[] = [];
  let currentPageNum = 1;

  if (hasCover) {
    pageMockups.push({
      pageNumber: currentPageNum++,
      isCover: true,
      title: config.reportTitle || 'Report Cover Page',
      subtitle: config.reportSubtitle || `${total} Extracted Figures`,
      blocks: [],
      layoutType: 'cover',
      densityRating: 'optimal',
    });
  }

  // Distribute rows across mockups
  const maxRowsPerPage = addPageBreaks ? 1 : 2;
  for (let rIdx = 0; rIdx < rows.length; rIdx += maxRowsPerPage) {
    const pageRows = rows.slice(rIdx, rIdx + maxRowsPerPage);
    const blocks: IntelligentBlockPreview[] = [];

    pageRows.forEach((row) => {
      if (row.type === 'single') {
        const item = row.items[0];
        const { ratio, type } = classifyAspectRatio(item);
        const figIdx = activeItems.findIndex((it) => it.id === item.id) + 1;
        blocks.push({
          id: item.id,
          figNumber: figIdx,
          label: `Figure ${String(figIdx).padStart(2, '0')}`,
          caption: item.caption || 'Output figure',
          aspectRatio: ratio,
          aspectType: type,
          widthPercent: 100,
          colorScheme: 'blue',
        });
      } else {
        row.items.forEach((item) => {
          const { ratio, type } = classifyAspectRatio(item);
          const figIdx = activeItems.findIndex((it) => it.id === item.id) + 1;
          blocks.push({
            id: item.id,
            figNumber: figIdx,
            label: `Fig ${String(figIdx).padStart(2, '0')}`,
            caption: item.caption || 'Output figure',
            aspectRatio: ratio,
            aspectType: type,
            widthPercent: 50,
            colorScheme: 'indigo',
          });
        });
      }
    });

    const isAllPaired = blocks.every((b) => b.widthPercent === 50);
    const isAllFull = blocks.every((b) => b.widthPercent === 100);

    pageMockups.push({
      pageNumber: currentPageNum++,
      isCover: false,
      title: `Page ${currentPageNum - 1}`,
      blocks,
      layoutType: isAllPaired ? 'paired' : isAllFull ? 'full-width' : 'mixed',
      densityRating: isAllPaired ? 'dense' : 'optimal',
    });
  }

  return {
    totalActiveFigures: total,
    wideCount,
    tallCount,
    squareCount,
    pairedCount,
    rows,
    intelligentPagesCount,
    standardPagesCount,
    pagesSaved,
    densityIncreasePercent,
    whitespaceReductionPercent,
    pageMockups,
  };
}
