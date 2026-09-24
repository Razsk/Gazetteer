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
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
              Selected Target Entities ({selectedEntities.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedEntities.map((e) => (
                <span
                  key={e.id}
                  className="px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-700/50 text-indigo-200 text-xs flex items-center gap-1.5"
                >
                  <span className="opacity-70 text-[10px] uppercase font-mono">{e.entityType}</span>
                  <span className="font-medium">{e.name}</span>
                </span>
              ))}
              {selectedEntities.length === 0 && (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> No entities selected. Check some elements on the canvas first!
                </p>
              )}
            </div>
          </div>

          {/* Staged Diff Review View (If AI replied) */}
          {stagedResponse ? (
            <div className="space-y-4">
              <div className="bg-indigo-950/40 border border-indigo-700/40 rounded-lg p-4">
                <h3 className="text-sm font-bold text-indigo-300 mb-1">
                  AI Proposed Changes & Reasoning
                </h3>
                <p className="text-xs text-indigo-100/90 leading-relaxed italic">
                  "{stagedResponse.reasoningSummary || 'No summary provided.'}"
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
                  3. Paste AI's JSON Response Below
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
