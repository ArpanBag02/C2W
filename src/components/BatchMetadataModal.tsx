import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Tag,
  FileText,
  Check,
  RotateCcw,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { NotebookOutputItem } from '../types/notebook';

export interface BatchMetadataPayload {
  author: string;
  applyAuthor: boolean;
  reportDate: string;
  applyReportDate: boolean;
  sectionTag: string;
  applySectionTag: boolean;
  notes: string;
  applyNotes: boolean;
  notesMode: 'replace' | 'append' | 'fill-empty';
  captionPrefix: string;
  applyCaptionPrefix: boolean;
  syncGlobalCover: boolean;
  targetMode: 'selected' | 'all';
}

interface BatchMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: NotebookOutputItem[];
  allItems: NotebookOutputItem[];
  defaultAuthor?: string;
  defaultDate?: string;
  onApply: (payload: BatchMetadataPayload) => void;
}

export const BatchMetadataModal: React.FC<BatchMetadataModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  allItems,
  defaultAuthor = '',
  defaultDate = '',
  onApply,
}) => {
  // If some items are selected, default to target 'selected'. If none selected, default to 'all'
  const hasSelected = selectedItems.length > 0;
  const [targetMode, setTargetMode] = useState<'selected' | 'all'>(
    hasSelected ? 'selected' : 'all'
  );

  // Metadata form values
  const [author, setAuthor] = useState<string>('');
  const [applyAuthor, setApplyAuthor] = useState<boolean>(true);

  const [reportDate, setReportDate] = useState<string>('');
  const [applyReportDate, setApplyReportDate] = useState<boolean>(true);

  const [sectionTag, setSectionTag] = useState<string>('');
  const [applySectionTag, setApplySectionTag] = useState<boolean>(false);

  const [notes, setNotes] = useState<string>('');
  const [applyNotes, setApplyNotes] = useState<boolean>(false);
  const [notesMode, setNotesMode] = useState<'replace' | 'append' | 'fill-empty'>('append');

  const [captionPrefix, setCaptionPrefix] = useState<string>('');
  const [applyCaptionPrefix, setApplyCaptionPrefix] = useState<boolean>(false);

  const [syncGlobalCover, setSyncGlobalCover] = useState<boolean>(true);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setTargetMode(hasSelected ? 'selected' : 'all');

      // Detect common author across selected or all items, or fall back to defaultAuthor
      const itemsToInspect = hasSelected ? selectedItems : allItems;
      const commonAuthor =
        itemsToInspect.find((i) => i.author)?.author || defaultAuthor || '';
      setAuthor(commonAuthor);
      setApplyAuthor(Boolean(commonAuthor));

      // Default date to today's date formatted (YYYY-MM-DD) or common date
      const commonDate =
        itemsToInspect.find((i) => i.reportDate)?.reportDate ||
        defaultDate ||
        new Date().toISOString().split('T')[0];
      setReportDate(commonDate);
      setApplyReportDate(true);

      // Section tag
      const commonTag = itemsToInspect.find((i) => i.sectionTag)?.sectionTag || '';
      setSectionTag(commonTag);
      setApplySectionTag(Boolean(commonTag));

      setNotes('');
      setApplyNotes(false);
      setCaptionPrefix('');
      setApplyCaptionPrefix(false);
    }
  }, [isOpen, hasSelected, selectedItems, allItems, defaultAuthor, defaultDate]);

  if (!isOpen) return null;

  const targetItems = targetMode === 'selected' ? selectedItems : allItems;
  const targetCount = targetItems.length;

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setReportDate(today);
    setApplyReportDate(true);
  };

  const handleClearAll = () => {
    setAuthor('');
    setApplyAuthor(false);
    setReportDate('');
    setApplyReportDate(false);
    setSectionTag('');
    setApplySectionTag(false);
    setNotes('');
    setApplyNotes(false);
    setCaptionPrefix('');
    setApplyCaptionPrefix(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      author: author.trim(),
      applyAuthor,
      reportDate: reportDate.trim(),
      applyReportDate,
      sectionTag: sectionTag.trim(),
      applySectionTag,
      notes: notes.trim(),
      applyNotes,
      notesMode,
      captionPrefix: captionPrefix.trim(),
      applyCaptionPrefix,
      syncGlobalCover,
      targetMode,
    });
    onClose();
  };

  const hasAnyFieldSelected =
    applyAuthor ||
    applyReportDate ||
    applySectionTag ||
    applyNotes ||
    applyCaptionPrefix;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-metadata-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="batch-metadata-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Batch Edit Metadata
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simultaneously update author, date, and notes across multiple notebook outputs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Items Selection Banner */}
          <div className="rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Apply Changes To:</span>
                <div className="inline-flex rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 p-0.5 text-xs shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setTargetMode('selected')}
                    disabled={!hasSelected}
                    className={`rounded-md px-3 py-1 font-semibold transition ${
                      targetMode === 'selected'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-40 disabled:hover:text-slate-600'
                    }`}
                  >
                    Selected Items ({selectedItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('all')}
                    className={`rounded-md px-3 py-1 font-semibold transition ${
                      targetMode === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300'
                    }`}
                  >
                    All Items ({allItems.length})
                  </button>
                </div>
              </div>

              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                {targetCount} figure{targetCount === 1 ? '' : 's'} will be updated
              </span>
            </div>

            {/* Thumbnail Preview strip */}
            {targetItems.length > 0 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                {targetItems.slice(0, 10).map((item, idx) => (
                  <div
                    key={item.id}
                    title={item.caption}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200/80 dark:border-blue-800 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 shadow-2xs"
                  >
                    {item.src && (
                      <img
                        src={item.src}
                        alt=""
                        className="h-5 w-5 rounded object-cover border border-slate-100 dark:border-slate-700"
                      />
                    )}
                    <span className="font-mono font-medium text-blue-800 dark:text-blue-300">
                      #{idx + 1}
                    </span>
                    <span className="max-w-[100px] truncate text-slate-600 dark:text-slate-400">
                      {item.caption || 'Output'}
                    </span>
                  </div>
                ))}
                {targetItems.length > 10 && (
                  <span className="shrink-0 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    +{targetItems.length - 10} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Form Fields Grid */}
          <div className="space-y-4">
            {/* 1. Author Name */}
            <div
              className={`rounded-xl border p-3.5 transition ${
                applyAuthor
                  ? 'border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-850 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyAuthor}
                    onChange={(e) => setApplyAuthor(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Author Name</span>
                </label>
                {defaultAuthor && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthor(defaultAuthor);
                      setApplyAuthor(true);
                    }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Use &quot;{defaultAuthor}&quot;
                  </button>
                )}
              </div>
              <input
                type="text"
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value);
                  setApplyAuthor(true);
                }}
                disabled={!applyAuthor}
                placeholder="e.g. Dr. Jane Doe / Data Science Team"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Attributed directly to each selected output figure in Word documentation.
              </p>
            </div>

            {/* 2. Report Date */}
            <div
              className={`rounded-xl border p-3.5 transition ${
                applyReportDate
                  ? 'border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-850 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyReportDate}
                    onChange={(e) => setApplyReportDate(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Report Date</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSetToday}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Set to Today
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReportDate('');
                      setApplyReportDate(true);
                    }}
                    className="text-[11px] text-slate-500 dark:text-slate-400 hover:underline"
                  >
                    Clear Date
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => {
                    setReportDate(e.target.value);
                    setApplyReportDate(true);
                  }}
                  disabled={!applyReportDate}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400"
                />
                <input
                  type="text"
                  value={reportDate}
                  onChange={(e) => {
                    setReportDate(e.target.value);
                    setApplyReportDate(true);
                  }}
                  disabled={!applyReportDate}
                  placeholder="or custom string e.g. Q3 2026 / Sept 2026"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400"
                />
              </div>
            </div>

            {/* 3. Section / Category Tag */}
            <div
              className={`rounded-xl border p-3.5 transition ${
                applySectionTag
                  ? 'border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-850 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applySectionTag}
                    onChange={(e) => setApplySectionTag(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <Tag className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Report Section / Category Tag</span>
                </label>
                <div className="flex items-center gap-1.5 text-[10px]">
                  {['Model Evaluation', 'Exploratory EDA', 'Training Curves'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSectionTag(tag);
                        setApplySectionTag(true);
                      }}
                      className="hidden sm:inline-block rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 px-1.5 py-0.5 text-slate-600 dark:text-slate-300 transition"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={sectionTag}
                onChange={(e) => {
                  setSectionTag(e.target.value);
                  setApplySectionTag(true);
                }}
                disabled={!applySectionTag}
                placeholder="e.g. Model Evaluation / Feature Analysis / Appendix"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400"
              />
            </div>

            {/* 4. Common Note / Analysis */}
            <div
              className={`rounded-xl border p-3.5 transition ${
                applyNotes
                  ? 'border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-850 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyNotes}
                    onChange={(e) => setApplyNotes(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Common Explanatory Note / Description</span>
                </label>

                {applyNotes && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Mode:</span>
                    <select
                      value={notesMode}
                      onChange={(e) => setNotesMode(e.target.value as any)}
                      className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="append">Append to existing notes</option>
                      <option value="replace">Overwrite existing notes</option>
                      <option value="fill-empty">Only fill empty notes</option>
                    </select>
                  </div>
                )}
              </div>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setApplyNotes(true);
                }}
                disabled={!applyNotes}
                rows={2}
                placeholder="e.g. Results verified on validation set using 5-fold cross validation. Baseline comparison indicates statistically significant improvement."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Sync with Cover Page Option */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 p-3">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={syncGlobalCover}
                onChange={(e) => setSyncGlobalCover(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <span>Also update Word Report Cover Page author and date to match</span>
            </label>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
              Press <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1 font-mono text-[10px]">Ctrl+Enter</kbd> to apply
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasAnyFieldSelected || targetCount === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Check className="h-4 w-4" />
                <span>
                  Apply Metadata to {targetCount} Figure{targetCount === 1 ? '' : 's'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
