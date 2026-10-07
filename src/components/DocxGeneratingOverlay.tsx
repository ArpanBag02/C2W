import React from 'react';
import {
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Layers,
  Archive,
  Check,
} from 'lucide-react';

export type DocxGenerationStep = 'init' | 'figures' | 'package' | 'verify';

interface DocxGeneratingOverlayProps {
  isOpen: boolean;
  progress: number;
  statusText: string;
  step: DocxGenerationStep;
  totalFigures: number;
  fileName: string;
}

export const DocxGeneratingOverlay: React.FC<DocxGeneratingOverlayProps> = ({
  isOpen,
  progress,
  statusText,
  step,
  totalFigures,
  fileName,
}) => {
  if (!isOpen) return null;

  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  // Define steps and their completion state
  const stepsList: Array<{
    id: DocxGenerationStep;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'init',
      label: 'Document Setup',
      description: 'Cover page & typography styles',
      icon: FileText,
    },
    {
      id: 'figures',
      label: `Figures (${totalFigures})`,
      description: 'Decoding & EMU scaling',
      icon: Layers,
    },
    {
      id: 'package',
      label: 'OpenXML Archive',
      description: 'Relations & ZIP compression',
      icon: Archive,
    },
    {
      id: 'verify',
      label: 'Integrity Check',
      description: 'Validating OpenXML parts',
      icon: ShieldCheck,
    },
  ];

  const getStepStatus = (stepId: DocxGenerationStep) => {
    const order: DocxGenerationStep[] = ['init', 'figures', 'package', 'verify'];
    const currentIndex = order.indexOf(step);
    const targetIndex = order.indexOf(stepId);

    if (clampedProgress === 100 || targetIndex < currentIndex) {
      return 'completed';
    }
    if (targetIndex === currentIndex) {
      return 'active';
    }
    return 'pending';
  };

  const cleanFileName = (fileName || 'notebook_outputs')
    .trim()
    .replace(/\.docx$/i, '')
    .replace(/[\\/:*?"<>|]/g, '-');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generating Word Document"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-all duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl shadow-slate-900/50 transition-all">
        {/* Decorative ambient gradient backdrop behind icon */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl" />

        {/* Center Spinner & Graphic */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
            {/* Outer Spinning Accent Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-indigo-500 animate-spin" />

            {/* Glowing Center Badge */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
              <FileText className="h-7 w-7 animate-pulse" />
            </div>

            {/* Mini Sparkle Indicator */}
            <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-900 shadow-sm border-2 border-white dark:border-slate-850">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1 mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span>OpenXML Document Processing</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Generating Word Document
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono max-w-sm truncate">
              {cleanFileName}.docx
            </p>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full space-y-2 mb-6">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-300">Export Progress</span>
              <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                {clampedProgress}%
              </span>
            </div>

            {/* Track */}
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/90 dark:border-slate-700 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 transition-all duration-300 ease-out relative"
                style={{ width: `${clampedProgress}%` }}
              >
                {/* Subtle animated light highlight on progress fill */}
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </div>
            </div>

            {/* Dynamic Status Text */}
            <div className="flex items-center justify-center gap-2 pt-1 text-center min-h-[22px]">
              <Loader2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate max-w-xs">
                {statusText || 'Processing figures and assembling document...'}
              </p>
            </div>
          </div>

          {/* Step Progress Checklist */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 text-left">
            {stepsList.map((s) => {
              const status = getStepStatus(s.id);
              const StepIcon = s.icon;
              return (
                <div
                  key={s.id}
                  className={`flex flex-col p-2.5 rounded-xl border text-[11px] transition-all ${
                    status === 'completed'
                      ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                      : status === 'active'
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50/70 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <StepIcon
                      className={`h-3.5 w-3.5 ${
                        status === 'completed'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : status === 'active'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    {status === 'completed' ? (
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                    ) : status === 'active' ? (
                      <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
                    ) : null}
                  </div>
                  <span className="font-semibold truncate">{s.label}</span>
                  <span
                    className={`text-[10px] truncate ${
                      status === 'completed'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : status === 'active'
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {s.description}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Security & Client-Side Notice */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 px-3.5 py-2 text-[11px] text-slate-500 dark:text-slate-400 text-left w-full">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="leading-tight">
              Generated 100% client-side in your browser. No files or images are sent to any external server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
