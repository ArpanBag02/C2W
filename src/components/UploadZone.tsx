import React, { useRef, useState } from 'react';
import { UploadCloud, FileCode2, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { NotebookMeta } from '../types/notebook';

interface UploadZoneProps {
  notebookMeta: NotebookMeta | null;
  onFileSelected: (file: File) => void;
  onLoadSample: () => void;
  onExtract: () => void;
  onReset: () => void;
  isProcessing: boolean;
  progressPercent: number;
  progressStatus: string;
  hasExtracted: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  notebookMeta,
  onFileSelected,
  onLoadSample,
  onExtract,
  onReset,
  isProcessing,
  progressPercent,
  progressStatus,
  hasExtracted,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Dropzone */}
      <div
        id="dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
            : 'border-slate-300 bg-slate-50/60 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          id="notebook-file-input"
          type="file"
          accept=".ipynb,application/json"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-blue-600 mb-3">
          <UploadCloud className="h-6 w-6" />
        </div>

        <h3 className="text-sm font-semibold text-slate-800">
          Drop your Google Colab or Jupyter <span className="text-blue-600 font-mono">.ipynb</span>
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          or click to browse from your computer (processed locally)
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSample();
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-200 shadow-2xs hover:bg-blue-50 transition"
          >
            <Sparkles className="h-3 w-3" />
            <span>Load sample notebook instead</span>
          </button>
        </div>
      </div>

      {/* Selected File Details */}
      {notebookMeta && (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <FileCode2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {notebookMeta.name}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span>{formatBytes(notebookMeta.size)}</span>
                  <span>•</span>
                  <span>{notebookMeta.codeCells} code cell{notebookMeta.codeCells === 1 ? '' : 's'}</span>
                  {notebookMeta.kernelName && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{notebookMeta.kernelName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onReset}
              title="Change notebook"
              className="text-slate-400 hover:text-slate-600 p-1 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action Trigger */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              id="extract-outputs-btn"
              type="button"
              onClick={onExtract}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 px-3 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Extracting Outputs...</span>
                </>
              ) : hasExtracted ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Re-extract Outputs</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Extract Outputs ({notebookMeta.codeCells} cells)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Extraction Progress Bar */}
      {isProcessing && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-900 mb-1.5">
            <span>Extracting notebook outputs</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200/70">
            <div
              className="h-full bg-blue-600 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-blue-700 truncate">
            {progressStatus}
          </p>
        </div>
      )}
    </div>
  );
};
