import React, { useState, useMemo } from 'react';
import {
  History,
  X,
  Download,
  Trash2,
  FileText,
  Archive,
  Search,
  Calendar,
  Layers,
  HardDrive,
  ChevronDown,
  ChevronUp,
  FileCheck,
  AlertTriangle,
  Sparkles,
  FileDown,
  Printer,
} from 'lucide-react';
import {
  GeneratedDocumentRecord,
  formatBytes,
  downloadHistoryItem,
} from '../utils/historyStorage';

interface GeneratedHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: GeneratedDocumentRecord[];
  onDeleteRecord: (id: string) => void;
  onClearHistory: () => void;
  onDownloadRecord: (record: GeneratedDocumentRecord) => Promise<boolean>;
  onExportPdf?: () => void;
  onPrintPdf?: () => void;
  isExportingPdf?: boolean;
  selectedCount?: number;
}

export const GeneratedHistoryModal: React.FC<GeneratedHistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onDeleteRecord,
  onClearHistory,
  onDownloadRecord,
  onExportPdf,
  onPrintPdf,
  isExportingPdf = false,
  selectedCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFormat, setFilterFormat] = useState<'all' | 'docx' | 'pdf' | 'zip'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterFormat !== 'all' && r.format !== filterFormat) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchFile = r.fileName.toLowerCase().includes(q);
        const matchNotebook = r.notebookName.toLowerCase().includes(q);
        const matchAuthor = r.author?.toLowerCase().includes(q);
        const matchCaptions = r.captionsSummary?.some((c) => c.toLowerCase().includes(q));
        if (!matchTitle && !matchFile && !matchNotebook && !matchAuthor && !matchCaptions) {
          return false;
        }
      }
      return true;
    });
  }, [records, filterFormat, searchQuery]);

  // Aggregate stats
  const totalSize = useMemo(() => {
    return records.reduce((acc, r) => acc + (r.fileSize || 0), 0);
  }, [records]);

  const totalFigures = useMemo(() => {
    return records.reduce((acc, r) => acc + (r.itemCount || 0), 0);
  }, [records]);

  if (!isOpen) return null;

  const handleDownload = async (record: GeneratedDocumentRecord) => {
    setIsDownloadingId(record.id);
    try {
      await onDownloadRecord(record);
    } finally {
      setIsDownloadingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Document Generation History
                </h2>
                <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {records.length} {records.length === 1 ? 'doc' : 'docs'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track, inspect, and instantly re-download previously exported Word reports, PDFs, and ZIP archives
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExportPdf && (
              <div className="flex items-center rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-2xs">
                <button
                  type="button"
                  id="btn-history-save-pdf"
                  onClick={onExportPdf}
                  disabled={isExportingPdf || selectedCount === 0}
                  title="Generate and download PDF report from selected figures"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-l-lg transition active:scale-95 disabled:opacity-50"
                >
                  <FileDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  <span>{isExportingPdf ? 'Exporting PDF...' : 'Save as PDF'}</span>
                </button>
                {onPrintPdf && (
                  <button
                    type="button"
                    id="btn-history-print-pdf"
                    onClick={onPrintPdf}
                    title="Print to PDF using native browser print dialog"
                    className="p-1.5 border-l border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-r-lg text-rose-600 dark:text-rose-400 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {records.length > 0 && (
              <>
                {showClearConfirm ? (
                  <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-lg px-2.5 py-1 text-xs">
                    <span className="text-rose-700 dark:text-rose-300 font-medium">Clear all?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClearHistory();
                        setShowClearConfirm(false);
                      }}
                      className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700 text-xs"
                    >
                      Yes, Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 transition"
                    title="Clear history"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear History</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Aggregate Stats Banner */}
        {records.length > 0 && (
          <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 px-6 py-3 text-xs">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="text-slate-500 dark:text-slate-400">Total Exports: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{records.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="text-slate-500 dark:text-slate-400">Figures Packaged: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{totalFigures}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <div>
                <span className="text-slate-500 dark:text-slate-400">Total Size: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBytes(totalSize)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        {records.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 p-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, filename, author, notebook..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 py-1.5 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter by format */}
            <div className="flex flex-wrap items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterFormat('all')}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  filterFormat === 'all'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterFormat('docx')}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  filterFormat === 'docx'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Word ({records.filter((r) => r.format === 'docx').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterFormat('pdf')}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  filterFormat === 'pdf'
                    ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                PDF ({records.filter((r) => r.format === 'pdf').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterFormat('zip')}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  filterFormat === 'zip'
                    ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                ZIP ({records.filter((r) => r.format === 'zip').length})
              </button>
            </div>
          </div>
        )}

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 mb-4">
                <FileText className="h-8 w-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                No Generated Documents Yet
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                When you click <span className="font-semibold text-slate-700 dark:text-slate-300">&quot;Export Word&quot;</span>, <span className="font-semibold text-slate-700 dark:text-slate-300">&quot;Save as PDF&quot;</span>, or <span className="font-semibold text-slate-700 dark:text-slate-300">&quot;ZIP Images&quot;</span>, your reports will be saved here so you can re-download or inspect them anytime.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No documents match your search query &quot;{searchQuery}&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterFormat('all');
                }}
                className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Reset filter
              </button>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const isExpanded = expandedId === record.id;
              const isWord = record.format === 'docx';
              const isPdf = record.format === 'pdf';

              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-4 transition shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                          isWord
                            ? 'bg-blue-600 text-white'
                            : isPdf
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {isWord ? (
                          <FileText className="h-5 w-5" />
                        ) : isPdf ? (
                          <FileCheck className="h-5 w-5" />
                        ) : (
                          <Archive className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {record.title}
                          </h4>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isWord
                                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                                : isPdf
                                ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            }`}
                          >
                            {record.format}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                            {record.fileName}
                          </span>
                        </div>

                        {/* Metadata Details */}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(record.createdAt)}
                          </span>
                          <span>•</span>
                          <span>
                            <strong className="text-slate-700 dark:text-slate-300">{record.itemCount}</strong> figures
                          </span>
                          <span>•</span>
                          <span>{record.fileSizeFormatted}</span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]" title={record.notebookName}>
                            Notebook: <span className="font-mono text-slate-600 dark:text-slate-300">{record.notebookName}</span>
                          </span>
                          {record.author && (
                            <>
                              <span>•</span>
                              <span>Author: {record.author}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleDownload(record)}
                        disabled={isDownloadingId === record.id}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50 text-white ${
                          isPdf
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        title="Download file again"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{isDownloadingId === record.id ? 'Downloading...' : 'Download'}</span>
                      </button>

                      {isPdf && onPrintPdf && (
                        <button
                          type="button"
                          onClick={onPrintPdf}
                          title="Print to PDF using native dialog"
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 transition"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Print</span>
                        </button>
                      )}

                      {!isPdf && onExportPdf && (
                        <button
                          type="button"
                          onClick={onExportPdf}
                          disabled={isExportingPdf}
                          title="Generate and export as PDF report"
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 transition active:scale-95 disabled:opacity-50"
                        >
                          <FileDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Save as PDF</span>
                        </button>
                      )}

                      {record.captionsSummary && record.captionsSummary.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : record.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition"
                          title="View included figures"
                        >
                          <span>{isExpanded ? 'Hide Info' : 'Details'}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteRecord(record.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 transition"
                        title="Delete from history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Figure Captions Summary */}
                  {isExpanded && record.captionsSummary && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        Included Output Figures ({record.captionsSummary.length}):
                      </h5>
                      <ul className="space-y-1 pl-4 list-disc text-slate-600 dark:text-slate-400 max-h-36 overflow-y-auto">
                        {record.captionsSummary.map((cap, i) => (
                          <li key={i} className="truncate">
                            {cap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Generated documents are stored client-side for quick access.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-200 dark:bg-slate-800 px-4 py-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
