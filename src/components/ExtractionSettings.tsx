import React, { useState } from 'react';
import { Settings2, FileText, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { ExtractionConfig, DocxConfig } from '../types/notebook';

interface ExtractionSettingsProps {
  extractionConfig: ExtractionConfig;
  onExtractionConfigChange: (config: ExtractionConfig) => void;
  docxConfig: DocxConfig;
  onDocxConfigChange: (config: DocxConfig) => void;
  disabled: boolean;
}

export const ExtractionSettings: React.FC<ExtractionSettingsProps> = ({
  extractionConfig,
  onExtractionConfigChange,
  docxConfig,
  onDocxConfigChange,
  disabled,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'docx'>('rules');

  const updateExtraction = (key: keyof ExtractionConfig, val: boolean) => {
    onExtractionConfigChange({ ...extractionConfig, [key]: val });
  };

  const updateDocx = <K extends keyof DocxConfig>(key: K, val: DocxConfig[K]) => {
    onDocxConfigChange({ ...docxConfig, [key]: val });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'rules'
              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
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
              ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
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
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Filter Outputs
              </span>
              <span className="text-[10px] text-slate-400">Pure output objects only</span>
            </div>

            <label className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={extractionConfig.includeDisplayData}
                onChange={(e) => updateExtraction('includeDisplayData', e.target.checked)}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">Plots, Charts & Tables</span>
                <p className="text-[11px] text-slate-500">
                  Matplotlib, Seaborn, Plotly, Pandas DataFrames
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={extractionConfig.includeStreams}
                onChange={(e) => updateExtraction('includeStreams', e.target.checked)}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">Console Streams</span>
                <p className="text-[11px] text-slate-500">
                  print() logs, epoch updates, stdout & stderr
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={extractionConfig.includeErrors}
                onChange={(e) => updateExtraction('includeErrors', e.target.checked)}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">Execution Errors</span>
                <p className="text-[11px] text-slate-500">
                  Exceptions and tracebacks formatted in red
                </p>
              </div>
            </label>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                Formatting Engine
              </span>

              <label className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={extractionConfig.autoInferCaptions}
                  onChange={(e) => updateExtraction('autoInferCaptions', e.target.checked)}
                  disabled={disabled}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">Smart Caption Detection</span>
                  <p className="text-[11px] text-slate-500">
                    Auto-detects titles from plt.title() and dataframe variables
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-slate-50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={extractionConfig.mergeConsecutiveStreams}
                  onChange={(e) => updateExtraction('mergeConsecutiveStreams', e.target.checked)}
                  disabled={disabled}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">Merge Consecutive Logs</span>
                  <p className="text-[11px] text-slate-500">
                    Combines multi-line prints in one clean figure
                  </p>
                </div>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Title Page */}
            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1 cursor-pointer">
                <span>Include Cover / Title Page</span>
                <input
                  type="checkbox"
                  checked={docxConfig.titlePage}
                  onChange={(e) => updateDocx('titlePage', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
              {docxConfig.titlePage && (
                <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-2.5 border border-slate-200/70">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Report Title
                    </label>
                    <input
                      type="text"
                      value={docxConfig.reportTitle}
                      onChange={(e) => updateDocx('reportTitle', e.target.value)}
                      placeholder="e.g. Model Evaluation Report"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Subtitle / Abstract
                    </label>
                    <input
                      type="text"
                      value={docxConfig.reportSubtitle}
                      onChange={(e) => updateDocx('reportSubtitle', e.target.value)}
                      placeholder="e.g. Performance metrics and loss curves"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Author / Organization
                    </label>
                    <input
                      type="text"
                      value={docxConfig.authorName}
                      onChange={(e) => updateDocx('authorName', e.target.value)}
                      placeholder="e.g. Data Science Team"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Typography */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Word Typography Font
              </label>
              <select
                value={docxConfig.fontFamily}
                onChange={(e) => updateDocx('fontFamily', e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="Aptos">Aptos (Modern Microsoft Default)</option>
                <option value="Calibri">Calibri (Classic Office)</option>
                <option value="Arial">Arial (Standard Sans)</option>
                <option value="Georgia">Georgia (Refined Serif)</option>
              </select>
            </div>

            {/* Layout Options */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
                <span>Number Figures (Figure 01, 02...)</span>
                <input
                  type="checkbox"
                  checked={docxConfig.labelCaption}
                  onChange={(e) => updateDocx('labelCaption', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
                <span>Include Source Cell References</span>
                <input
                  type="checkbox"
                  checked={docxConfig.addCellRef}
                  onChange={(e) => updateDocx('addCellRef', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
                <span>Page Break After Each Figure</span>
                <input
                  type="checkbox"
                  checked={docxConfig.addPageBreaks}
                  onChange={(e) => updateDocx('addPageBreaks', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>

            {/* Target file name */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Document Filename
              </label>
              <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden">
                <input
                  type="text"
                  value={docxConfig.fileName}
                  onChange={(e) => updateDocx('fileName', e.target.value)}
                  placeholder="colab_outputs"
                  className="flex-1 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                />
                <span className="bg-slate-100 px-2 py-1.5 text-[11px] font-mono text-slate-500 border-l border-slate-200">
                  .docx
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
