import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { NotebookOutputItem } from '../types/notebook';

interface ImageLightboxProps {
  item: NotebookOutputItem | null;
  items: NotebookOutputItem[];
  onClose: () => void;
  onNavigate: (newItem: NotebookOutputItem) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  item,
  items,
  onClose,
  onNavigate,
}) => {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setZoom(1);
  }, [item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!item) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        const currIdx = items.findIndex((i) => i.id === item.id);
        if (currIdx > 0) onNavigate(items[currIdx - 1]);
      }
      if (e.key === 'ArrowRight') {
        const currIdx = items.findIndex((i) => i.id === item.id);
        if (currIdx < items.length - 1) onNavigate(items[currIdx + 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, items, onClose, onNavigate]);

  if (!item) return null;

  const currIdx = items.findIndex((i) => i.id === item.id);

  const handleDownloadImage = () => {
    const a = document.createElement('a');
    a.href = item.src;
    const clean = item.caption.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
    a.download = `figure_${currIdx + 1}_${clean}.png`;
    a.click();
  };

  const handleCopy = async () => {
    try {
      const res = await fetch(item.src);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
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

  return (
    <div
      id="image-lightbox-modal"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Top Header */}
      <div
        className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold bg-blue-600 px-2 py-0.5 rounded text-white">
            Figure {String(currIdx + 1).padStart(2, '0')}
          </span>
          <div>
            <h3 className="text-sm font-semibold truncate max-w-md">{item.caption}</h3>
            <p className="text-[11px] text-slate-400">
              Cell {item.cellIndex + 1} • Output #{item.outputIndex + 1} • {item.dim.w} × {item.dim.h} px
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-lg bg-slate-800 p-1 text-slate-300">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              title="Zoom out"
              className="p-1 hover:text-white"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-mono">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              title="Zoom in"
              className="p-1 hover:text-white"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              title="Reset Zoom"
              className="p-1 hover:text-white border-l border-slate-700 ml-1 pl-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy image"
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            title="Download PNG"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition"
          >
            <Download className="h-4 w-4" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center p-6 overflow-auto"
        onClick={onClose}
      >
        {/* Prev / Next Nav */}
        {currIdx > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(items[currIdx - 1]);
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800/80 text-white hover:bg-slate-700 shadow-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {currIdx < items.length - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(items[currIdx + 1]);
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800/80 text-white hover:bg-slate-700 shadow-lg"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Scaled Image */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="transition-transform duration-150 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          <img
            src={item.src}
            alt={item.caption}
            className="max-h-[82vh] max-w-[85vw] object-contain rounded-lg shadow-2xl bg-white"
          />
        </div>
      </div>
    </div>
  );
};
