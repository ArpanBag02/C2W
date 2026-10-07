import React from 'react';
import {
  Search,
  LayoutGrid,
  List,
  BookOpen,
  CheckSquare,
  Square,
  Trash2,
  Archive,
  BarChart3,
  Table,
  Terminal,
  AlertTriangle,
  Eye,
  Tag,
  History,
  FileDown,
  Printer,
  Sparkles,
  FileText,
} from 'lucide-react';
import { NotebookOutputItem } from '../types/notebook';

export type ViewMode = 'grid' | 'list' | 'doc';
export type FilterCategory = 'all' | 'charts' | 'tables' | 'console' | 'errors';

interface ToolbarProps {
  items: NotebookOutputItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: FilterCategory;
  onFilterChange: (f: FilterCategory) => void;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onExportZip: () => void;
  onExportPdf?: () => void;
  onPrintPdf?: () => void;
  isExportingPdf?: boolean;
  selectedCount: number;
  onOpenDocPreviewModal?: () => void;
  onOpenBatchMetadata?: () => void;
  onOpenHistory?: () => void;
  historyCount?: number;
  // Intelligent Grid Aspect Ratio Optimization & Real-Time Page Helper
  isIntelligentGridActive?: boolean;
  onToggleIntelligentGrid?: (active: boolean) => void;
  onOpenIntelligentGridHelper?: () => void;
  estimatedPagesCount?: number;
  pagesSaved?: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  items,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onExportZip,
  onExportPdf,
  onPrintPdf,
  isExportingPdf = false,
  selectedCount,
  onOpenDocPreviewModal,
  onOpenBatchMetadata,
  onOpenHistory,
  historyCount = 0,
  isIntelligentGridActive = false,
  onToggleIntelligentGrid,
  onOpenIntelligentGridHelper,
  estimatedPagesCount,
  pagesSaved,
}) => {
  // Counts by category
  const chartCount = items.filter((i) => i.kind === 'image' || i.kind === 'svg').length;
  const tableCount = items.filter((i) => i.kind === 'html' || i.subtype === 'html-table').length;
  const consoleCount = items.filter((i) => i.outputType === 'stream').length;
  const errorCount = items.filter((i) => i.outputType === 'error').length;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs transition-colors">
      {/* Top row: Search and View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search figure captions, cell numbers, or text content..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 py-1.5 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ×
            </button>
          )}
        </div>

        {/* Intelligent Grid Toggle & Visual Page Footprint Helper */}
        {onToggleIntelligentGrid && (
          <div className="flex items-center rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/80 to-blue-50/50 dark:from-indigo-950/50 dark:to-slate-850 p-1 text-xs shadow-2xs">
            <button
              type="button"
              id="btn-toolbar-intelligent-grid"
              onClick={() => onToggleIntelligentGrid(!isIntelligentGridActive)}
              title="Automatically rearrange images based on their aspect ratio to minimize whitespace and improve document density in Word"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition active:scale-95 ${
                isIntelligentGridActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-900 dark:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Intelligent Grid</span>
              <span
                className={`text-[9px] rounded px-1.5 py-0.2 uppercase tracking-wider font-bold ${
                  isIntelligentGridActive
                    ? 'bg-indigo-700 text-white'
                    : 'bg-indigo-200/80 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300'
                }`}
              >
                {isIntelligentGridActive ? 'ON' : 'OFF'}
              </span>
            </button>

            {onOpenIntelligentGridHelper && (
              <button
                type="button"
                id="btn-toolbar-intelligent-helper"
                onClick={onOpenIntelligentGridHelper}
                title="Open real-time document page footprint visualizer & aspect-ratio breakdown"
                className="flex items-center gap-1 border-l border-indigo-200 dark:border-indigo-800/80 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white transition"
              >
                <FileText className="h-3 w-3 text-indigo-500" />
                <span>
                  {estimatedPagesCount !== undefined ? `${estimatedPagesCount} pgs` : 'Live Preview'}
                </span>
                {pagesSaved !== undefined && pagesSaved > 0 && isIntelligentGridActive && (
                  <span className="rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1 text-[9px] font-bold">
                    -{pagesSaved}
                  </span>
                )}
              </button>
            )}
          </div>
        )}

        {/* View Mode Controls */}
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 text-xs">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title="Card Grid View (supports drag-and-drop reordering)"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            title="Compact Table List View (supports drag-and-drop reordering)"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('doc')}
            title="Simulated Word Document Page View"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
              viewMode === 'doc'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Doc Preview</span>
          </button>
        </div>

        {/* Modal doc preview trigger */}
        {onOpenDocPreviewModal && (
          <button
            type="button"
            id="toolbar-open-preview-modal-btn"
            onClick={onOpenDocPreviewModal}
            title="Open Fullscreen Paginated Word Document Modal"
            className="hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition active:scale-95 shadow-2xs"
          >
            <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Word Preview Modal</span>
          </button>
        )}
      </div>

      {/* Bottom row: Category Filters & Batch Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              activeFilter === 'all'
                ? 'bg-slate-800 dark:bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({items.length})
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('charts')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition ${
              activeFilter === 'charts'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="h-3 w-3" />
            <span>Charts ({chartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('tables')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition ${
              activeFilter === 'tables'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Table className="h-3 w-3" />
            <span>Tables ({tableCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('console')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition ${
              activeFilter === 'console'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Terminal className="h-3 w-3" />
            <span>Logs ({consoleCount})</span>
          </button>

          {errorCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange('errors')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition ${
                activeFilter === 'errors'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 border border-red-200 dark:border-red-900/60'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Errors ({errorCount})</span>
            </button>
          )}
        </div>

        {/* Batch Operations */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {selectedCount < items.length ? (
            <button
              type="button"
              onClick={onSelectAll}
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-1.5 py-1 transition font-medium"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Select All</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onDeselectAll}
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-1.5 py-1 transition font-medium"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Deselect All</span>
            </button>
          )}

          {selectedCount > 0 && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={onDeleteSelected}
                className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-1.5 py-1 transition font-medium"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete ({selectedCount})</span>
              </button>
            </>
          )}

          {/* Export ZIP Images */}
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            type="button"
            onClick={onExportZip}
            title="Download all selected figures as raw PNGs in a .zip"
            className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-1.5 py-1 transition font-medium"
          >
            <Archive className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ZIP Images</span>
          </button>

          {/* Save as PDF Option (Client-side generation + Print-to-PDF) */}
          {onExportPdf && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="inline-flex items-center rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-2xs">
                <button
                  type="button"
                  id="btn-toolbar-save-pdf"
                  onClick={onExportPdf}
                  disabled={isExportingPdf || selectedCount === 0}
                  title="Generate and download PDF report from selected figures"
                  className="inline-flex items-center gap-1 px-2.5 py-1 font-semibold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-l-lg transition active:scale-95 disabled:opacity-50"
                >
                  <FileDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  <span>{isExportingPdf ? 'Exporting PDF...' : 'Save as PDF'}</span>
                </button>
                {onPrintPdf && (
                  <button
                    type="button"
                    id="btn-toolbar-print-pdf"
                    onClick={onPrintPdf}
                    title="Print to PDF using browser native dialog"
                    className="p-1 border-l border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-r-lg text-rose-600 dark:text-rose-400 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </>
          )}

          {onOpenBatchMetadata && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                id="btn-toolbar-edit-metadata"
                onClick={onOpenBatchMetadata}
                title={
                  selectedCount > 0
                    ? `Edit common metadata (author, report date, notes) across ${selectedCount} selected items`
                    : 'Edit common metadata across notebook outputs'
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition text-xs ${
                  selectedCount > 0
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200/80 dark:border-blue-800 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <Tag className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Edit Metadata {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
              </button>
            </>
          )}

          {onOpenHistory && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                id="btn-toolbar-history"
                onClick={onOpenHistory}
                title="View generated documents history"
                className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-1.5 py-1 transition font-medium"
              >
                <History className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">History</span>
                {historyCount > 0 && (
                  <span className="rounded-full bg-blue-100 dark:bg-blue-900 px-1 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    {historyCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
