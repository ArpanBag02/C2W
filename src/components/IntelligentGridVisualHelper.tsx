import React, { useState } from 'react';
import {
  Sparkles,
  X,
  FileText,
  Columns,
  Square,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Sliders,
  Layers,
  Wand2,
  Maximize2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { NotebookOutputItem, DocxConfig } from '../types/notebook';
import {
  computeIntelligentLayout,
  IntelligentLayoutSummary,
  rearrangeByIntelligentGrid,
} from '../utils/intelligentGrid';

interface IntelligentGridVisualHelperProps {
  isOpen: boolean;
  onClose: () => void;
  items: NotebookOutputItem[];
  config: DocxConfig;
  isIntelligentGridActive: boolean;
  onToggleIntelligentGrid: (active: boolean) => void;
  onApplyRearrangement?: (reorderedItems: NotebookOutputItem[]) => void;
  onOpenDocPreviewModal?: () => void;
}

export const IntelligentGridVisualHelper: React.FC<IntelligentGridVisualHelperProps> = ({
  isOpen,
  onClose,
  items,
  config,
  isIntelligentGridActive,
  onToggleIntelligentGrid,
  onApplyRearrangement,
  onOpenDocPreviewModal,
}) => {
  const [selectedPageNum, setSelectedPageNum] = useState<number | null>(null);

  // Compute live layout with current toggle state
  const liveSummary: IntelligentLayoutSummary = computeIntelligentLayout(
    items,
    {
      ...config,
      autoLayout: isIntelligentGridActive ? 'side-by-side' : config.autoLayout,
    }
  );

  // Compute baseline without intelligent grid for live comparison
  const baselineSummary = computeIntelligentLayout(items, {
    ...config,
    autoLayout: 'single-column',
  });

  if (!isOpen) return null;

  const handleApplyRearrange = () => {
    if (onApplyRearrangement) {
      const reordered = rearrangeByIntelligentGrid(items);
      onApplyRearrangement(reordered);
    }
  };

  const activePageCount = isIntelligentGridActive
    ? liveSummary.intelligentPagesCount
    : baselineSummary.standardPagesCount;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Intelligent Grid & Document Page Footprint Helper"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-fadeIn"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-blue-50/40 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-sm shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Intelligent Grid & Page Footprint Helper
                </h3>
                <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Real-Time Estimator
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live simulation of page occupancy, aspect ratio packing, and whitespace reduction.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 1. Comparison & Live Footprint Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Metric 1: Current Estimated Pages */}
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/70 bg-gradient-to-br from-indigo-50/70 to-blue-50/40 dark:from-indigo-950/40 dark:to-slate-850 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Estimated Page Footprint
                </span>
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {activePageCount}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Page{activePageCount === 1 ? '' : 's'} Total
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                {isIntelligentGridActive ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Saves {liveSummary.pagesSaved} page{liveSummary.pagesSaved === 1 ? '' : 's'} vs Standard ({baselineSummary.standardPagesCount} pgs)
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">
                    Standard layout ({baselineSummary.standardPagesCount} pages)
                  </span>
                )}
              </p>
            </div>

            {/* Metric 2: Document Density */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-3.5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Page Density & Whitespace
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {isIntelligentGridActive ? `+${liveSummary.densityIncreasePercent}%` : 'Standard'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {isIntelligentGridActive ? 'Density Gain' : 'Density'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {isIntelligentGridActive
                  ? `${liveSummary.whitespaceReductionPercent}% reduction in unused vertical gaps`
                  : 'Toggle ON to automatically pair compact figures'}
              </p>
            </div>

            {/* Metric 3: Aspect Ratio Breakdown */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-3.5 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Aspect Ratio Detection
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="rounded-md bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                  {liveSummary.wideCount} Wide
                </span>
                <span className="rounded-md bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  {liveSummary.squareCount} Square
                </span>
                <span className="rounded-md bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {liveSummary.tallCount} Tall
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                Wide figures span 100% width; compact figures pair side-by-side.
              </p>
            </div>
          </div>

          {/* 2. Interactive Toggle & Actions Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-toggle-intelligent-grid-modal"
                onClick={() => onToggleIntelligentGrid(!isIntelligentGridActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isIntelligentGridActive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={isIntelligentGridActive}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isIntelligentGridActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Intelligent Grid Packing: {isIntelligentGridActive ? 'ENABLED' : 'DISABLED'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isIntelligentGridActive
                    ? 'Automatically pairing figures based on aspect ratios in Word export'
                    : 'Using standard single-figure layout'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onApplyRearrangement && (
                <button
                  type="button"
                  onClick={handleApplyRearrange}
                  title="Rearrange workspace card sequence by aspect-ratio affinity"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-95 shadow-2xs"
                >
                  <Wand2 className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Reorder Cards by Aspect Ratio</span>
                </button>
              )}

              {onOpenDocPreviewModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDocPreviewModal();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition active:scale-95 shadow-xs"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Full Word Preview</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Real-Time Page Mini-Map / Visual Layout Strip */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Real-Time Page Mini-Map ({liveSummary.pageMockups.length} Pages Generated)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Click a page to highlight figure distribution
              </span>
            </div>

            {/* Page Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
              {liveSummary.pageMockups.map((page) => {
                const isSelected = selectedPageNum === page.pageNumber;

                return (
                  <div
                    key={page.pageNumber}
                    onClick={() =>
                      setSelectedPageNum(isSelected ? null : page.pageNumber)
                    }
                    className={`group relative flex flex-col justify-between rounded-lg border cursor-pointer p-2.5 transition-all duration-150 aspect-[1/1.3] bg-white dark:bg-slate-900 shadow-2xs ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-[1.02]'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs'
                    }`}
                  >
                    {/* Page Header */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 mb-1.5">
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                        {page.isCover ? 'Cover Page' : `Page ${page.pageNumber}`}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">#{page.pageNumber}</span>
                    </div>

                    {/* Page Content Simulation Blocks */}
                    {page.isCover ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-1.5 py-2">
                        <div className="h-2 w-12 bg-blue-600 rounded-full mx-auto" />
                        <div className="h-1.5 w-16 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
                        <div className="h-1 w-10 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
                        <span className="text-[9px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                          Cover
                        </span>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col justify-start gap-1.5 overflow-hidden">
                        {page.blocks.map((block) => (
                          <div
                            key={block.id}
                            title={`${block.label}: ${block.caption} (${block.aspectType})`}
                            className={`rounded p-1 text-[9px] flex flex-col justify-center transition ${
                              block.widthPercent === 100
                                ? 'w-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200'
                                : 'w-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-900 text-indigo-800 dark:text-indigo-200'
                            }`}
                          >
                            <span className="font-bold truncate">{block.label}</span>
                            <span className="text-[8px] text-slate-500 dark:text-slate-400 truncate">
                              {block.aspectType === 'wide' ? 'Full Width' : 'Paired'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Page Footprint Badge */}
                    <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                      <span>{page.isCover ? 'OpenXML' : `${page.blocks.length} Figures`}</span>
                      <span
                        className={`rounded px-1 py-0.2 font-semibold ${
                          page.densityRating === 'dense'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {page.densityRating === 'dense' ? 'Dense' : 'Std'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-5 py-3 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Info className="h-3.5 w-3.5 text-indigo-500" />
            <span>
              Intelligent Grid automatically embeds OpenXML 2-column tables in Word (.docx) and dual columns in PDF.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-200 dark:bg-slate-800 px-4 py-1.5 font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
