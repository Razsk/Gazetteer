'use client';

import React, { useState } from 'react';
import { Page } from '@/store/scenarioStore';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  Layers,
  Columns2,
  Check,
} from 'lucide-react';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: Page[];
  activePageId: string;
  scenarioTitle?: string;
  onConfirmPrint: (selectedPageIds: string[]) => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  pages,
  activePageId,
  scenarioTitle = 'Scenario',
  onConfirmPrint,
}) => {
  const [printScope, setPrintScope] = useState<'all' | 'current' | 'custom'>('all');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    pages.forEach((p) => {
      initial[p.id] = true;
    });
    return initial;
  });

  if (!isOpen) return null;

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  const handleTogglePage = (pageId: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [pageId]: !prev[pageId],
    }));
  };

  const handleSelectAll = () => {
    const next: Record<string, boolean> = {};
    pages.forEach((p) => {
      next[p.id] = true;
    });
    setSelectedIds(next);
  };

  const handleDeselectAll = () => {
    const next: Record<string, boolean> = {};
    pages.forEach((p) => {
      next[p.id] = false;
    });
    setSelectedIds(next);
  };

  const getResolvedPageIds = (): string[] => {
    if (printScope === 'all') {
      return pages.map((p) => p.id);
    }
    if (printScope === 'current') {
      return activePage ? [activePage.id] : [];
    }
    return pages.filter((p) => selectedIds[p.id]).map((p) => p.id);
  };

  const resolvedPageIds = getResolvedPageIds();
  const pageCountToPrint = resolvedPageIds.length;

  const handlePrint = () => {
    if (pageCountToPrint === 0) return;
    onConfirmPrint(resolvedPageIds);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 no-print"
      onClick={onClose}
    >
      <div
        className="bg-[#16181d] border border-neutral-700/80 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-[#1a1d24]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Export to PDF / Print</h2>
              <p className="text-xs text-neutral-400">
                {scenarioTitle} &bull; {pages.length} {pages.length === 1 ? 'page' : 'pages'} total
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Select Pages to Print
            </label>

            <div className="space-y-2">
              {/* Option 1: All Pages */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  printScope === 'all'
                    ? 'bg-indigo-950/30 border-indigo-500/80 text-white ring-1 ring-indigo-500/50'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="printScope"
                  value="all"
                  checked={printScope === 'all'}
                  onChange={() => setPrintScope('all')}
                  className="mt-0.5 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">
                      All Pages ({pages.length} {pages.length === 1 ? 'page' : 'pages'})
                    </span>
                    {pages.length > 1 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Export all pages in this scenario spread across separate printable sheets.
                  </p>
                </div>
              </label>

              {/* Option 2: Current Page Only */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  printScope === 'current'
                    ? 'bg-indigo-950/30 border-indigo-500/80 text-white ring-1 ring-indigo-500/50'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="printScope"
                  value="current"
                  checked={printScope === 'current'}
                  onChange={() => setPrintScope('current')}
                  className="mt-0.5 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold">
                    Current Page Only (Page {activePage?.pageNumber}: {activePage?.title || 'Untitled'})
                  </span>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Export only the page currently displayed on the workspace canvas.
                  </p>
                </div>
              </label>

              {/* Option 3: Custom Page Selection */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  printScope === 'custom'
                    ? 'bg-indigo-950/30 border-indigo-500/80 text-white ring-1 ring-indigo-500/50'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="printScope"
                  value="custom"
                  checked={printScope === 'custom'}
                  onChange={() => setPrintScope('custom')}
                  className="mt-0.5 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold">Custom Page Selection</span>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Pick and choose specific pages to include in the exported document.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Custom Page Checklist (Shown when custom is selected) */}
          {printScope === 'custom' && (
            <div className="pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between pb-2">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase">
                  Select Pages ({resolvedPageIds.length} of {pages.length} selected)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-neutral-600">&bull;</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[11px] text-neutral-400 hover:text-neutral-300 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {pages.map((p) => {
                  const isChecked = Boolean(selectedIds[p.id]);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleTogglePage(p.id)}
                      className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-neutral-800/90 border-neutral-700 text-neutral-100'
                          : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'border-neutral-600 bg-neutral-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium truncate">
                          Page {p.pageNumber}: {p.title || 'Untitled'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-[10px] opacity-75">
                        <span className="capitalize">{p.themeSkin}</span>
                        <span>&bull;</span>
                        <span>{p.columnCount} Col</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Print Recommendations Note */}
          <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-lg flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-neutral-300 space-y-1 leading-relaxed">
              <p className="font-semibold text-neutral-200">Recommended Browser Print Settings:</p>
              <ul className="list-disc list-inside text-neutral-400 space-y-0.5">
                <li>
                  <strong className="text-neutral-300">Destination:</strong> Save as PDF
                </li>
                <li>
                  <strong className="text-neutral-300">Pages:</strong> All (each page breaks cleanly to a new sheet)
                </li>
                <li>
                  <strong className="text-neutral-300">Background graphics:</strong> Checked (preserves parchment &amp; theme styling)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-800 bg-[#1a1d24]">
          <div className="text-xs text-neutral-400">
            {pageCountToPrint === 0 ? (
              <span className="text-red-400">Select at least 1 page to export</span>
            ) : (
              <span>
                Exporting <strong className="text-white">{pageCountToPrint}</strong> {pageCountToPrint === 1 ? 'page' : 'pages'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pageCountToPrint === 0}
              onClick={handlePrint}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-semibold shadow transition-all cursor-pointer ${
                pageCountToPrint === 0
                  ? 'bg-neutral-700 opacity-50 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print to PDF ({pageCountToPrint})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
