import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ExtractionSettings } from './components/ExtractionSettings';
import { Toolbar, ViewMode, FilterCategory } from './components/Toolbar';
import { OutputCard } from './components/OutputCard';
import { PaginatedDocPreview } from './components/PaginatedDocPreview';
import { ImageLightbox } from './components/ImageLightbox';
import {
  NotebookOutputItem,
  ExtractionConfig,
  DocxConfig,
  NotebookMeta,
} from './types/notebook';
import { parseNotebook } from './utils/notebookParser';
import { generateDocxBlob, exportImagesAsZip } from './utils/docxGenerator';
import { generateSampleNotebookJson } from './utils/sampleNotebook';
import {
  FileText,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileCode,
} from 'lucide-react';

export default function App() {
  // Notebook state
  const [notebookFile, setNotebookFile] = useState<File | null>(null);
  const [notebookJson, setNotebookJson] = useState<any | null>(null);
  const [notebookMeta, setNotebookMeta] = useState<NotebookMeta | null>(null);
  const [extractedItems, setExtractedItems] = useState<NotebookOutputItem[]>([]);

  // Processing & progress
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);

  // Filters & display
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [lightboxItem, setLightboxItem] = useState<NotebookOutputItem | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Configurations
  const [extractionConfig, setExtractionConfig] = useState<ExtractionConfig>({
    includeDisplayData: true,
    includeStreams: true,
    includeErrors: true,
    includeEmpty: false,
    mergeConsecutiveStreams: true,
    autoInferCaptions: true,
  });

  const [docxConfig, setDocxConfig] = useState<DocxConfig>({
    titlePage: true,
    reportTitle: 'Notebook Outputs Report',
    reportSubtitle: 'Executive summary and figure catalog',
    authorName: 'Data Science Team',
    labelCaption: true,
    addCellRef: true,
    addPageBreaks: false,
    fontFamily: 'Aptos',
    fileName: 'notebook_outputs',
  });

  // Handle uploaded file
  const handleFileSelected = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.ipynb') && !file.name.toLowerCase().endsWith('.json')) {
      showToast('Please upload a valid .ipynb or notebook JSON file.', 'error');
      return;
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!Array.isArray(json.cells)) {
        throw new Error('Invalid notebook JSON: missing "cells" array.');
      }

      const codeCells = json.cells.filter((c: any) => c.cell_type === 'code').length;
      const markdownCells = json.cells.filter((c: any) => c.cell_type === 'markdown').length;
      const kernel = json.metadata?.kernelspec?.display_name || json.metadata?.language_info?.name;

      setNotebookFile(file);
      setNotebookJson(json);
      setNotebookMeta({
        name: file.name,
        size: file.size,
        totalCells: json.cells.length,
        codeCells,
        markdownCells,
        kernelName: kernel,
      });

      const baseName = file.name.replace(/\.ipynb$/i, '');
      setDocxConfig((prev) => ({
        ...prev,
        reportTitle: `${baseName} — Notebook Outputs`,
        fileName: `${baseName}_outputs`,
      }));

      setExtractedItems([]);
      setHasExtracted(false);
      showToast(`Loaded "${file.name}" with ${codeCells} code cells. Ready to extract!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to read notebook file', 'error');
    }
  };

  // Handle Sample Notebook
  const handleLoadSample = async () => {
    const sampleJson = generateSampleNotebookJson();
    const mockFile = new File([JSON.stringify(sampleJson)], 'customer_churn_analysis.ipynb', {
      type: 'application/json',
    });

    setNotebookFile(mockFile);
    setNotebookJson(sampleJson);
    setNotebookMeta({
      name: 'customer_churn_analysis.ipynb',
      size: 145200,
      totalCells: sampleJson.cells.length,
      codeCells: sampleJson.cells.length,
      markdownCells: 0,
      kernelName: 'Python 3.10 (ipykernel)',
    });

    setDocxConfig((prev) => ({
      ...prev,
      reportTitle: 'Customer Churn Predictive Model — Findings & Metrics',
      reportSubtitle: 'Machine Learning Evaluation, ROC Curves, and Feature Importance Analysis',
      authorName: 'AI & Analytics Lab',
      fileName: 'churn_analysis_outputs',
    }));

    showToast('Loaded sample machine learning notebook with plots and tables.', 'info');

    // Auto extract sample notebook so the user gets instant joy
    setTimeout(() => {
      extractOutputsInternal(sampleJson);
    }, 100);
  };

  // Extract function
  const extractOutputsInternal = async (jsonToUse = notebookJson) => {
    if (!jsonToUse) {
      showToast('Please select or upload a notebook first.', 'error');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(5);
    setProgressStatus('Scanning code cells and output objects...');

    try {
      const items = await parseNotebook(
        jsonToUse,
        extractionConfig,
        (percent, statusText) => {
          setProgressPercent(percent);
          setProgressStatus(statusText);
        }
      );

      setExtractedItems(items);
      setHasExtracted(true);
      showToast(`Extracted ${items.length} output figures successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error parsing outputs', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtract = () => {
    extractOutputsInternal();
  };

  const handleReset = () => {
    setNotebookFile(null);
    setNotebookJson(null);
    setNotebookMeta(null);
    setExtractedItems([]);
    setHasExtracted(false);
    showToast('Workspace reset.', 'info');
  };

  // Export DOCX
  const handleDownloadDocx = async () => {
    const active = extractedItems.filter((i) => i.selected !== false);
    if (active.length === 0) {
      showToast('Please select at least one output figure to export.', 'error');
      return;
    }

    setIsExporting(true);
    showToast('Compiling OpenXML Word document and embedding images...', 'info');

    try {
      const blob = await generateDocxBlob(
        extractedItems,
        docxConfig,
        notebookMeta?.name || 'notebook.ipynb'
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = (docxConfig.fileName || 'notebook_outputs')
        .trim()
        .replace(/\.docx$/i, '')
        .replace(/[\\/:*?"<>|]/g, '-');
      a.download = `${cleanName}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      showToast(`Word report (${active.length} figures) generated and downloaded!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate Word document', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Export ZIP of PNGs
  const handleExportZip = async () => {
    const active = extractedItems.filter((i) => i.selected !== false);
    if (active.length === 0) {
      showToast('No figures selected for ZIP export.', 'error');
      return;
    }

    showToast('Compressing images into ZIP archive...', 'info');
    try {
      const blob = await exportImagesAsZip(
        extractedItems,
        'figures.zip'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docxConfig.fileName || 'outputs'}_images.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      showToast(`Downloaded ZIP with ${active.length} figures!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to package ZIP', 'error');
    }
  };

  // Item manipulations
  const handleToggleSelect = (id: string) => {
    setExtractedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: item.selected === false ? true : false } : item
      )
    );
  };

  const handleSelectAll = () => {
    setExtractedItems((prev) => prev.map((item) => ({ ...item, selected: true })));
    showToast('Selected all outputs.', 'info');
  };

  const handleDeselectAll = () => {
    setExtractedItems((prev) => prev.map((item) => ({ ...item, selected: false })));
    showToast('Deselected all outputs.', 'info');
  };

  const handleDeleteSelected = () => {
    const count = extractedItems.filter((i) => i.selected !== false).length;
    if (count === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${count} selected output(s)?`)) return;

    setExtractedItems((prev) => prev.filter((item) => item.selected === false));
    showToast(`Deleted ${count} outputs. Figures automatically renumbered.`, 'info');
  };

  const handleDeleteOne = (id: string) => {
    setExtractedItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Output removed.', 'info');
  };

  const handleUpdateCaption = (id: string, newCaption: string, newNotes?: string) => {
    setExtractedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, caption: newCaption, notes: newNotes } : item
      )
    );
    showToast('Figure updated.', 'success');
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setExtractedItems((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= extractedItems.length - 1) return;
    setExtractedItems((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Filter pipeline
  const filteredItems = useMemo(() => {
    return extractedItems.filter((item) => {
      // Category filter
      if (activeFilter === 'charts' && item.kind !== 'image' && item.kind !== 'svg') return false;
      if (activeFilter === 'tables' && item.kind !== 'html' && item.subtype !== 'html-table') return false;
      if (activeFilter === 'console' && item.outputType !== 'stream') return false;
      if (activeFilter === 'errors' && item.outputType !== 'error') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCaption = item.caption.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        const matchCell = `cell ${item.cellIndex + 1}`.includes(q);
        const matchText = item.rawText?.toLowerCase().includes(q);
        const matchSubtype = item.subtype.toLowerCase().includes(q);
        if (!matchCaption && !matchNotes && !matchCell && !matchText && !matchSubtype) {
          return false;
        }
      }

      return true;
    });
  }, [extractedItems, activeFilter, searchQuery]);

  const selectedActiveCount = extractedItems.filter((i) => i.selected !== false).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <Header
        hasItems={extractedItems.length > 0}
        itemCount={selectedActiveCount}
        onLoadSample={handleLoadSample}
        onDownloadDocx={handleDownloadDocx}
        onReset={handleReset}
        isProcessing={isProcessing}
        isExporting={isExporting}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input, Rules, Settings (4 cols on desktop) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
            {/* Step 1: Upload / File Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[11px]">
                  1
                </span>
                <span>Select Notebook</span>
              </div>

              <UploadZone
                notebookMeta={notebookMeta}
                onFileSelected={handleFileSelected}
                onLoadSample={handleLoadSample}
                onExtract={handleExtract}
                onReset={handleReset}
                isProcessing={isProcessing}
                progressPercent={progressPercent}
                progressStatus={progressStatus}
                hasExtracted={hasExtracted}
              />
            </div>

            {/* Step 2: Extraction Rules & Word Configuration */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[11px]">
                  2
                </span>
                <span>Settings & Word Style</span>
              </div>

              <ExtractionSettings
                extractionConfig={extractionConfig}
                onExtractionConfigChange={setExtractionConfig}
                docxConfig={docxConfig}
                onDocxConfigChange={setDocxConfig}
                disabled={isProcessing}
              />
            </div>

            {/* Privacy note */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-500 shadow-2xs">
              <span className="font-semibold text-slate-700">Client-Side Processing:</span> Files are parsed entirely inside your browser sandbox. Code cells and source code are strictly omitted so your report contains exclusively genuine execution outputs.
            </div>
          </div>

          {/* Right Column: Results Stage & Preview (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-4">
            {extractedItems.length > 0 ? (
              <>
                {/* Search, Filter Tabs & Bulk Actions */}
                <Toolbar
                  items={extractedItems}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onDeleteSelected={handleDeleteSelected}
                  onExportZip={handleExportZip}
                  selectedCount={selectedActiveCount}
                />

                {/* Main Views */}
                {viewMode === 'doc' ? (
                  <PaginatedDocPreview
                    items={filteredItems}
                    config={docxConfig}
                    notebookFilename={notebookMeta?.name || 'notebook.ipynb'}
                    onDownload={handleDownloadDocx}
                    isExporting={isExporting}
                  />
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
                    <AlertCircle className="h-9 w-9 text-slate-300 mb-2" />
                    <h4 className="text-sm font-semibold text-slate-700">No matching outputs found</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing your search query or selecting a different category filter.
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map((item, idx) => (
                      <OutputCard
                        key={item.id}
                        item={item}
                        index={idx}
                        total={filteredItems.length}
                        isFirst={idx === 0}
                        isLast={idx === filteredItems.length - 1}
                        onToggleSelect={handleToggleSelect}
                        onUpdateCaption={handleUpdateCaption}
                        onDelete={handleDeleteOne}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onOpenLightbox={setLightboxItem}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredItems.map((item, idx) => (
                      <OutputCard
                        key={item.id}
                        item={item}
                        index={idx}
                        total={filteredItems.length}
                        isFirst={idx === 0}
                        isLast={idx === filteredItems.length - 1}
                        onToggleSelect={handleToggleSelect}
                        onUpdateCaption={handleUpdateCaption}
                        onDelete={handleDeleteOne}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onOpenLightbox={setLightboxItem}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Empty State when no notebook extracted */
              <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-2xl border border-dashed border-slate-200 bg-white shadow-2xs">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-100 shadow-xs">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Ready to Extract Notebook Outputs
                </h3>
                <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
                  Upload any Google Colab or Jupyter <code className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">.ipynb</code> file.
                  Outputs will appear here in execution sequence — plots, data tables, and streams — ready to be captioned and exported into a Word document.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Load Demo ML Notebook</span>
                  </button>
                </div>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-left text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="font-bold text-slate-800 block mb-1">Pure Outputs</span>
                    <p className="text-[11px] text-slate-500">Source code cells are automatically excluded from the final report.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="font-bold text-slate-800 block mb-1">Auto Numbering</span>
                    <p className="text-[11px] text-slate-500">Figures are sequentially numbered (Fig 01, 02) and renumbered on deletions.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="font-bold text-slate-800 block mb-1">Native Word</span>
                    <p className="text-[11px] text-slate-500">Standard OpenXML format opens seamlessly in MS Word, Google Docs, and LibreOffice.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fullscreen Lightbox Modal */}
      <ImageLightbox
        item={lightboxItem}
        items={filteredItems}
        onClose={() => setLightboxItem(null)}
        onNavigate={(newItem) => setLightboxItem(newItem)}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          id="toast-notification"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-medium shadow-lg transition-all animate-bounceIn ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border border-rose-800 shadow-rose-950/20'
              : toast.type === 'success'
              ? 'bg-slate-900 text-white border border-slate-800 shadow-slate-950/20'
              : 'bg-blue-900 text-white border border-blue-800 shadow-blue-950/20'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
