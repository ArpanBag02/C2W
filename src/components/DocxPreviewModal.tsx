import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Printer,
  Sparkles,
} from 'lucide-react';
import { NotebookOutputItem, DocxConfig } from '../types/notebook';

interface DocxPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: NotebookOutputItem[];
  config: DocxConfig;
  notebookFilename: string;
  onDownloadDocx: () => void;
  isExporting: boolean;
}

export const DocxPreviewModal: React.FC<DocxPreviewModalProps> = ({
  isOpen,
  onClose,
  items,
  config,
  notebookFilename,
  onDownloadDocx,
  isExporting,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'continuous' | 'single'>('continuous');

  // Filter only active/selected items
  const activeItems = items.filter((i) => i.selected !== false);
  const isSideBySide = config.autoLayout === 'side-by-side';
  const contentPagesCount = isSideBySide ? Math.ceil(activeItems.length / 2) : activeItems.length;
  const totalPages = (config.titlePage ? 1 : 0) + contentPagesCount;

  useEffect(() => {
    if (isOpen) {
      setActivePageIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(150, z + 15));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(60, z - 15));
  const handleResetZoom = () => setZoomLevel(100);

  const cleanDocName = (config.fileName || 'notebook_outputs')
    .trim()
    .replace(/\.docx$/i, '')
    .replace(/[\\/:*?"<>|]/g, '-');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Prepared Word Document Preview"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      {/* Top Navigation & Controls Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 text-white shadow-md select-none shrink-0">
        {/* Document Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white truncate max-w-[240px] sm:max-w-md">
                {config.reportTitle || 'Prepared Word Report'}
              </span>
              <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-mono font-medium text-blue-300 border border-blue-400/30">
                .docx
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {totalPages} page{totalPages === 1 ? '' : 's'} · {activeItems.length} figure{activeItems.length === 1 ? '' : 's'} · Font: {config.fontFamily}
            </p>
          </div>
        </div>

        {/* Center: Zoom and View Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom group */}
          <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800/80 p-0.5 text-xs text-slate-200">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 60}
              title="Zoom out"
              className="rounded-lg p-1.5 hover:bg-slate-700 hover:text-white disabled:opacity-30 transition"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom to 100%"
              className="px-2 py-1 font-mono text-[11px] font-semibold hover:text-white"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 150}
              title="Zoom in"
              className="rounded-lg p-1.5 hover:bg-slate-700 hover:text-white disabled:opacity-30 transition"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Continuous vs Single page toggle */}
          <div className="hidden sm:flex items-center rounded-xl border border-slate-700 bg-slate-800/80 p-0.5 text-xs text-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('continuous')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                viewMode === 'continuous'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Continuous
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Page by Page
            </button>
          </div>

          {/* Single page stepper */}
          {viewMode === 'single' && (
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-xl px-2 py-1 text-xs">
              <button
                type="button"
                onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                disabled={activePageIndex === 0}
                className="p-1 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono text-[11px]">
                {activePageIndex + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setActivePageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={activePageIndex >= totalPages - 1}
                className="p-1 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right CTA Actions: Download & Close */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDownloadDocx}
            disabled={isExporting || activeItems.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 disabled:opacity-50 transition"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Generating...' : 'Download Word File'}</span>
            <kbd className="hidden md:inline-block rounded bg-blue-700/70 px-1.5 py-0.5 text-[10px] font-mono text-blue-200">
              Ctrl+S
            </kbd>
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close Preview (Esc)"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white active:scale-95 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Document Viewer Stage */}
      <main className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-8 flex justify-center items-start">
        {activeItems.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 text-slate-400 max-w-md">
            <BookOpen className="h-12 w-12 text-slate-600 mb-3" />
            <h4 className="text-base font-semibold text-white">No Figures Selected</h4>
            <p className="text-xs text-slate-400 mt-1.5">
              Select at least one output figure from the workspace to generate and preview the document pages.
            </p>
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-8 transition-transform duration-150 origin-top"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Render Pages */}
            {/* 1. Title / Cover Page */}
            {config.titlePage && (viewMode === 'continuous' || activePageIndex === 0) && (
              <article
                className="relative w-full max-w-[760px] min-h-[980px] bg-white text-slate-900 border border-slate-200/90 rounded-md shadow-2xl p-16 flex flex-col justify-between"
                style={{ fontFamily: config.fontFamily || 'Aptos, sans-serif' }}
              >
                {/* Simulated Word Header Rule */}
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-widest font-medium">
                  <span>Executive Output Report</span>
                  <span>OpenXML Document</span>
                </div>

                <div className="space-y-6 text-center my-auto py-12">
                  <div className="inline-flex p-4 rounded-3xl bg-blue-50 text-blue-700 border border-blue-100/80 shadow-xs mb-2">
                    <FileText className="h-10 w-10" />
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight leading-tight max-w-xl mx-auto">
                    {config.reportTitle || 'Notebook Outputs Report'}
                  </h1>

                  {config.reportSubtitle && (
                    <p className="text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
                      {config.reportSubtitle}
                    </p>
                  )}

                  <div className="h-1 w-24 bg-blue-600 mx-auto my-6 rounded-full" />

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2">
                    <p className="font-semibold text-blue-700 text-sm">
                      Source Notebook: {notebookFilename || 'notebook.ipynb'}
                    </p>
                    {config.authorName && (
                      <p className="text-slate-700">Author: {config.authorName}</p>
                    )}
                    <p className="text-slate-400">
                      Generated on{' '}
                      {new Date().toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Footer of cover page */}
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {activeItems.length} validated output figure{activeItems.length === 1 ? '' : 's'} (code omitted)
                  </span>
                  <span className="font-mono text-[11px]">Page 1</span>
                </div>
              </article>
            )}

            {/* 2. Figure Pages */}
            {isSideBySide ? (
              // Side-by-Side: 2 figures per page
              Array.from({ length: contentPagesCount }).map((_, pageIdx) => {
                const idxA = pageIdx * 2;
                const idxB = idxA + 1;
                const itemA = activeItems[idxA];
                const itemB = idxB < activeItems.length ? activeItems[idxB] : null;
                const pageNumber = (config.titlePage ? 2 : 1) + pageIdx;

                const isCurrentSinglePage =
                  viewMode === 'single' &&
                  activePageIndex === (config.titlePage ? pageIdx + 1 : pageIdx);

                if (viewMode === 'single' && !isCurrentSinglePage) {
                  return null;
                }

                return (
                  <article
                    key={`modal-page-${pageIdx}`}
                    className="relative w-full max-w-[760px] min-h-[980px] bg-white text-slate-900 border border-slate-200/90 rounded-md shadow-2xl p-10 flex flex-col justify-between"
                    style={{ fontFamily: config.fontFamily || 'Aptos, sans-serif' }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-[11px] text-slate-400">
                      <span className="font-medium text-slate-600 truncate max-w-[280px]">
                        {config.reportTitle || 'Notebook Outputs Report'}
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        Side-by-Side Auto-Layout
                      </span>
                      <span className="font-mono text-slate-400 truncate max-w-[160px]">
                        {notebookFilename}
                      </span>
                    </div>

                    {/* Body - 2 Columns */}
                    <div className="py-4 flex-1 grid grid-cols-2 gap-4 items-start content-start">
                      {/* Column A */}
                      <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/40">
                        {config.labelCaption && (
                          <h4 className="text-xs font-bold text-slate-950 mb-1 leading-snug">
                            Figure {String(idxA + 1).padStart(2, '0')}: {itemA.caption || 'Output figure'}
                          </h4>
                        )}
                        {config.addCellRef && (
                          <p className="text-[10px] text-slate-500 mb-1.5">
                            Cell {itemA.cellIndex + 1}, Out #{itemA.outputIndex + 1}
                            {itemA.executionCount !== null && ` [${itemA.executionCount}]`}
                          </p>
                        )}
                        {itemA.notes && itemA.notes.trim() && (
                          <div className="mb-2 text-[10px] text-slate-700 bg-slate-100/70 p-2 rounded">
                            {itemA.notes}
                          </div>
                        )}
                        <div className="flex items-center justify-center p-2 rounded-lg bg-white border border-slate-100 min-h-[180px]">
                          <img
                            src={itemA.src}
                            alt={itemA.caption}
                            className="max-h-[260px] w-auto max-w-full object-contain"
                          />
                        </div>
                      </div>

                      {/* Column B */}
                      {itemB ? (
                        <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50/40">
                          {config.labelCaption && (
                            <h4 className="text-xs font-bold text-slate-950 mb-1 leading-snug">
                              Figure {String(idxB + 1).padStart(2, '0')}: {itemB.caption || 'Output figure'}
                            </h4>
                          )}
                          {config.addCellRef && (
                            <p className="text-[10px] text-slate-500 mb-1.5">
                              Cell {itemB.cellIndex + 1}, Out #{itemB.outputIndex + 1}
                              {itemB.executionCount !== null && ` [${itemB.executionCount}]`}
                            </p>
                          )}
                          {itemB.notes && itemB.notes.trim() && (
                            <div className="mb-2 text-[10px] text-slate-700 bg-slate-100/70 p-2 rounded">
                              {itemB.notes}
                            </div>
                          )}
                          <div className="flex items-center justify-center p-2 rounded-lg bg-white border border-slate-100 min-h-[180px]">
                            <img
                              src={itemB.src}
                              alt={itemB.caption}
                              className="max-h-[260px] w-auto max-w-full object-contain"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-300 min-h-[220px]">
                          <span className="text-xs italic">End of figures</span>
                        </div>
                      )}
                    </div>

                    {/* Page Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                      <span>Colab2Doc OpenXML Architecture</span>
                      <span className="font-mono font-medium text-slate-600">
                        Page {pageNumber} of {totalPages}
                      </span>
                    </div>
                  </article>
                );
              })
            ) : (
              // Single Column: 1 figure per page
              activeItems.map((item, idx) => {
                const pageNumber = (config.titlePage ? 2 : 1) + idx;
                const isCurrentSinglePage =
                  viewMode === 'single' &&
                  activePageIndex === (config.titlePage ? idx + 1 : idx);

                if (viewMode === 'single' && !isCurrentSinglePage) {
                  return null;
                }

                const figLabel = `Figure ${String(idx + 1).padStart(2, '0')}: ${item.caption || 'Output figure'}`;

                return (
                  <article
                    key={item.id}
                    className="relative w-full max-w-[760px] min-h-[980px] bg-white text-slate-900 border border-slate-200/90 rounded-md shadow-2xl p-14 flex flex-col justify-between"
                    style={{ fontFamily: config.fontFamily || 'Aptos, sans-serif' }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-[11px] text-slate-400">
                      <span className="font-medium text-slate-600 truncate max-w-[340px]">
                        {config.reportTitle || 'Notebook Outputs Report'}
                      </span>
                      <span className="font-mono text-slate-400 truncate max-w-[200px]">
                        {notebookFilename}
                      </span>
                    </div>

                    {/* Body Content */}
                    <div className="py-6 flex-1 flex flex-col justify-start">
                      {/* Caption */}
                      {config.labelCaption && (
                        <h3 className="text-base font-bold text-slate-950 mb-1 leading-snug">
                          {figLabel}
                        </h3>
                      )}

                      {/* Cell Reference */}
                      {config.addCellRef && (
                        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-blue-600">
                            Source: Code Cell {item.cellIndex + 1}
                          </span>
                          <span>· Output #{item.outputIndex + 1}</span>
                          {item.executionCount !== null && (
                            <span className="font-mono text-[11px]">
                              [Exec #{item.executionCount}]
                            </span>
                          )}
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                            {item.subtype || item.outputType}
                          </span>
                        </p>
                      )}

                      {/* Figure Author / Date / Section */}
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

                      {/* Analysis / User Notes */}
                      {item.notes && item.notes.trim() && (
                        <div className="mb-4 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                          <span className="font-bold text-slate-900 block mb-0.5">
                            Findings & Notes:
                          </span>
                          <p className="whitespace-pre-line leading-relaxed">{item.notes}</p>
                        </div>
                      )}

                      {/* Rendered Output Figure (Centered, aspect preserved) */}
                      <div className="my-auto flex items-center justify-center p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                        <img
                          src={item.src}
                          alt={item.caption}
                          className="max-h-[520px] w-auto max-w-full object-contain rounded-lg shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Page Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                      <span>Colab2Doc OpenXML Architecture</span>
                      <span className="font-mono font-medium text-slate-600">
                        Page {pageNumber} of {totalPages}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Bottom Status & Keyboard Shortcut Bar */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/95 px-4 py-2 text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>
            Simulating live Microsoft Word (.docx) OpenXML layout with {activeItems.length} active figure{activeItems.length === 1 ? '' : 's'}.
          </span>
        </div>

        {/* Shortcut hints */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 font-mono text-slate-300">
              Ctrl+S
            </kbd>
            <span>Download</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 font-mono text-slate-300">
              Esc
            </kbd>
            <span>Close Preview</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
