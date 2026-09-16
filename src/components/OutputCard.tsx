import React, { useState } from 'react';
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
} from 'lucide-react';
import { NotebookOutputItem } from '../types/notebook';

interface OutputCardProps {
  item: NotebookOutputItem;
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  onToggleSelect: (id: string) => void;
  onUpdateCaption: (id: string, caption: string, notes?: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onOpenLightbox: (item: NotebookOutputItem) => void;
}

export const OutputCard: React.FC<OutputCardProps> = ({
  item,
  index,
  total,
  isFirst,
  isLast,
  onToggleSelect,
  onUpdateCaption,
  onDelete,
  onMoveUp,
  onMoveDown,
  onOpenLightbox,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [captionInput, setCaptionInput] = useState(item.caption);
  const [notesInput, setNotesInput] = useState(item.notes || '');
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    onUpdateCaption(item.id, captionInput.trim() || 'Output', notesInput.trim());
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
      // Fallback copy text if image clipboard is blocked
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
        return <span className="bg-blue-50 text-blue-700 border border-blue-200">Plot / Graphic</span>;
      case 'html':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200">Table Data</span>;
      case 'text':
        if (item.outputType === 'error') {
          return <span className="bg-rose-50 text-rose-700 border border-rose-200">Runtime Error</span>;
        }
        return <span className="bg-slate-100 text-slate-700 border border-slate-200">Stream Log</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 border border-slate-200">Output</span>;
    }
  };

  return (
    <article
      id={`output-card-${item.id}`}
      className={`group relative flex flex-col rounded-2xl border transition-all duration-200 bg-white overflow-hidden ${
        item.selected !== false
          ? 'border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300'
          : 'border-slate-200/60 opacity-60 bg-slate-50/50'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Select Checkbox */}
          <button
            type="button"
            onClick={() => onToggleSelect(item.id)}
            title={item.selected !== false ? 'Exclude from Word report' : 'Include in Word report'}
            className="text-slate-400 hover:text-blue-600 transition"
          >
            {item.selected !== false ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-slate-300" />
            )}
          </button>

          {/* Figure numbering and caption */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                {figLabel}
              </span>
              <h4
                onClick={() => setIsEditing(true)}
                title="Click to edit caption"
                className="cursor-pointer text-xs font-bold text-slate-800 truncate hover:text-blue-600 transition"
              >
                {item.caption}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
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
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1">
          <div className="text-[10px] font-semibold px-2 py-0.5 rounded-md mr-1 hidden sm:inline-block">
            {getTypeBadge()}
          </div>

          {/* Reorder Buttons */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onMoveUp(index)}
              title="Move Up"
              className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-500"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => onMoveDown(index)}
              title="Move Down"
              className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-500"
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
                ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800'
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
                ? 'border-blue-300 bg-blue-50 text-blue-600'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          {/* Zoom Lightbox */}
          <button
            type="button"
            onClick={() => onOpenLightbox(item)}
            title="Full-screen inspect"
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            title="Delete output"
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Edit Form Drawer */}
      {isEditing && (
        <div className="border-b border-blue-100 bg-blue-50/40 p-3 text-xs space-y-2.5 animate-fadeIn">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
              Figure Caption / Title
            </label>
            <input
              type="text"
              value={captionInput}
              onChange={(e) => setCaptionInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Model Loss Convergence Curve"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
              Report Note / Description (included in Word document)
            </label>
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              placeholder="Optional explanatory note or analysis of this figure..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative p-3 flex-1 flex flex-col justify-center items-center bg-white min-h-[160px] overflow-hidden">
        {item.src ? (
          <img
            src={item.src}
            alt={item.caption}
            onClick={() => onOpenLightbox(item)}
            className="max-h-[380px] w-auto max-w-full object-contain rounded-lg border border-slate-100 cursor-zoom-in hover:opacity-95 transition"
            loading="lazy"
          />
        ) : (
          <div className="text-xs text-slate-400">No renderable preview available</div>
        )}

        {/* Notes callout if present */}
        {item.notes && (
          <div className="mt-2.5 w-full rounded-lg bg-slate-50 p-2 text-xs text-slate-600 border border-slate-200/60">
            <span className="font-semibold text-slate-700">Note: </span>
            {item.notes}
          </div>
        )}
      </div>

      {/* Card Footer info */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400 bg-slate-50/30">
        <span>
          Dim: {item.dim.w} × {item.dim.h} px
        </span>
        <button
          type="button"
          onClick={() => onOpenLightbox(item)}
          className="text-blue-600 hover:underline font-medium"
        >
          View High-Res
        </button>
      </div>
    </article>
  );
};
