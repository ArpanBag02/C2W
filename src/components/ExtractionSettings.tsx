import React, { useState } from 'react';
import {
  Settings2,
  FileText,
  Sliders,
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
  Loader2,
  Wand2,
  TrendingUp,
  Table,
  LayoutTemplate,
  Columns,
  Square,
  Check,
  Bookmark,
  Layers,
  Sparkle,
} from 'lucide-react';
import { ExtractionConfig, DocxConfig, WordAutoLayout, ReportTemplateId } from '../types/notebook';
import { REPORT_TEMPLATES, applyReportTemplate } from '../utils/reportTemplates';

interface ExtractionSettingsProps {
  extractionConfig: ExtractionConfig;
  onExtractionConfigChange: (config: ExtractionConfig) => void;
  docxConfig: DocxConfig;
  onDocxConfigChange: (config: DocxConfig) => void;
  disabled: boolean;
  onPreviewDocx?: () => void;
  onGenerateAllCaptions?: () => void;
  itemCount?: number;
  emptyCaptionCount?: number;
  isCaptioning?: boolean;
}

export const ExtractionSettings: React.FC<ExtractionSettingsProps> = ({
  extractionConfig,
  onExtractionConfigChange,
  docxConfig,
  onDocxConfigChange,
  disabled,
  onPreviewDocx,
  onGenerateAllCaptions,
  itemCount = 0,
  emptyCaptionCount = 0,
  isCaptioning = false,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'docx'>('rules');

  const updateExtraction = (key: keyof ExtractionConfig, val: boolean) => {
    onExtractionConfigChange({ ...extractionConfig, [key]: val });
  };

  const updateDocx = <K extends keyof DocxConfig>(key: K, val: DocxConfig[K]) => {
    onDocxConfigChange({ ...docxConfig, [key]: val });
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden transition-colors">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'rules'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs border border-slate-200/80 dark:border-slate-600'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Extraction Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('docx')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'docx'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs border border-slate-200/80 dark:border-slate-600'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Word Styling</span>
        </button>
      </div>

      <div className="p-4 space-y-3.5">
        {activeTab === 'rules' ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Filter Outputs
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Pure output objects only</span>
            </div>

            <label className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
              <input
                type="checkbox"
                checked={extractionConfig.includeDisplayData}
                onChange={(e) => updateExtraction('includeDisplayData', e.target.checked)}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Plots, Charts & Tables</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Matplotlib, Seaborn, Plotly, Pandas DataFrames
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
              <input
                type="checkbox"
                checked={extractionConfig.includeStreams}
                onChange={(e) => updateExtraction('includeStreams', e.target.checked)}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Console Streams</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  print() logs, epoch updates, stdout & stderr
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
              <input
                type="checkbox"
                checked={extractionConfig.includeErrors}
                onChange={(e) => updateExtraction('includeErrors', e.target.checked)}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Execution Errors</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Exceptions and tracebacks formatted in red
                </p>
              </div>
            </label>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Formatting Engine
              </span>

              <label className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={extractionConfig.autoInferCaptions}
                  onChange={(e) => updateExtraction('autoInferCaptions', e.target.checked)}
                  disabled={disabled}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Smart Caption Detection</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Auto-detects titles from plt.title() and dataframe variables
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={extractionConfig.mergeConsecutiveStreams}
                  onChange={(e) => updateExtraction('mergeConsecutiveStreams', e.target.checked)}
                  disabled={disabled}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Merge Consecutive Logs</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Combines multi-line prints in one clean figure
                  </p>
                </div>
              </label>
            </div>

            {/* AI-Assisted Auto-Captioning Section */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 via-blue-50/40 to-slate-50 dark:from-slate-850 dark:via-indigo-950/30 dark:to-slate-900 p-3 shadow-2xs">
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600 text-white shadow-2xs">
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">AI Auto-Captioning</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100/80 dark:bg-indigo-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                    <TrendingUp className="h-2.5 w-2.5" />
                    <span>Trend Heuristic</span>
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2.5">
                  Identifies trends in data plots (loss trajectories, distributions) and inspects table column headers to generate descriptive captions for empty figures.
                </p>

                {itemCount > 0 && (
                  <div className="mb-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 rounded-lg px-2 py-1 border border-slate-200/60 dark:border-slate-700">
                    <span>Target figures:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {emptyCaptionCount > 0 ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{emptyCaptionCount} empty caption{emptyCaptionCount > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">All figures captioned</span>
                      )}
                      <span className="text-slate-400 dark:text-slate-500 font-normal"> / {itemCount} total</span>
                    </span>
                  </div>
                )}

                <button
                  id="btn-generate-all-captions"
                  type="button"
                  onClick={onGenerateAllCaptions}
                  disabled={disabled || isCaptioning || itemCount === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 py-2 px-3 text-xs font-semibold text-white shadow-sm shadow-indigo-500/20 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  title={itemCount === 0 ? 'Extract or load a notebook first to generate captions' : 'Generate descriptive captions for empty and generic figure captions'}
                >
                  {isCaptioning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      <span>Analyzing Trends & Headers...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5 text-indigo-100" />
                      <span>Generate All Captions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 1. Report Templates Section */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/60 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <LayoutTemplate className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Report Templates
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                  Preset Word Styles
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                Apply consistent document hierarchy, typography, and page structure across your figures.
              </p>

              <div className="space-y-2">
                {REPORT_TEMPLATES.map((tpl) => {
                  const isSelected =
                    docxConfig.template === tpl.id ||
                    (!docxConfig.template && tpl.id === 'formal-research');

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => onDocxConfigChange(applyReportTemplate(docxConfig, tpl.id))}
                      className={`relative flex flex-col p-2.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'border-blue-500 bg-white dark:bg-slate-800 shadow-xs ring-1 ring-blue-500/50'
                          : 'border-slate-200 dark:border-slate-750 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 text-transparent'
                            }`}
                          >
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {tpl.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/80 px-1.5 py-0.5 rounded">
                          {tpl.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6 leading-tight">
                        {tpl.description}
                      </p>

                      {/* Preset feature tags */}
                      <div className="mt-2 pl-6 flex flex-wrap gap-1.5 text-[10px]">
                        <span className="rounded bg-slate-100 dark:bg-slate-750 px-1.5 py-0.5 text-slate-600 dark:text-slate-300 font-mono">
                          {tpl.fontFamily}
                        </span>
                        <span className="rounded bg-slate-100 dark:bg-slate-750 px-1.5 py-0.5 text-slate-600 dark:text-slate-300">
                          {tpl.autoLayout === 'side-by-side' ? 'Side-by-Side' : 'Single-Col'}
                        </span>
                        {tpl.addCellRef && (
                          <span className="rounded bg-slate-100 dark:bg-slate-750 px-1.5 py-0.5 text-slate-600 dark:text-slate-300">
                            Cell Refs
                          </span>
                        )}
                        {tpl.addPageBreaks && (
                          <span className="rounded bg-slate-100 dark:bg-slate-750 px-1.5 py-0.5 text-slate-600 dark:text-slate-300">
                            Page Breaks
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Auto-Layout Setting Section */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/60 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Columns className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Auto-Layout (Page Space)
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
                  Image Utilization
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                Configure how figures are placed in the exported Word and PDF documents.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {/* Single-Column Toggle */}
                <button
                  type="button"
                  id="btn-autolayout-single"
                  onClick={() => updateDocx('autoLayout', 'single-column')}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                    (docxConfig.autoLayout || 'single-column') === 'single-column'
                      ? 'border-indigo-500 bg-white dark:bg-slate-800 shadow-xs ring-1 ring-indigo-500/50'
                      : 'border-slate-200 dark:border-slate-750 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Single-Column
                    </span>
                    <Square className={`h-3.5 w-3.5 ${
                      (docxConfig.autoLayout || 'single-column') === 'single-column'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400'
                    }`} />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Full width figures (1 per row). Best for complex charts & loss plots.
                  </p>
                </button>

                {/* Side-by-Side Toggle */}
                <button
                  type="button"
                  id="btn-autolayout-sidebyside"
                  onClick={() => updateDocx('autoLayout', 'side-by-side')}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                    docxConfig.autoLayout === 'side-by-side'
                      ? 'border-indigo-500 bg-white dark:bg-slate-800 shadow-xs ring-1 ring-indigo-500/50'
                      : 'border-slate-200 dark:border-slate-750 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Side-by-Side
                    </span>
                    <Columns className={`h-3.5 w-3.5 ${
                      docxConfig.autoLayout === 'side-by-side'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400'
                    }`} />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    2 figures per row in table grid. Saves 50% page space.
                  </p>
                </button>
              </div>
            </div>

            {/* 3. Detailed Customization Accordion / Controls */}
            {/* Title Page */}
            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 cursor-pointer">
                <span>Include Cover / Title Page</span>
                <input
                  type="checkbox"
                  checked={docxConfig.titlePage}
                  onChange={(e) => updateDocx('titlePage', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
              </label>
              {docxConfig.titlePage && (
                <div className="mt-2 space-y-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200/70 dark:border-slate-700">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                      Report Title
                    </label>
                    <input
                      type="text"
                      value={docxConfig.reportTitle}
                      onChange={(e) => updateDocx('reportTitle', e.target.value)}
                      placeholder="e.g. Model Evaluation Report"
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                      Subtitle / Abstract
                    </label>
                    <input
                      type="text"
                      value={docxConfig.reportSubtitle}
                      onChange={(e) => updateDocx('reportSubtitle', e.target.value)}
                      placeholder="e.g. Performance metrics and loss curves"
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                      Author / Organization
                    </label>
                    <input
                      type="text"
                      value={docxConfig.authorName}
                      onChange={(e) => updateDocx('authorName', e.target.value)}
                      placeholder="e.g. Data Science Team"
                      className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Typography */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Word Typography Font
              </label>
              <select
                value={docxConfig.fontFamily}
                onChange={(e) => updateDocx('fontFamily', e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="Aptos">Aptos (Modern Microsoft Default)</option>
                <option value="Calibri">Calibri (Classic Office)</option>
                <option value="Arial">Arial (Standard Sans)</option>
                <option value="Georgia">Georgia (Refined Serif)</option>
              </select>
            </div>

            {/* Layout Options */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Number Figures (Figure 01, 02...)</span>
                <input
                  type="checkbox"
                  checked={docxConfig.labelCaption}
                  onChange={(e) => updateDocx('labelCaption', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Include Source Cell References</span>
                <input
                  type="checkbox"
                  checked={docxConfig.addCellRef}
                  onChange={(e) => updateDocx('addCellRef', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Page Break After Each Figure</span>
                <input
                  type="checkbox"
                  checked={docxConfig.addPageBreaks}
                  onChange={(e) => updateDocx('addPageBreaks', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>

            {/* Target file name */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                Document Filename
              </label>
              <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden">
                <input
                  type="text"
                  value={docxConfig.fileName}
                  onChange={(e) => updateDocx('fileName', e.target.value)}
                  placeholder="colab_outputs"
                  className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none"
                />
                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-600">
                  .docx
                </span>
              </div>
            </div>

            {onPreviewDocx && (
              <button
                type="button"
                onClick={onPreviewDocx}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/50 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 py-2 px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 transition active:scale-95 shadow-2xs"
              >
                <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Display Prepared Word File</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
