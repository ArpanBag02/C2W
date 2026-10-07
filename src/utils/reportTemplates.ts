import { DocxConfig, ReportTemplateId, WordAutoLayout } from '../types/notebook';

export interface ReportTemplateDefinition {
  id: ReportTemplateId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  fontFamily: 'Aptos' | 'Calibri' | 'Arial' | 'Georgia';
  titlePage: boolean;
  labelCaption: boolean;
  addCellRef: boolean;
  addPageBreaks: boolean;
  autoLayout: WordAutoLayout;
  accentColorXml: string;
  accentHex: string;
  accentBgClass: string;
  borderClass: string;
}

export const REPORT_TEMPLATES: ReportTemplateDefinition[] = [
  {
    id: 'formal-research',
    name: 'Formal Research',
    tagline: 'Standard IEEE/ACM corporate R&D format',
    description: 'Formal cover page, numbered figures, notebook execution counts, and dedicated page breaks for each figure.',
    badge: 'R&D / Engineering',
    fontFamily: 'Aptos',
    titlePage: true,
    labelCaption: true,
    addCellRef: true,
    addPageBreaks: true,
    autoLayout: 'single-column',
    accentColorXml: '1E3A8A',
    accentHex: '#1e3a8a',
    accentBgClass: 'bg-blue-900',
    borderClass: 'border-blue-700',
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    tagline: 'High-impact modern brief for stakeholders',
    description: 'Clean serif typography, side-by-side compact figures, and no raw code cell clutter for executive readability.',
    badge: 'Stakeholder Brief',
    fontFamily: 'Georgia',
    titlePage: true,
    labelCaption: true,
    addCellRef: false,
    addPageBreaks: false,
    autoLayout: 'side-by-side',
    accentColorXml: '0F172A',
    accentHex: '#0f172a',
    accentBgClass: 'bg-slate-900',
    borderClass: 'border-slate-800',
  },
  {
    id: 'academic-paper',
    name: 'Academic Paper',
    tagline: 'Peer-reviewed journal manuscript layout',
    description: 'Classic Georgia serif, continuous document flow, comprehensive cell provenance, and formal figure labels.',
    badge: 'Journal Publication',
    fontFamily: 'Georgia',
    titlePage: true,
    labelCaption: true,
    addCellRef: true,
    addPageBreaks: false,
    autoLayout: 'single-column',
    accentColorXml: '1E293B',
    accentHex: '#1e293b',
    accentBgClass: 'bg-indigo-950',
    borderClass: 'border-indigo-800',
  },
];

export function getTemplateById(id?: ReportTemplateId): ReportTemplateDefinition {
  return (
    REPORT_TEMPLATES.find((t) => t.id === id) || REPORT_TEMPLATES[0]
  );
}

export function applyReportTemplate(
  config: DocxConfig,
  templateId: ReportTemplateId
): DocxConfig {
  const tpl = getTemplateById(templateId);
  return {
    ...config,
    template: templateId,
    fontFamily: tpl.fontFamily,
    titlePage: tpl.titlePage,
    labelCaption: tpl.labelCaption,
    addCellRef: tpl.addCellRef,
    addPageBreaks: tpl.addPageBreaks,
    autoLayout: tpl.autoLayout,
  };
}
