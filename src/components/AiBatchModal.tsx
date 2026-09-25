'use client';

import React, { useState } from 'react';
import { useScenarioStore } from '@/store/scenarioStore';
import {
  formatClipboardPrompt,
  parseClipboardResponse,
  AiBatchEditResponse,
} from '@/ai/aiBridge';
import {
  Sparkles,
  ClipboardCopy,
  ClipboardPaste,
  Check,
  AlertCircle,
  X,
  ArrowRight,
  Trash2,
} from 'lucide-react';

interface AiBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiBatchModal: React.FC<AiBatchModalProps> = ({ isOpen, onClose }) => {
  const store = useScenarioStore();
  const [instructions, setInstructions] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [rawAiResponse, setRawAiResponse] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [stagedResponse, setStagedResponse] = useState<AiBatchEditResponse | null>(null);
  const [showEntityPicker, setShowEntityPicker] = useState(false);

  if (!isOpen) return null;

  // Selected entities details
  const selectedEntities = store.selectedEntityIds
    .map((id) => store.entities[id])
    .filter(Boolean);

  const context = {
    ruleset: store.currentScenario?.ruleset || 'D&D 5e',
    theme: store.currentScenario?.theme || 'Grimdark Swamp',
    targetPartyLevel: store.currentScenario?.targetPartyLevel || 4,
  };

  const targets = selectedEntities.map((e) => ({
    entityId: e.id,
    entityType: e.entityType,
    name: e.name,
    attributes: e.attributes,
  }));

  const handleCopyPrompt = () => {
    if (!instructions.trim()) {
      setParseError('Please enter user instructions before generating the prompt.');
      return;
    }
    setParseError(null);
    const fullPrompt = formatClipboardPrompt(context, instructions, targets);
    navigator.clipboard.writeText(fullPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleParseClipboard = () => {
    setParseError(null);
    const result = parseClipboardResponse(rawAiResponse);
    if (!result.success) {
      setParseError(result.error || 'Failed to parse AI JSON response.');
      return;
    }
    setStagedResponse(result.data);
  };

  const handleApplyStagedPatches = () => {
    if (!stagedResponse) return;

    for (const patch of stagedResponse.updatedEntities) {
      const existing = store.entities[patch.entityId];
      if (!existing) continue;

      const updatedName = patch.attributes.name || existing.name;
      store.updateEntity(patch.entityId, {
        name: updatedName,
        attributes: {
          ...existing.attributes,
          ...patch.attributes,
        },
      });
    }

    // Reset and close
    setStagedResponse(null);
    setRawAiResponse('');
    setInstructions('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-neutral-700 text-neutral-100 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#1e2028]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">AI Batch Editing & Clipboard Bridge</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Target Summary */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Selected Target Entities ({selectedEntities.length})
                </span>
                {selectedEntities.length > 0 && (
                  <button
                    onClick={() => store.clearSelection()}
                    className="text-[11px] px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-700/50 text-red-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    title="Deselect all entities"
                  >
                    <Trash2 className="w-3 h-3" /> Clear All / Deselect All
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {store.activePageId && (
                  <button
                    onClick={() => store.selectAllOnPage(store.activePageId!)}
                    className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                    title="Select all entities on the active page"
                  >
                    Select Page
                  </button>
                )}
                <button
                  onClick={() => store.selectAllEntities()}
                  className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                  title="Select all entities in scenario"
                >
                  Select All
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedEntities.map((e) => (
                <span
                  key={e.id}
                  className="px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-700/50 text-indigo-200 text-xs flex items-center gap-1.5"
                >
                  <span className="opacity-70 text-[10px] uppercase font-mono">{e.entityType}</span>
                  <span className="font-medium">{e.name}</span>
                  <button
                    onClick={() => store.toggleEntitySelection(e.id)}
                    className="ml-1 text-indigo-400 hover:text-red-400 p-0.5 rounded hover:bg-red-500/20 cursor-pointer"
                    title={`Deselect ${e.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedEntities.length === 0 && (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> No entities selected. Check elements below or on the canvas!
                </p>
              )}
            </div>

            {/* Expandable Entity Picker */}
            {Object.keys(store.entities).length > 0 && (
              <div className="pt-2 border-t border-neutral-800/80 mt-2.5">
                <button
                  type="button"
                  onClick={() => setShowEntityPicker(!showEntityPicker)}
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  {showEntityPicker ? '▲ Hide Entity Picker' : '▼ Add/toggle more entities from Scenario Library'}
                </button>
                {showEntityPicker && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {Object.values(store.entities).map((ent) => {
                      const isChecked = store.selectedEntityIds.includes(ent.id);
                      return (
                        <label
                          key={ent.id}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs cursor-pointer select-none transition-colors ${
                            isChecked
                              ? 'bg-indigo-950/50 border-indigo-600 text-white'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => store.toggleEntitySelection(ent.id)}
                            className="rounded border-neutral-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="truncate">{ent.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Staged Diff Review View (If AI replied) */}
          {stagedResponse ? (
            <div className="space-y-4">
              <div className="bg-indigo-950/40 border border-indigo-700/40 rounded-lg p-4">
                <h3 className="text-sm font-bold text-indigo-300 mb-1">
                  AI Proposed Changes & Reasoning
                </h3>
                <p className="text-xs text-indigo-100/90 leading-relaxed italic">
                  &ldquo;{stagedResponse.reasoningSummary || 'No summary provided.'}&rdquo;
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Proposed Staged Diffs
                </span>
                {stagedResponse.updatedEntities.map((patch) => {
                  const existing = store.entities[patch.entityId];
                  return (
                    <div
                      key={patch.entityId}
                      className="border border-neutral-800 rounded-lg p-3 bg-neutral-900/60 text-xs grid grid-cols-2 gap-4"
                    >
                      {/* Before */}
                      <div>
                        <div className="font-semibold text-red-400 mb-1">
                          Current State: {existing?.name}
                        </div>
                        <pre className="bg-black/40 p-2 rounded text-[11px] text-neutral-400 font-mono overflow-x-auto max-h-36">
                          {JSON.stringify(existing?.attributes, null, 2)}
                        </pre>
                      </div>

                      {/* After */}
                      <div>
                        <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                          <ArrowRight className="w-3.5 h-3.5" /> Proposed Patches
                        </div>
                        <pre className="bg-black/40 p-2 rounded text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-36">
                          {JSON.stringify(patch.attributes, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Workflow Step 1: Prompt & Instructions */
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  1. What would you like the AI to change?
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g., Make the trap venomous with DC 14 constitution save, and link the herbalist's motivation to searching for an antidote."
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Step 2: Copy Prompt */}
              <div className="flex items-center justify-between bg-neutral-900/90 border border-neutral-800 p-4 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-200">
                    2. Copy Prompt & Context to Clipboard
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Paste this into ChatGPT, Claude, Gemini, or local Ollama.
                  </p>
                </div>
                <button
                  onClick={handleCopyPrompt}
                  disabled={selectedEntities.length === 0}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    copiedPrompt
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40'
                  }`}
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-4 h-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="w-4 h-4" /> Copy Full Prompt
                    </>
                  )}
                </button>
              </div>

              {/* Step 3: Paste and Parse */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  3. Paste AI&apos;s JSON Response Below
                </label>
                <textarea
                  rows={4}
                  value={rawAiResponse}
                  onChange={(e) => setRawAiResponse(e.target.value)}
                  placeholder="Paste the raw text or markdown code fence from your LLM chat here..."
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-mono text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {parseError && (
                <div className="p-3 bg-red-950/60 border border-red-700/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-[#1e2028] flex items-center justify-between">
          <button
            onClick={() => {
              if (stagedResponse) {
                setStagedResponse(null);
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white"
          >
            {stagedResponse ? 'Back to Prompt' : 'Cancel'}
          </button>

          {stagedResponse ? (
            <button
              onClick={handleApplyStagedPatches}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
            >
              <Check className="w-4 h-4" /> Accept & Apply All Patches
            </button>
          ) : (
            <button
              onClick={handleParseClipboard}
              disabled={!rawAiResponse.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40"
            >
              <ClipboardPaste className="w-4 h-4" /> Parse & Review Diff
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
