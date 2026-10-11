'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmDeletePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pageNumber: number;
  pageTitle?: string;
  elementCount: number;
}

export const ConfirmDeletePageModal: React.FC<ConfirmDeletePageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pageNumber,
  pageTitle,
  elementCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#16181d] border border-neutral-700/80 rounded-xl shadow-2xl p-6 text-neutral-100 space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-red-950/60 border border-red-700/40 text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="confirm-delete-title" className="text-base font-bold text-neutral-100">
                Delete Page {pageNumber}?
              </h2>
              <p className="text-xs text-neutral-400 truncate max-w-[260px]">
                {pageTitle || 'Untitled Page'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 space-y-2">
          <p>
            Are you sure you want to delete <span className="font-semibold text-white">Page {pageNumber}</span>?
          </p>
          {elementCount > 0 ? (
            <p className="text-neutral-400">
              This page has <span className="font-semibold text-amber-300">{elementCount}</span> element placement{elementCount === 1 ? '' : 's'}. Removing the page removes its layout placements, but all <span className="text-emerald-300 font-medium">canonical entities</span> will safely remain in your Scenario Library.
            </p>
          ) : (
            <p className="text-neutral-400">
              This page is currently empty.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
