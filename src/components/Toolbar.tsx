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
  selectedCount: number;
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
  selectedCount,
}) => {
  // Counts by category
  const chartCount = items.filter((i) => i.kind === 'image' || i.kind === 'svg').length;
  const tableCount = items.filter((i) => i.kind === 'html' || i.subtype === 'html-table').length;
  const consoleCount = items.filter((i) => i.outputType === 'stream').length;
  const errorCount = items.filter((i) => i.outputType === 'error').length;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title="Card Grid View"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
              viewMode === 'grid'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            title="Detailed List View"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
              viewMode === 'list'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('doc')}
            title="Word Paginated Preview"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
              viewMode === 'doc'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Doc Preview</span>
          </button>
        </div>
      </div>

      {/* Second row: Filter Category Chips & Batch Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Errors ({errorCount})</span>
            </button>
          )}
        </div>

        {/* Batch Operations */}
        <div className="flex items-center gap-2 text-xs">
          {selectedCount < items.length ? (
            <button
              type="button"
              onClick={onSelectAll}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 px-1.5 py-1 transition font-medium"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Select All</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onDeselectAll}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 px-1.5 py-1 transition font-medium"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Deselect All</span>
            </button>
          )}

          {selectedCount > 0 && (
            <>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={onDeleteSelected}
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 px-1.5 py-1 transition font-medium"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete ({selectedCount})</span>
              </button>
            </>
          )}

          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={onExportZip}
            title="Download all selected figures as raw PNGs in a .zip"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 px-1.5 py-1 transition font-medium"
          >
            <Archive className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ZIP Images</span>
          </button>
        </div>
      </div>
    </div>
  );
};
