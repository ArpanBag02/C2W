export type OutputKind = 'image' | 'html' | 'text' | 'svg';

export interface NotebookOutputItem {
  id: string;
  cellIndex: number;
  outputIndex: number;
  executionCount: number | null;
  outputType: string;
  kind: OutputKind;
  subtype: string;
  caption: string;
  notes?: string;
  author?: string;
  reportDate?: string;
  sectionTag?: string;
  src: string; // Data URL for rendering & DOCX embedding
  rawText?: string;
  rawHtml?: string;
  dim: { w: number; h: number };
  selected?: boolean;
  empty?: boolean;
}

export interface ExtractionConfig {
  includeDisplayData: boolean;
  includeStreams: boolean;
  includeErrors: boolean;
  includeEmpty: boolean;
  mergeConsecutiveStreams: boolean;
  autoInferCaptions: boolean;
}

export type ReportTemplateId = 'formal-research' | 'executive-summary' | 'academic-paper';

export type WordAutoLayout = 'single-column' | 'side-by-side';

export interface DocxConfig {
  titlePage: boolean;
  reportTitle: string;
  reportSubtitle: string;
  authorName: string;
  reportDate?: string;
  labelCaption: boolean;
  addCellRef: boolean;
  addPageBreaks: boolean;
  fontFamily: 'Aptos' | 'Calibri' | 'Arial' | 'Georgia';
  fileName: string;
  template?: ReportTemplateId;
  autoLayout?: WordAutoLayout;
  intelligentGrid?: boolean;
}

export interface NotebookMeta {
  name: string;
  size: number;
  totalCells: number;
  codeCells: number;
  markdownCells: number;
  kernelName?: string;
}
