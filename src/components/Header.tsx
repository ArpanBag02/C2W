import React from 'react';
import {
  FileText,
  Sparkles,
  Download,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sun,
  Moon,
  History,
} from 'lucide-react';

interface HeaderProps {
  hasItems: boolean;
  itemCount: number;
  onLoadSample: () => void;
  onDownloadDocx: () => void;
  onPreviewDocx?: () => void;
  onReset: () => void;
  isProcessing: boolean;
  isExporting: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  historyCount: number;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasItems,
  itemCount,
  onLoadSample,
  onDownloadDocx,
  onPreviewDocx,
  onReset,
  isProcessing,
  isExporting,
  theme,
  onToggleTheme,
  historyCount,
  onOpenHistory,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Colab<span className="text-blue-600 dark:text-blue-400">2Doc</span>
              </span>
              <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Notebook Output Extractor & Word Report Generator
            </p>
          </div>
        </div>

        {/* Center privacy indicator */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>100% Client-Side Privacy — Notebooks Never Leave Your Browser</span>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2">
          {/* History Button */}
          <button
            id="header-history-btn"
            type="button"
            onClick={onOpenHistory}
            title={`View generated documents history (${historyCount} saved)`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-95 shadow-2xs"
          >
            <History className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 px-1 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                {historyCount}
              </span>
            )}
          </button>

          {/* Theme Toggle (Light / Dark Mode) */}
          <button
            id="header-theme-toggle"
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-95 shadow-2xs"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 animate-spin-once" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 animate-spin-once" />
            )}
          </button>

          {!hasItems ? (
            <button
              id="load-sample-btn"
              type="button"
              onClick={onLoadSample}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/80 px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 transition hover:bg-blue-100 dark:hover:bg-blue-900 active:scale-95 disabled:opacity-50 shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Try Sample ML Notebook</span>
            </button>
          ) : (
            <>
              <button
                id="header-reset-btn"
                type="button"
                onClick={onReset}
                title="Clear notebook and reset"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              {onPreviewDocx && (
                <button
                  id="header-preview-docx-btn"
                  type="button"
                  onClick={onPreviewDocx}
                  disabled={itemCount === 0}
                  title="Display prepared Word document before downloading"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-700 dark:hover:text-blue-400 transition active:scale-95 disabled:opacity-50 shadow-2xs"
                >
                  <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">Preview Docx</span>
                </button>
              )}
              <button
                id="header-export-docx-btn"
                type="button"
                onClick={onDownloadDocx}
                disabled={isExporting || itemCount === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>
                  {isExporting ? 'Generating...' : `Export Word (${itemCount})`}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
