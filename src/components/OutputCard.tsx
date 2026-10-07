import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  Copy,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  CheckSquare,
  Square,
  FileText,
  Clock,
  Sparkles,
  Wand2,
  User,
  Calendar,
  Tag,
  GripVertical,
} from 'lucide-react';
import { NotebookOutputItem } from '../types/notebook';
import { generateAutoCaption } from '../utils/autoCaptioner';
import { ViewMode } from './Toolbar';

interface OutputCardProps {
  item: NotebookOutputItem;
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  viewMode?: ViewMode;
  onToggleSelect: (id: string) => void;
  onUpdateCaption: (
    id: string,
    caption: string,
    notes?: string,
    author?: string,
    reportDate?: string,
    sectionTag?: string
  ) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onOpenLightbox: (item: NotebookOutputItem) => void;
  // Drag and drop reordering
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string, index: number) => void;
  onDragOver?: (e: React.DragEvent, id: string, index: number) => void;
  onDragEnter?: (e: React.DragEvent, id: string, index: number) => void;
  onDragLeave?: (e: React.DragEvent, id: string, index: number) => void;
  onDrop?: (e: React.DragEvent, id: string, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
  dropPosition?: 'before' | 'after' | null;
}

export const OutputCard: React.FC<OutputCardProps> = ({
  item,
  index,
  total,
  isFirst,
  isLast,
  viewMode = 'grid',
  onToggleSelect,
  onUpdateCaption,
  onDelete,
  onMoveUp,
  onMoveDown,
  onOpenLightbox,
  draggable = true,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDropTarget = false,
  dropPosition = null,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [captionInput, setCaptionInput] = useState(item.caption);
  const [notesInput, setNotesInput] = useState(item.notes || '');
  const [authorInput, setAuthorInput] = useState(item.author || '');
  const [reportDateInput, setReportDateInput] = useState(item.reportDate || '');
  const [sectionTagInput, setSectionTagInput] = useState(item.sectionTag || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCaptionInput(item.caption);
    setNotesInput(item.notes || '');
    setAuthorInput(item.author || '');
    setReportDateInput(item.reportDate || '');
    setSectionTagInput(item.sectionTag || '');
  }, [item.caption, item.notes, item.author, item.reportDate, item.sectionTag]);

  const handleSave = () => {
    onUpdateCaption(
      item.id,
      captionInput.trim() || 'Output',
      notesInput.trim(),
      authorInput.trim(),
      reportDateInput.trim(),
      sectionTagInput.trim()
    );
    setIsEditing(false);
  };

  const handleCopyImage = async () => {
    try {
      if (!item.src) return;
      const res = await fetch(item.src);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (item.rawText) {
        navigator.clipboard.writeText(item.rawText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const figLabel = `Figure ${String(index + 1).padStart(2, '0')}`;

  const getTypeBadge = () => {
    switch (item.kind) {
      case 'image':
      case 'svg':
        return (
          <span className="bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded text-[10px] font-semibold">
            Plot / Graphic
          </span>
        );
      case 'html':
        return (
          <span className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded text-[10px] font-semibold">
            Table Data
          </span>
        );
      case 'text':
        if (item.outputType === 'error') {
          return (
            <span className="bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded text-[10px] font-semibold">
              Runtime Error
            </span>
          );
        }
        return (
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
            Stream Log
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
            Output
          </span>
        );
    }
  };

  // Base drag class state
  const dragClasses = isDragging
    ? 'opacity-40 scale-[0.98] border-dashed border-blue-500 bg-blue-50/30 dark:bg-blue-950/30'
    : isDropTarget
    ? dropPosition === 'before'
      ? 'ring-2 ring-blue-500 border-blue-500 shadow-md relative before:absolute before:-top-1.5 before:left-0 before:right-0 before:h-1 before:bg-blue-600 before:rounded-full before:z-30'
      : 'ring-2 ring-blue-500 border-blue-500 shadow-md relative after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-1 after:bg-blue-600 after:rounded-full after:z-30'
    : '';

  // -------------------------------------------------------------
  // CARD VIEW LAYOUT (Retaining full-sized media canvas and previous structure)
  // -------------------------------------------------------------
  return (
    <article
      id={`output-card-${item.id}`}
      draggable={draggable && !isEditing}
      onDragStart={(e) => onDragStart?.(e, item.id, index)}
      onDragOver={(e) => onDragOver?.(e, item.id, index)}
      onDragEnter={(e) => onDragEnter?.(e, item.id, index)}
      onDragLeave={(e) => onDragLeave?.(e, item.id, index)}
      onDrop={(e) => onDrop?.(e, item.id, index)}
      onDragEnd={(e) => onDragEnd?.(e)}
      className={`group relative flex flex-col rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 overflow-hidden ${
        item.selected !== false
          ? 'border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600'
          : 'border-slate-200/60 dark:border-slate-800/60 opacity-60 bg-slate-50/50 dark:bg-slate-950/50'
      } ${dragClasses}`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-3.5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag Handle */}
          <div
            title="Drag to reorder figure (or use Up/Down arrows)"
            className="flex items-center justify-center p-1 -ml-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-grab active:cursor-grabbing shrink-0 transition"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Select Checkbox */}
          <button
            type="button"
            onClick={() => onToggleSelect(item.id)}
            title={item.selected !== false ? 'Exclude from Word report' : 'Include in Word report'}
            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition shrink-0"
          >
            {item.selected !== false ? (
              <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Square className="h-4 w-4 text-slate-300 dark:text-slate-600" />
            )}
          </button>

          {/* Figure numbering and caption */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900 shrink-0">
                {figLabel}
              </span>
              <h4
                onClick={() => setIsEditing(true)}
                title="Click to edit caption"
                className="cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {item.caption}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Code Cell {item.cellIndex + 1}</span>
              <span>•</span>
              <span>Output #{item.outputIndex + 1}</span>
              {item.executionCount !== null && (
                <>
                  <span>•</span>
                  <span>Exec [{item.executionCount}]</span>
                </>
              )}
            </div>
            {/* Metadata Badges (Author, Date, Section) */}
            {(item.author || item.reportDate || item.sectionTag) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {item.author && (
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700" title={`Author: ${item.author}`}>
                    <User className="h-2.5 w-2.5 text-slate-500 dark:text-slate-400" />
                    <span className="truncate max-w-[120px]">{item.author}</span>
                  </span>
                )}
                {item.reportDate && (
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700" title={`Report Date: ${item.reportDate}`}>
                    <Calendar className="h-2.5 w-2.5 text-slate-500 dark:text-slate-400" />
                    <span>{item.reportDate}</span>
                  </span>
                )}
                {item.sectionTag && (
                  <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900" title={`Section: ${item.sectionTag}`}>
                    <Tag className="h-2.5 w-2.5 text-blue-500 dark:text-blue-400" />
                    <span>{item.sectionTag}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="mr-1 hidden sm:inline-block">
            {getTypeBadge()}
          </div>

          {/* Reorder Buttons */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onMoveUp(index)}
              title="Move Up"
              className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:hover:text-slate-500"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => onMoveDown(index)}
              title="Move Down"
              className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:hover:text-slate-500"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyImage}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
            className={`rounded-lg border p-1.5 transition ${
              copied
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            title="Edit caption and report notes"
            className={`rounded-lg border p-1.5 transition ${
              isEditing
                ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          {/* Zoom Lightbox */}
          <button
            type="button"
            onClick={() => onOpenLightbox(item)}
            title="Full-screen inspect"
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            title="Delete output"
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-500 dark:text-slate-400 hover:border-rose-200 dark:hover:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Edit Form Drawer */}
      {isEditing && (
        <div className="border-b border-blue-100 dark:border-slate-800 bg-blue-50/40 dark:bg-slate-800/80 p-3 text-xs space-y-2.5 animate-fadeIn">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 block mb-1">
              Figure Caption / Title
            </label>
            <input
              type="text"
              value={captionInput}
              onChange={(e) => setCaptionInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Model Loss Convergence Curve"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 block mb-1">
                Author
              </label>
              <input
                type="text"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 block mb-1">
                Report Date
              </label>
              <input
                type="text"
                value={reportDateInput}
                onChange={(e) => setReportDateInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. 2026-09-30"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 block mb-1">
                Section Tag
              </label>
              <input
                type="text"
                value={sectionTagInput}
                onChange={(e) => setSectionTagInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Evaluation"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 block mb-1">
              Report Note / Description (included in report)
            </label>
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
              placeholder="Optional explanatory note or analysis of this figure..."
            />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                const auto = generateAutoCaption(item, index + 1);
                setCaptionInput(auto.caption);
                if (auto.notes) setNotesInput(auto.notes);
              }}
              title="Auto-detect trend or table headers for this figure"
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/60 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition active:scale-95"
            >
              <Wand2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
              <span>Auto-Caption</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative p-3 flex-1 flex flex-col justify-center items-center bg-white dark:bg-slate-900/90 min-h-[160px] overflow-hidden">
        {item.src ? (
          <img
            src={item.src}
            alt={item.caption}
            onClick={() => onOpenLightbox(item)}
            className="max-h-[380px] w-auto max-w-full object-contain rounded-lg border border-slate-100 dark:border-slate-800 cursor-zoom-in hover:opacity-95 transition bg-white/5"
            loading="lazy"
          />
        ) : (
          <div className="text-xs text-slate-400 dark:text-slate-500">No renderable preview available</div>
        )}

        {/* Notes callout if present */}
        {item.notes && (
          <div className="mt-2.5 w-full rounded-lg bg-slate-50 dark:bg-slate-800/80 p-2 text-xs text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Note: </span>
            {item.notes}
          </div>
        )}
      </div>

      {/* Card Footer info */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-2 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-900/50">
        <span>
          Dim: {item.dim.w} × {item.dim.h} px
        </span>
        <button
          type="button"
          onClick={() => onOpenLightbox(item)}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          View High-Res
        </button>
      </div>
    </article>
  );
};
