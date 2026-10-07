import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ExtractionSettings } from './components/ExtractionSettings';
import { Toolbar, ViewMode, FilterCategory } from './components/Toolbar';
import { OutputCard } from './components/OutputCard';
import { PaginatedDocPreview } from './components/PaginatedDocPreview';
import { ImageLightbox } from './components/ImageLightbox';
import { DocxPreviewModal } from './components/DocxPreviewModal';
import { IntelligentGridVisualHelper } from './components/IntelligentGridVisualHelper';
import {
  BatchMetadataModal,
  BatchMetadataPayload,
} from './components/BatchMetadataModal';
import { GeneratedHistoryModal } from './components/GeneratedHistoryModal';
import {
  DocxGeneratingOverlay,
  DocxGenerationStep,
} from './components/DocxGeneratingOverlay';
import {
  NotebookOutputItem,
  ExtractionConfig,
  DocxConfig,
  NotebookMeta,
} from './types/notebook';
import { parseNotebook } from './utils/notebookParser';
import { generateDocxBlob, exportImagesAsZip } from './utils/docxGenerator';
import { generatePdfBlob, printCurrentReport } from './utils/pdfGenerator';
import { generateSampleNotebookJson } from './utils/sampleNotebook';
import {
  autoCaptionNotebookItems,
  isCaptionEmptyOrGeneric,
  generateAutoCaption,
} from './utils/autoCaptioner';
import {
  computeIntelligentLayout,
  rearrangeByIntelligentGrid,
} from './utils/intelligentGrid';
import {
  GeneratedDocumentRecord,
  getHistoryRecords,
  addHistoryRecord,
  deleteHistoryRecord,
  clearAllHistory,
  downloadHistoryItem,
} from './utils/historyStorage';
import {
  FileText,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileCode,
  Eye,
  Command,
  Sun,
  Moon,
  History,
  FileDown,
  Printer,
  GripVertical,
} from 'lucide-react';

export default function App() {
  // Theme state (persisted to localStorage)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('colab2doc_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  });

  // Sync theme with document class and localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('colab2doc_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);

  // DOCX Generation Progress & Visual Overlay
  const [isGeneratingDocx, setIsGeneratingDocx] = useState<boolean>(false);
  const [docxProgress, setDocxProgress] = useState<number>(0);
  const [docxStatus, setDocxStatus] = useState<string>('');
  const [docxStep, setDocxStep] = useState<DocxGenerationStep>('init');

  // AI Auto-Captioning State
  const [isCaptioning, setIsCaptioning] = useState<boolean>(false);

  // Filters & display
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [lightboxItem, setLightboxItem] = useState<NotebookOutputItem | null>(null);
  const [showDocPreviewModal, setShowDocPreviewModal] = useState<boolean>(false);
  const [showBatchMetadataModal, setShowBatchMetadataModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Intelligent Grid & Real-Time Page Footprint Helper State
  const [isIntelligentGridActive, setIsIntelligentGridActive] = useState<boolean>(false);
  const [showIntelligentGridHelper, setShowIntelligentGridHelper] = useState<boolean>(false);

  // Drag and drop reordering state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  // Document Generation History State
  const [historyRecords, setHistoryRecords] = useState<GeneratedDocumentRecord[]>([]);

  // Load initial history on mount
  useEffect(() => {
    setHistoryRecords(getHistoryRecords());
  }, []);

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
      const kernelName = json.metadata?.kernelspec?.display_name || json.metadata?.language_info?.name || 'Python 3';

      setNotebookFile(file);
      setNotebookJson(json);
      setNotebookMeta({
        name: file.name,
        size: file.size,
        cellCount: json.cells.length,
        codeCells,
        kernelName,
      });

      // Update doc title suggestion based on file name
      const cleanBaseName = file.name.replace(/\.ipynb$/i, '').replace(/[_-]/g, ' ');
      setDocxConfig((prev) => ({
        ...prev,
        reportTitle: `${cleanBaseName} Report`,
        fileName: file.name.replace(/\.ipynb$/i, ''),
      }));

      showToast(`Loaded "${file.name}" (${codeCells} code cells). Click "Extract Outputs" to begin.`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to read notebook file', 'error');
    }
  };

  // Load sample notebook
  const handleLoadSample = () => {
    const sample = generateSampleNotebookJson();
    const codeCells = sample.cells.filter((c: any) => c.cell_type === 'code').length;

    setNotebookFile(null);
    setNotebookJson(sample);
    setNotebookMeta({
      name: 'credit_risk_evaluation_demo.ipynb',
      size: JSON.stringify(sample).length,
      cellCount: sample.cells.length,
      codeCells,
      kernelName: 'Python 3 (Google Colab GPU)',
    });

    setDocxConfig((prev) => ({
      ...prev,
      reportTitle: 'Credit Risk Analysis & Model Evaluation Report',
      reportSubtitle: 'Performance metrics, ROC-AUC curves, and confusion matrix catalog',
      authorName: 'ML Risk Analytics Team',
      fileName: 'credit_risk_model_report',
    }));

    showToast('Loaded demo Machine Learning notebook! Starting output extraction...', 'info');

    // Automatically trigger extraction for sample for seamless onboarding
    setTimeout(() => {
      triggerExtraction(sample, 'credit_risk_evaluation_demo.ipynb');
    }, 400);
  };

  // Trigger Extraction
  const handleExtract = () => {
    if (!notebookJson) {
      showToast('Please select or drop a notebook file first.', 'error');
      return;
    }
    triggerExtraction(notebookJson, notebookMeta?.name || 'notebook.ipynb');
  };

  const triggerExtraction = (json: any, filename: string) => {
    setIsProcessing(true);
    setProgressPercent(10);
    setProgressStatus('Parsing code cells and notebook structure...');

    setTimeout(async () => {
      try {
        setProgressPercent(40);
        setProgressStatus('Isolating plots, HTML tables, and execution logs...');

        const items = await parseNotebook(json, extractionConfig);

        setProgressPercent(80);
        setProgressStatus(`Discovered ${items.length} output figures. Formatting previews...`);

        setTimeout(() => {
          setExtractedItems(items);
          setHasExtracted(true);
          setProgressPercent(100);
          setIsProcessing(false);

          if (items.length === 0) {
            showToast(
              'No matching outputs found in notebook code cells. Check extraction rules on the left.',
              'info'
            );
          } else {
            showToast(
              `Extracted ${items.length} output figures successfully!`,
              'success'
            );
          }
        }, 300);
      } catch (err: any) {
        setIsProcessing(false);
        showToast(err.message || 'Failed to extract outputs from notebook', 'error');
      }
    }, 350);
  };

  // Reset workspace
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

    setIsGeneratingDocx(true);
    setIsExporting(true);
    setDocxProgress(5);
    setDocxStatus('Initializing Word document layout and typography...');
    setDocxStep('init');

    try {
      const blob = await generateDocxBlob(
        extractedItems,
        docxConfig,
        notebookMeta?.name || 'notebook.ipynb',
        (percent, statusText) => {
          setDocxProgress(percent);
          setDocxStatus(statusText);
          if (percent < 15) {
            setDocxStep('init');
          } else if (percent < 80) {
            setDocxStep('figures');
          } else if (percent < 95) {
            setDocxStep('package');
          } else {
            setDocxStep('verify');
          }
        }
      );

      setDocxProgress(100);
      setDocxStatus(`Completed! Packaging ${active.length} figures...`);
      setDocxStep('verify');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = (docxConfig.fileName || 'notebook_outputs')
        .trim()
        .replace(/\.(docx|pdf)$/i, '')
        .replace(/[\\/:*?"<>|]/g, '-');
      a.download = `${cleanName}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      // Save into generated documents history
      try {
        const captions = active.map(
          (it, idx) => `Figure ${idx + 1}: ${it.caption || 'Output figure'}`
        );
        const record = await addHistoryRecord(
          {
            title: docxConfig.reportTitle || `${cleanName}.docx`,
            subtitle: docxConfig.reportSubtitle,
            author: docxConfig.authorName,
            fileName: `${cleanName}.docx`,
            itemCount: active.length,
            notebookName: notebookMeta?.name || 'notebook.ipynb',
            format: 'docx',
            captionsSummary: captions,
          },
          blob
        );
        setHistoryRecords((prev) => [record, ...prev.filter((r) => r.id !== record.id)].slice(0, 50));
      } catch (histErr) {
        console.warn('Failed to record document in history:', histErr);
      }

      // Brief delay so user sees 100% completion in overlay before it dismisses
      await new Promise((resolve) => setTimeout(resolve, 500));

      showToast(`Word report (${active.length} figures) generated, downloaded, and added to History!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate Word document', 'error');
    } finally {
      setIsGeneratingDocx(false);
      setIsExporting(false);
    }
  };

  // Export PDF (Client-side library generation)
  const handleExportPdf = async () => {
    const active = extractedItems.filter((i) => i.selected !== false);
    if (active.length === 0) {
      showToast('Please select at least one output figure to export to PDF.', 'error');
      return;
    }

    setIsExportingPdf(true);
    showToast('Generating PDF report...', 'info');

    try {
      const cleanName = (docxConfig.fileName || 'notebook_outputs')
        .trim()
        .replace(/\.(docx|pdf)$/i, '')
        .replace(/[\\/:*?"<>|]/g, '-');

      const blob = await generatePdfBlob(
        extractedItems,
        docxConfig,
        notebookMeta?.name || 'notebook.ipynb'
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      // Save PDF into history
      try {
        const captions = active.map(
          (it, idx) => `Figure ${idx + 1}: ${it.caption || 'Output figure'}`
        );
        const record = await addHistoryRecord(
          {
            title: docxConfig.reportTitle || `${cleanName}.pdf`,
            subtitle: docxConfig.reportSubtitle,
            author: docxConfig.authorName,
            fileName: `${cleanName}.pdf`,
            itemCount: active.length,
            notebookName: notebookMeta?.name || 'notebook.ipynb',
            format: 'pdf',
            captionsSummary: captions,
          },
          blob
        );
        setHistoryRecords((prev) => [record, ...prev.filter((r) => r.id !== record.id)].slice(0, 50));
      } catch (histErr) {
        console.warn('Failed to record PDF in history:', histErr);
      }

      showToast(`PDF report (${active.length} figures) generated, downloaded, and added to History!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate PDF report', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print PDF (Browser Native Print-to-PDF)
  const handlePrintPdf = () => {
    printCurrentReport();
  };

  // Real-time Intelligent Grid layout and page footprint estimation
  const intelligentLayoutSummary = useMemo(() => {
    return computeIntelligentLayout(extractedItems, docxConfig);
  }, [extractedItems, docxConfig]);

  // Intelligent Grid Aspect-Ratio Optimization Toggle Handler
  const handleToggleIntelligentGrid = (active: boolean) => {
    setIsIntelligentGridActive(active);
    if (active) {
      // Reorder figures by aspect-ratio affinity for optimal document packing density
      const reordered = rearrangeByIntelligentGrid(extractedItems);
      setExtractedItems(reordered);
      setDocxConfig((prev) => ({
        ...prev,
        autoLayout: 'side-by-side',
      }));
      showToast(
        'Intelligent Grid enabled: figures rearranged by aspect ratio & auto-layout set to Side-by-Side.',
        'info'
      );
    } else {
      setDocxConfig((prev) => ({
        ...prev,
        autoLayout: 'single-column',
      }));
      showToast(
        'Intelligent Grid disabled: Standard Single-Column layout restored.',
        'info'
      );
    }
  };

  // Apply rearrangement from the Intelligent Grid visual helper modal
  const handleApplyIntelligentRearrangement = (reorderedItems: NotebookOutputItem[]) => {
    setExtractedItems(reorderedItems);
    setIsIntelligentGridActive(true);
    setDocxConfig((prev) => ({
      ...prev,
      autoLayout: 'side-by-side',
    }));
    showToast('Applied Intelligent Grid layout arrangement!', 'success');
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
      const cleanZipName = `${docxConfig.fileName || 'outputs'}_images.zip`;
      a.download = cleanZipName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      // Save ZIP export into history
      try {
        const captions = active.map(
          (it, idx) => `Figure ${idx + 1}: ${it.caption || 'Output figure'}`
        );
        const record = await addHistoryRecord(
          {
            title: cleanZipName,
            subtitle: `Archive of ${active.length} high-resolution PNG outputs`,
            author: docxConfig.authorName,
            fileName: cleanZipName,
            itemCount: active.length,
            notebookName: notebookMeta?.name || 'notebook.ipynb',
            format: 'zip',
            captionsSummary: captions,
          },
          blob
        );
        setHistoryRecords((prev) => [record, ...prev.filter((r) => r.id !== record.id)].slice(0, 50));
      } catch (histErr) {
        console.warn('Failed to record ZIP in history:', histErr);
      }

      showToast(`Downloaded ZIP with ${active.length} figures and added to History!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to package ZIP', 'error');
    }
  };

  // History Actions
  const handleDeleteHistoryRecord = async (id: string) => {
    const updated = await deleteHistoryRecord(id);
    setHistoryRecords(updated);
    showToast('Removed document from history.', 'info');
  };

  const handleClearAllHistory = async () => {
    await clearAllHistory();
    setHistoryRecords([]);
    showToast('Cleared all document generation history.', 'info');
  };

  const handleDownloadHistoryRecord = async (record: GeneratedDocumentRecord) => {
    const success = await downloadHistoryItem(record);
    if (success) {
      showToast(`Downloaded "${record.fileName}" from history!`, 'success');
      return true;
    } else {
      showToast(`Failed to retrieve file from local history storage.`, 'error');
      return false;
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

  const handleUpdateCaption = (
    id: string,
    newCaption: string,
    newNotes?: string,
    newAuthor?: string,
    newReportDate?: string,
    newSectionTag?: string
  ) => {
    setExtractedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              caption: newCaption,
              notes: newNotes,
              author: newAuthor !== undefined ? newAuthor : item.author,
              reportDate: newReportDate !== undefined ? newReportDate : item.reportDate,
              sectionTag: newSectionTag !== undefined ? newSectionTag : item.sectionTag,
            }
          : item
      )
    );
  };

  // Drag and Drop reordering handlers
  const handleDragStart = (e: React.DragEvent, id: string, index: number) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string, index: number) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === id) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isTopHalf = e.clientY < rect.top + rect.height / 2;
    setDragOverItemId(id);
    setDropPosition(isTopHalf ? 'before' : 'after');
  };

  const handleDragEnter = (e: React.DragEvent, id: string, index: number) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent, id: string, index: number) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverItemId === id) {
        setDragOverItemId(null);
        setDropPosition(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string, index: number) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      setDropPosition(null);
      return;
    }

    setExtractedItems((prev) => {
      const sourceIdx = prev.findIndex((i) => i.id === draggedItemId);
      const targetIdx = prev.findIndex((i) => i.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const copy = [...prev];
      const [moved] = copy.splice(sourceIdx, 1);
      const newTargetIdx = copy.findIndex((i) => i.id === targetId);
      const insertIdx = dropPosition === 'after' ? newTargetIdx + 1 : newTargetIdx;
      copy.splice(insertIdx, 0, moved);
      return copy;
    });

    showToast('Reordered figures. Figure numbers automatically updated.', 'success');
    setDraggedItemId(null);
    setDragOverItemId(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
    setDropPosition(null);
  };

  // Bulk Apply Metadata across selected (or all) items
  const handleApplyBatchMetadata = (payload: BatchMetadataPayload) => {
    const isTargetSelected = payload.targetMode === 'selected';

    let updatedCount = 0;
    setExtractedItems((prev) =>
      prev.map((item) => {
        const shouldUpdate = isTargetSelected ? item.selected !== false : true;
        if (!shouldUpdate) return item;

        updatedCount++;
        let updatedNotes = item.notes;
        if (payload.applyNotes) {
          if (payload.notesMode === 'replace') {
            updatedNotes = payload.notes;
          } else if (payload.notesMode === 'append') {
            updatedNotes =
              item.notes && item.notes.trim()
                ? `${item.notes}\n${payload.notes}`
                : payload.notes;
          } else if (payload.notesMode === 'fill-empty') {
            if (!item.notes || !item.notes.trim()) {
              updatedNotes = payload.notes;
            }
          }
        }

        let updatedCaption = item.caption;
        if (payload.applyCaptionPrefix && payload.captionPrefix) {
          if (!updatedCaption.startsWith(payload.captionPrefix)) {
            updatedCaption = `${payload.captionPrefix}${updatedCaption}`;
          }
        }

        return {
          ...item,
          author: payload.applyAuthor ? payload.author : item.author,
          reportDate: payload.applyReportDate ? payload.reportDate : item.reportDate,
          sectionTag: payload.applySectionTag ? payload.sectionTag : item.sectionTag,
          notes: updatedNotes,
          caption: updatedCaption,
        };
      })
    );

    // Sync with global cover page config if enabled
    if (payload.syncGlobalCover) {
      setDocxConfig((prev) => ({
        ...prev,
        authorName: payload.applyAuthor && payload.author ? payload.author : prev.authorName,
        reportDate: payload.applyReportDate && payload.reportDate ? payload.reportDate : prev.reportDate,
      }));
    }

    showToast(
      `Updated common metadata across ${updatedCount} output figure${updatedCount === 1 ? '' : 's'}.`,
      'success'
    );
  };

  // AI-Assisted Auto-Captioning for Empty / Generic Captions
  const emptyCaptionCount = useMemo(() => {
    return extractedItems.filter((i) => isCaptionEmptyOrGeneric(i.caption)).length;
  }, [extractedItems]);

  const handleGenerateAllCaptions = async () => {
    if (extractedItems.length === 0) {
      showToast('Please extract or load a notebook first before generating captions.', 'info');
      return;
    }

    setIsCaptioning(true);
    try {
      // Yield briefly to event loop for smooth UI feedback and spinner rendering
      await new Promise((r) => setTimeout(r, 200));

      const { updatedItems, updatedCount } = autoCaptionNotebookItems(extractedItems);
      setExtractedItems(updatedItems);

      if (updatedCount > 0) {
        showToast(
          `Generated descriptive captions for ${updatedCount} figure${updatedCount > 1 ? 's' : ''} based on plot trends and table headers!`,
          'success'
        );
      } else {
        // If all items already had captions, refresh them with descriptive heuristic insights
        const forced = autoCaptionNotebookItems(extractedItems, { forceAll: true });
        setExtractedItems(forced.updatedItems);
        showToast(
          `Refreshed all ${forced.updatedCount} figure captions with AI trend heuristics!`,
          'success'
        );
      }
    } catch (err: any) {
      showToast('Error auto-generating captions. Please try again.', 'error');
    } finally {
      setIsCaptioning(false);
    }
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
        const matchAuthor = item.author?.toLowerCase().includes(q);
        const matchDate = item.reportDate?.toLowerCase().includes(q);
        const matchSection = item.sectionTag?.toLowerCase().includes(q);
        if (
          !matchCaption &&
          !matchNotes &&
          !matchCell &&
          !matchText &&
          !matchSubtype &&
          !matchAuthor &&
          !matchDate &&
          !matchSection
        ) {
          return false;
        }
      }

      return true;
    });
  }, [extractedItems, activeFilter, searchQuery]);

  // Global Keyboard Shortcuts
  // - Ctrl+Enter (Cmd+Enter): Trigger extraction
  // - Ctrl+S (Cmd+S): Save / Download Word Document (.docx)
  // - Alt+T: Toggle light/dark theme
  // - Alt+H: Open Generated Documents History
  // - Esc: Close Modals / Clear Selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // 1. Ctrl+Enter: Trigger Extraction
      if (isCtrlOrMeta && e.key === 'Enter') {
        e.preventDefault();
        if (isProcessing) return;
        if (notebookJson) {
          handleExtract();
        } else {
          showToast('Please upload or load a notebook first to extract (Ctrl+Enter).', 'info');
        }
        return;
      }

      // 2. Ctrl+S: Save / Download Word Document
      if (isCtrlOrMeta && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (isExporting) return;
        if (extractedItems.length === 0) {
          showToast('No output figures extracted yet. Extract a notebook first before saving Word doc (Ctrl+S).', 'info');
          return;
        }
        const active = extractedItems.filter((i) => i.selected !== false);
        if (active.length === 0) {
          showToast('No figures selected. Select at least one figure to export.', 'error');
          return;
        }
        handleDownloadDocx();
        return;
      }

      // 3. Alt+T: Theme toggle
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        handleToggleTheme();
        return;
      }

      // 4. Alt+H: History modal
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setShowHistoryModal((prev) => !prev);
        return;
      }

      // 5. Esc: Close Lightbox -> Close History -> Close Batch Metadata Modal -> Close Doc Preview Modal -> Clear Selection
      if (e.key === 'Escape') {
        if (lightboxItem) {
          e.preventDefault();
          setLightboxItem(null);
          return;
        }
        if (showHistoryModal) {
          e.preventDefault();
          setShowHistoryModal(false);
          return;
        }
        if (showBatchMetadataModal) {
          e.preventDefault();
          setShowBatchMetadataModal(false);
          return;
        }
        if (showDocPreviewModal) {
          e.preventDefault();
          setShowDocPreviewModal(false);
          return;
        }
        const hasSelection = extractedItems.some((i) => i.selected !== false);
        if (hasSelection) {
          e.preventDefault();
          handleDeselectAll();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    notebookJson,
    extractedItems,
    lightboxItem,
    showHistoryModal,
    showDocPreviewModal,
    showBatchMetadataModal,
    isProcessing,
    isExporting,
    docxConfig,
    notebookMeta,
    extractionConfig,
    theme,
  ]);

  const selectedActiveCount = extractedItems.filter((i) => i.selected !== false).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 transition-colors">
      {/* Top Header */}
      <Header
        hasItems={extractedItems.length > 0}
        itemCount={selectedActiveCount}
        onLoadSample={handleLoadSample}
        onDownloadDocx={handleDownloadDocx}
        onPreviewDocx={() => setShowDocPreviewModal(true)}
        onReset={handleReset}
        isProcessing={isProcessing}
        isExporting={isExporting}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        historyCount={historyRecords.length}
        onOpenHistory={() => setShowHistoryModal(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input, Rules, Settings (4 cols on desktop) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
            {/* Step 1: Upload / File Info */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px]">
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
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-colors">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px]">
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
                onPreviewDocx={() => setShowDocPreviewModal(true)}
                onGenerateAllCaptions={handleGenerateAllCaptions}
                itemCount={extractedItems.length}
                emptyCaptionCount={emptyCaptionCount}
                isCaptioning={isCaptioning}
              />
            </div>

            {/* Privacy note */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-[11px] text-slate-500 dark:text-slate-400 shadow-2xs transition-colors">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Client-Side Processing:</span> Files are parsed entirely inside your browser sandbox. Code cells and source code are strictly omitted so your report contains exclusively genuine execution outputs.
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
                  onExportPdf={handleExportPdf}
                  onPrintPdf={handlePrintPdf}
                  isExportingPdf={isExportingPdf}
                  selectedCount={selectedActiveCount}
                  onOpenDocPreviewModal={() => setShowDocPreviewModal(true)}
                  onOpenBatchMetadata={() => setShowBatchMetadataModal(true)}
                  onOpenHistory={() => setShowHistoryModal(true)}
                  historyCount={historyRecords.length}
                  isIntelligentGridActive={isIntelligentGridActive}
                  onToggleIntelligentGrid={handleToggleIntelligentGrid}
                  onOpenIntelligentGridHelper={() => setShowIntelligentGridHelper(true)}
                  estimatedPagesCount={
                    isIntelligentGridActive
                      ? intelligentLayoutSummary.intelligentPagesCount
                      : intelligentLayoutSummary.standardPagesCount
                  }
                  pagesSaved={intelligentLayoutSummary.pagesSaved}
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
                  <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <AlertCircle className="h-9 w-9 text-slate-300 dark:text-slate-600 mb-2" />
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">No matching outputs found</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
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
                        viewMode={viewMode}
                        onToggleSelect={handleToggleSelect}
                        onUpdateCaption={handleUpdateCaption}
                        onDelete={handleDeleteOne}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onOpenLightbox={setLightboxItem}
                        draggable={true}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedItemId === item.id}
                        isDropTarget={dragOverItemId === item.id && draggedItemId !== item.id}
                        dropPosition={dragOverItemId === item.id ? dropPosition : null}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredItems.map((item, idx) => (
                      <OutputCard
                        key={item.id}
                        item={item}
                        index={idx}
                        total={filteredItems.length}
                        isFirst={idx === 0}
                        isLast={idx === filteredItems.length - 1}
                        viewMode={viewMode}
                        onToggleSelect={handleToggleSelect}
                        onUpdateCaption={handleUpdateCaption}
                        onDelete={handleDeleteOne}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onOpenLightbox={setLightboxItem}
                        draggable={true}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedItemId === item.id}
                        isDropTarget={dragOverItemId === item.id && draggedItemId !== item.id}
                        dropPosition={dragOverItemId === item.id ? dropPosition : null}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Empty State when no notebook extracted */
              <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-colors">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mb-4 border border-blue-100 dark:border-blue-900 shadow-xs">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Ready to Extract Notebook Outputs
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1.5 leading-relaxed">
                  Upload any Google Colab or Jupyter <code className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1 py-0.5 rounded">.ipynb</code> file.
                  Outputs will appear here in execution sequence — plots, data tables, and streams — ready to be captioned, reordered by drag-and-drop, and exported into Word or PDF documents.
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

                  {historyRecords.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHistoryModal(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition active:scale-95"
                    >
                      <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>View History ({historyRecords.length})</span>
                    </button>
                  )}
                </div>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-left text-xs">
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Drag-and-Drop Order</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Reorder figures dynamically before generating reports. Sequential numbers update live.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Word & PDF Reports</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Generate both Microsoft Word (.docx) and portable PDF documents in one click.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Persistent History</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Previously generated files are preserved for instant re-download anytime.</p>
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

      {/* Prepared DOCX Document Fullscreen Preview Modal (Option to display before downloading) */}
      <DocxPreviewModal
        isOpen={showDocPreviewModal}
        onClose={() => setShowDocPreviewModal(false)}
        items={extractedItems}
        config={docxConfig}
        notebookFilename={notebookMeta?.name || 'notebook.ipynb'}
        onDownloadDocx={handleDownloadDocx}
        isExporting={isExporting}
      />

      {/* Batch Metadata Modal to edit author, date, notes across selected items */}
      <BatchMetadataModal
        isOpen={showBatchMetadataModal}
        onClose={() => setShowBatchMetadataModal(false)}
        selectedItems={extractedItems.filter((i) => i.selected !== false)}
        allItems={extractedItems}
        defaultAuthor={docxConfig.authorName}
        defaultDate={docxConfig.reportDate}
        onApply={handleApplyBatchMetadata}
      />

      {/* Generated Documents History Modal */}
      <GeneratedHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        records={historyRecords}
        onDeleteRecord={handleDeleteHistoryRecord}
        onClearHistory={handleClearAllHistory}
        onDownloadRecord={handleDownloadHistoryRecord}
        onExportPdf={handleExportPdf}
        onPrintPdf={handlePrintPdf}
        isExportingPdf={isExportingPdf}
        selectedCount={selectedActiveCount}
      />

      {/* Visual Progress Bar & Spinner Overlay for DOCX generation */}
      <DocxGeneratingOverlay
        isOpen={isGeneratingDocx}
        progress={docxProgress}
        statusText={docxStatus}
        step={docxStep}
        totalFigures={selectedActiveCount}
        fileName={docxConfig.fileName || 'notebook_outputs'}
      />

      {/* Intelligent Grid Real-Time Page Footprint & Visual Breakdown Helper Modal */}
      <IntelligentGridVisualHelper
        isOpen={showIntelligentGridHelper}
        onClose={() => setShowIntelligentGridHelper(false)}
        items={extractedItems}
        config={docxConfig}
        isIntelligentGridActive={isIntelligentGridActive}
        onToggleIntelligentGrid={handleToggleIntelligentGrid}
        onApplyRearrangement={handleApplyIntelligentRearrangement}
        onOpenDocPreviewModal={() => {
          setShowIntelligentGridHelper(false);
          setShowDocPreviewModal(true);
        }}
      />

      {/* Subtle Keyboard Shortcuts Guide Badge */}
      <div className="fixed bottom-4 left-4 z-30 hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 shadow-sm">
        <Command className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span className="font-medium text-slate-700 dark:text-slate-300">Shortcuts:</span>
        <span className="flex items-center gap-1 font-mono">
          <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Ctrl+Enter</kbd>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Extract</span>
        </span>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <span className="flex items-center gap-1 font-mono">
          <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Ctrl+S</kbd>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Save Docx</span>
        </span>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <span className="flex items-center gap-1 font-mono">
          <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Alt+T</kbd>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Theme</span>
        </span>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <span className="flex items-center gap-1 font-mono">
          <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Alt+H</kbd>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">History</span>
        </span>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          id="toast-notification"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-medium shadow-lg transition-all animate-bounceIn ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border border-rose-800 shadow-rose-950/20'
              : toast.type === 'success'
              ? 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-800 dark:border-slate-700 shadow-slate-950/20'
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
