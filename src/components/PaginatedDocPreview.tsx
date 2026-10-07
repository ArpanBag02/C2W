import React from 'react';
import { NotebookOutputItem, DocxConfig } from '../types/notebook';
import { FileText, Download, Sparkles } from 'lucide-react';
import { computeIntelligentLayout } from '../utils/intelligentGrid';

interface PaginatedDocPreviewProps {
  items: NotebookOutputItem[];
  config: DocxConfig;
  notebookFilename: string;
  onDownload: () => void;
  isExporting: boolean;
}

export const PaginatedDocPreview: React.FC<PaginatedDocPreviewProps> = ({
  items,
  config,
  notebookFilename,
  onDownload,
  isExporting,
}) => {
  const activeItems = items.filter((i) => i.selected !== false);

  if (activeItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">No figures selected</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Select at least one output figure to preview the Word report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with direct export button */}
      <div className="flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-3 text-xs text-blue-900 dark:text-blue-200">
        <div>
          <span className="font-bold">Live Word Document Preview</span>
          <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
            Simulating {activeItems.length} figure{activeItems.length === 1 ? '' : 's'} with typography: {config.fontFamily}
          </p>
        </div>
        <button
          type="button"
          onClick={onDownload}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 font-semibold text-white shadow-xs hover:bg-blue-700 transition"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{isExporting ? 'Generating DOCX...' : 'Download This Word File'}</span>
        </button>
      </div>

      {/* Pages Container */}
      <div className="flex flex-col items-center gap-8 py-4">
        {/* Cover / Title Page */}
        {config.titlePage && (
          <div
            className="relative w-full max-w-[700px] min-h-[900px] bg-white border border-slate-200 rounded-lg shadow-md p-14 flex flex-col justify-between"
            style={{ fontFamily: config.fontFamily || 'Aptos, system-ui' }}
          >
            <div className="space-y-6 pt-16 text-center">
              <div className="inline-block p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 mb-2">
                <FileText className="h-8 w-8" />
              </div>

              <h1 className="text-3xl font-extrabold text-blue-950 tracking-tight leading-tight">
                {config.reportTitle || 'Colab Notebook Output Report'}
              </h1>

              {config.reportSubtitle && (
                <p className="text-base text-slate-600 max-w-md mx-auto">
                  {config.reportSubtitle}
                </p>
              )}

              <div className="h-0.5 w-24 bg-blue-500 mx-auto my-6" />

              <div className="space-y-1 text-sm text-slate-700">
                <p className="font-semibold text-blue-700">
                  Notebook Source: {notebookFilename || 'notebook.ipynb'}
                </p>
                {config.authorName && (
                  <p className="text-slate-600">Author: {config.authorName}</p>
                )}
                <p className="text-slate-400 text-xs pt-2">
                  Generated on {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="text-center pt-8 border-t border-slate-100 text-xs text-slate-400">
              {activeItems.length} validated output object{activeItems.length === 1 ? '' : 's'} · Verified OpenXML standard
            </div>

            <div className="absolute bottom-3 right-6 text-[10px] text-slate-400 font-mono">
              Page 1
            </div>
          </div>
        )}

        {/* Content Pages */}
        {config.intelligentGrid ? (
          // Intelligent Grid: Aspect-ratio aware dense layout
          computeIntelligentLayout(activeItems, config).rows.map((row, rIdx) => {
            const pageNum = (config.titlePage ? 2 : 1) + rIdx;

            return (
              <div
                key={`intel-page-${rIdx}`}
                className="relative w-full max-w-[700px] min-h-[900px] bg-white border border-slate-200 rounded-lg shadow-md p-10 flex flex-col justify-between"
                style={{ fontFamily: config.fontFamily || 'Aptos, system-ui' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-[11px] text-slate-400">
                  <span>{config.reportTitle || 'Colab Output Report'}</span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Intelligent Grid Packing ({row.aspectType})</span>
                  </span>
                  <span>{notebookFilename}</span>
                </div>

                {/* Body */}
                <div className="py-4 flex-1 flex flex-col justify-start">
                  {row.type === 'single' ? (
                    // Single Wide Figure (100% width)
                    (() => {
                      const item = row.items[0];
                      const figIdx = activeItems.indexOf(item) + 1;
                      return (
                        <div className="flex flex-col">
                          {config.labelCaption && (
                            <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                              Figure {String(figIdx).padStart(2, '0')}: {item.caption || 'Output'}
                            </h3>
                          )}
                          {config.addCellRef && (
                            <p className="text-xs text-slate-500 mb-2">
                              Source: Code Cell {item.cellIndex + 1}, Output #{item.outputIndex + 1}
                              {item.executionCount !== null && ` · Execution [${item.executionCount}]`}
                            </p>
                          )}
                          {item.notes && (
                            <div className="mb-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-100">
                              <span className="font-semibold text-slate-700">Analysis: </span>
                              {item.notes}
                            </div>
                          )}
                          <div className="flex items-center justify-center my-auto p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                            <img
                              src={item.src}
                              alt={item.caption}
                              className="max-h-[480px] w-auto max-w-full object-contain rounded-md shadow-2xs"
                            />
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    // Paired Figures Side-by-Side (2 Columns)
                    <div className="grid grid-cols-2 gap-4 items-start content-start">
                      {row.items.map((item, itemIdxInRow) => {
                        const figIdx = activeItems.indexOf(item) + 1;
                        return (
                          <div
                            key={item.id}
                            className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/30"
                          >
                            {config.labelCaption && (
                              <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                                Figure {String(figIdx).padStart(2, '0')}: {item.caption || 'Output'}
                              </h4>
                            )}
                            {config.addCellRef && (
                              <p className="text-[10px] text-slate-500 mb-1.5">
                                Cell {item.cellIndex + 1}, Out #{item.outputIndex + 1}
                              </p>
                            )}
                            {item.notes && (
                              <div className="mb-2 text-[10px] text-slate-600 bg-slate-100/70 p-1.5 rounded">
                                {item.notes}
                              </div>
                            )}
                            <div className="flex items-center justify-center p-2 bg-white rounded-lg border border-slate-100 min-h-[160px]">
                              <img
                                src={item.src}
                                alt={item.caption}
                                className="max-h-[220px] w-auto max-w-full object-contain"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  <span>Colab2Doc Verified Report</span>
                  <span className="font-mono">Page {pageNum}</span>
                </div>
              </div>
            );
          })
        ) : config.autoLayout === 'side-by-side' ? (
          // Side-by-Side Auto-Layout: 2 figures per page in simulated table grid
          Array.from({ length: Math.ceil(activeItems.length / 2) }).map((_, pageIdx) => {
            const idxA = pageIdx * 2;
            const idxB = idxA + 1;
            const itemA = activeItems[idxA];
            const itemB = idxB < activeItems.length ? activeItems[idxB] : null;
            const pageNum = (config.titlePage ? 2 : 1) + pageIdx;

            return (
              <div
                key={`page-${pageIdx}`}
                className="relative w-full max-w-[700px] min-h-[900px] bg-white border border-slate-200 rounded-lg shadow-md p-10 flex flex-col justify-between"
                style={{ fontFamily: config.fontFamily || 'Aptos, system-ui' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-[11px] text-slate-400">
                  <span>{config.reportTitle || 'Colab Output Report'}</span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    Side-by-Side Auto-Layout
                  </span>
                  <span>{notebookFilename}</span>
                </div>

                {/* Body - 2 Columns */}
                <div className="py-4 flex-1 grid grid-cols-2 gap-4 items-start content-start">
                  {/* Column A */}
                  <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                    {config.labelCaption && (
                      <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                        Figure {String(idxA + 1).padStart(2, '0')}: {itemA.caption || 'Output'}
                      </h4>
                    )}
                    {config.addCellRef && (
                      <p className="text-[10px] text-slate-500 mb-1.5">
                        Cell {itemA.cellIndex + 1}, Out #{itemA.outputIndex + 1}
                        {itemA.executionCount !== null && ` [${itemA.executionCount}]`}
                      </p>
                    )}
                    {itemA.notes && (
                      <div className="mb-2 text-[10px] text-slate-600 bg-slate-100/70 p-1.5 rounded">
                        {itemA.notes}
                      </div>
                    )}
                    <div className="flex items-center justify-center p-2 bg-white rounded-lg border border-slate-100 min-h-[160px]">
                      <img
                        src={itemA.src}
                        alt={itemA.caption}
                        className="max-h-[220px] w-auto max-w-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Column B */}
                  {itemB ? (
                    <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                      {config.labelCaption && (
                        <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                          Figure {String(idxB + 1).padStart(2, '0')}: {itemB.caption || 'Output'}
                        </h4>
                      )}
                      {config.addCellRef && (
                        <p className="text-[10px] text-slate-500 mb-1.5">
                          Cell {itemB.cellIndex + 1}, Out #{itemB.outputIndex + 1}
                          {itemB.executionCount !== null && ` [${itemB.executionCount}]`}
                        </p>
                      )}
                      {itemB.notes && (
                        <div className="mb-2 text-[10px] text-slate-600 bg-slate-100/70 p-1.5 rounded">
                          {itemB.notes}
                        </div>
                      )}
                      <div className="flex items-center justify-center p-2 bg-white rounded-lg border border-slate-100 min-h-[160px]">
                        <img
                          src={itemB.src}
                          alt={itemB.caption}
                          className="max-h-[220px] w-auto max-w-full object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-300 min-h-[200px]">
                      <span className="text-xs italic">End of report outputs</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  <span>Colab2Doc Verified Report</span>
                  <span className="font-mono">Page {pageNum}</span>
                </div>
              </div>
            );
          })
        ) : (
          // Single-Column Auto-Layout: 1 figure per page
          activeItems.map((item, idx) => {
            const pageNum = (config.titlePage ? 2 : 1) + idx;
            const figLabel = `Figure ${String(idx + 1).padStart(2, '0')}: ${item.caption || 'Output'}`;

            return (
              <div
                key={item.id}
                className="relative w-full max-w-[700px] min-h-[900px] bg-white border border-slate-200 rounded-lg shadow-md p-12 flex flex-col justify-between"
                style={{ fontFamily: config.fontFamily || 'Aptos, system-ui' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-[11px] text-slate-400">
                  <span>{config.reportTitle || 'Colab Output Report'}</span>
                  <span>{notebookFilename}</span>
                </div>

                {/* Body */}
                <div className="py-6 flex-1 flex flex-col justify-start">
                  {/* Figure caption */}
                  {config.labelCaption && (
                    <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                      {figLabel}
                    </h3>
                  )}

                  {/* Metadata */}
                  {config.addCellRef && (
                    <p className="text-xs text-slate-500 mb-2">
                      Source: Code Cell {item.cellIndex + 1}, Output #{item.outputIndex + 1}
                      {item.executionCount !== null && ` · Execution [${item.executionCount}]`}
                      {` · ${item.subtype || item.outputType}`}
                    </p>
                  )}

                  {/* Figure Item Metadata (Author, Date, Section) */}
                  {(item.author || item.reportDate || item.sectionTag) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-3 font-medium">
                      {item.author && <span>Author: {item.author}</span>}
                      {item.author && (item.reportDate || item.sectionTag) && <span className="text-slate-300">•</span>}
                      {item.reportDate && <span>Date: {item.reportDate}</span>}
                      {item.reportDate && item.sectionTag && <span className="text-slate-300">•</span>}
                      {item.sectionTag && (
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[11px]">
                          {item.sectionTag}
                        </span>
                      )}
                    </div>
                  )}

                  {/* User Notes if any */}
                  {item.notes && (
                    <div className="mb-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-100">
                      <span className="font-semibold text-slate-700">Analysis: </span>
                      {item.notes}
                    </div>
                  )}

                  {/* Main Rendered Figure */}
                  <div className="flex items-center justify-center my-auto p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <img
                      src={item.src}
                      alt={item.caption}
                      className="max-h-[500px] w-auto max-w-full object-contain rounded-md shadow-2xs"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  <span>Colab2Doc Verified Report</span>
                  <span className="font-mono">Page {pageNum}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
