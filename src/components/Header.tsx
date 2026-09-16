import React from 'react';
import { FileText, Sparkles, Download, ShieldCheck, RefreshCw, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  hasItems: boolean;
  itemCount: number;
  onLoadSample: () => void;
  onDownloadDocx: () => void;
  onReset: () => void;
  isProcessing: boolean;
  isExporting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hasItems,
  itemCount,
  onLoadSample,
  onDownloadDocx,
  onReset,
  isProcessing,
  isExporting,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Colab<span className="text-blue-600">2Doc</span>
              </span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Notebook Output Extractor & Word Report Generator
            </p>
          </div>
        </div>

        {/* Center privacy indicator */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>100% Client-Side Privacy — Notebooks Never Leave Your Browser</span>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2">
          {!hasItems ? (
            <button
              id="load-sample-btn"
              type="button"
              onClick={onLoadSample}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-95 disabled:opacity-50 shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>Try Sample ML Notebook</span>
            </button>
          ) : (
            <>
              <button
                id="header-reset-btn"
                type="button"
                onClick={onReset}
                title="Clear notebook and reset"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
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
