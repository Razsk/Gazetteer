'use client';

import React, { useState, useId } from 'react';
import { useScenarioStore } from '@/store/scenarioStore';
import {
  formatElementGenerationPrompt,
  parseElementGenerationResponse,
  getSampleGenerationResponse,
  AiGenerateElementsResponse,
  GeneratedEntity,
} from '@/ai/aiBridge';
import { ThemeSkin, getEntityIcon } from './themeSkin';
import {
  Sparkles,
  ClipboardCopy,
  ClipboardPaste,
  Check,
  AlertCircle,
  X,
  FilePlus2,
  Layers,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Columns2,
  Palette,
  CheckSquare,
  Square,
  Wand2,
  RefreshCw,
} from 'lucide-react';

interface AiGeneratePageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PROMPTS = [
  {
    label: 'Boss & Dungeon Chamber',
    prompt:
      'Generate a dramatic dungeon chamber with a themed Boss Enemy (with lethal tactics and actions), an environmental Hazard Trap, and a guarded Treasure Cache.',
  },
  {
    label: 'Wilderness Ambush & Lore',
    prompt:
      'Generate an overgrown outdoor Location, a faction of stealthy ambushers (Enemy), an NPC survivor with crucial advice, and a 4-entry Rumor Table about the territory.',
  },
  {
    label: 'Tavern & Investigation Hub',
    prompt:
      'Generate an intriguing social hub: an eccentric NPC bartender, a suspicious rival traveler, a 4-entry Rumor List with truth/deception checks, and a clue Item.',
  },
  {
    label: 'Deadly Trap Gauntlet',
    prompt:
      'Generate an ancient traversal Area featuring two mechanical/magical Traps (with DC and disarm conditions), plus an ancient relic Item rewarding careful explorers.',
  },
];

export const AiGeneratePageModal: React.FC<AiGeneratePageModalProps> = ({
  isOpen,
  onClose,
}) => {
  const store = useScenarioStore();
  const searchInputId = useId();

  // Prompt configuration state
  const [instructions, setInstructions] = useState('');
  const [referencedEntityIds, setReferencedEntityIds] = useState<string[]>([]);
  const [customPageTitle, setCustomPageTitle] = useState('');
  const [columnCount, setColumnCount] = useState<1 | 2>(2);
  const [themeSkin, setThemeSkin] = useState<ThemeSkin>(
    store.currentScenario?.defaultThemeSkin || 'parchment'
  );

  // Clipboard bridge state
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [rawAiResponse, setRawAiResponse] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

  // Staged review state
  const [stagedResponse, setStagedResponse] = useState<AiGenerateElementsResponse | null>(null);
  const [stagedPageTitle, setStagedPageTitle] = useState('');
  const [selectedElements, setSelectedElements] = useState<Record<number, boolean>>({});
  const [elementSpans, setElementSpans] = useState<Record<number, 1 | 2>>({});

  if (!isOpen) return null;

  const scenario = store.currentScenario;
  const context = {
    ruleset: scenario?.ruleset || 'D&D 5e',
    theme: scenario?.theme || 'Grimdark Swamp',
    targetPartyLevel: scenario?.targetPartyLevel || 3,
  };

  // Build referenced context list
  const referencedEntities = referencedEntityIds
    .map((id) => store.entities[id])
    .filter(Boolean)
    .map((e) => ({
      name: e.name,
      entityType: e.entityType,
      attributes: e.attributes,
    }));

  const allScenarioEntities = Object.values(store.entities);

  const toggleReferenceEntity = (entityId: string) => {
    setReferencedEntityIds((prev) =>
      prev.includes(entityId) ? prev.filter((id) => id !== entityId) : [...prev, entityId]
    );
  };

  const handleSelectActivePageReferences = () => {
    if (!store.activePageId) return;
    const placements = store.placements[store.activePageId] || [];
    const ids = Array.from(new Set(placements.map((p) => p.entityId)));
    setReferencedEntityIds(ids);
  };

  const handleSelectAllReferences = () => {
    setReferencedEntityIds(Object.keys(store.entities));
  };

  const handleClearReferences = () => {
    setReferencedEntityIds([]);
  };

  const getFullPromptText = () => {
    return formatElementGenerationPrompt(
      context,
      instructions.trim() || 'Create a balanced scenario encounter area with themed elements.',
      referencedEntities,
      {
        scenarioTitle: scenario?.title,
        suggestedPageTitle: customPageTitle.trim() || undefined,
      }
    );
  };

  const handleCopyPrompt = () => {
    if (!instructions.trim()) {
      setParseError('Please write instructions or select a preset before copying the prompt.');
      return;
    }
    setParseError(null);
    const fullText = getFullPromptText();
    navigator.clipboard.writeText(fullText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawAiResponse(text);
        setParseError(null);
      }
    } catch {
      setParseError('Unable to read clipboard directly. Please use Ctrl+V / Cmd+V in the box.');
    }
  };

  const handleLoadSample = () => {
    setParseError(null);
    const sample = getSampleGenerationResponse(context, referencedEntities);
    setStagedResponse(sample);
    setStagedPageTitle(customPageTitle.trim() || sample.pageTitle);

    const initialSelection: Record<number, boolean> = {};
    const initialSpans: Record<number, 1 | 2> = {};
    sample.newEntities.forEach((ent, idx) => {
      initialSelection[idx] = true;
      initialSpans[idx] = ent.columnSpan || (['adventure_site', 'region', 'area'].includes(ent.entityType) ? 2 : 1);
    });
    setSelectedElements(initialSelection);
    setElementSpans(initialSpans);
  };

  const handleParseClipboard = () => {
    if (!rawAiResponse.trim()) {
      setParseError('Please paste the AI JSON response before parsing.');
      return;
    }
    setParseError(null);
    const result = parseElementGenerationResponse(rawAiResponse);
    if (!result.success) {
      setParseError(result.error || 'Failed to parse AI JSON response.');
      return;
    }

    setStagedResponse(result.data);
    setStagedPageTitle(customPageTitle.trim() || result.data.pageTitle);

    const initialSelection: Record<number, boolean> = {};
    const initialSpans: Record<number, 1 | 2> = {};
    result.data.newEntities.forEach((ent, idx) => {
      initialSelection[idx] = true;
      initialSpans[idx] = ent.columnSpan || (['adventure_site', 'region', 'area'].includes(ent.entityType) ? 2 : 1);
    });
    setSelectedElements(initialSelection);
    setElementSpans(initialSpans);
  };

  const handleCommitCreation = () => {
    if (!stagedResponse) return;

    const acceptedEntities: Array<{
      name: string;
      entityType: GeneratedEntity['entityType'];
      attributes: Record<string, unknown>;
      columnSpan?: 1 | 2;
    }> = [];

    stagedResponse.newEntities.forEach((ent, idx) => {
      if (selectedElements[idx] !== false) {
        acceptedEntities.push({
          name: ent.name,
          entityType: ent.entityType,
          attributes: ent.attributes,
          columnSpan: elementSpans[idx] || ent.columnSpan || 1,
        });
      }
    });

    if (acceptedEntities.length === 0) {
      setParseError('Please select at least one element to create on the new page.');
      return;
    }

    const finalTitle =
      stagedPageTitle.trim() ||
      stagedResponse.pageTitle.trim() ||
      `Page ${store.pages.length + 1}`;

    store.createPageWithElements(
      {
        title: finalTitle,
        columnCount,
        themeSkin,
      },
      acceptedEntities
    );

    // Reset and close
    setStagedResponse(null);
    setRawAiResponse('');
    setInstructions('');
    onClose();
  };

  const acceptedCount = stagedResponse
    ? stagedResponse.newEntities.filter((_, idx) => selectedElements[idx] !== false).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-neutral-700 text-neutral-100 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#1e2028]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>AI Page & Element Generator</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/40">
                  New Page Mode
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Ask the LLM to generate and populate brand-new elements on a new scenario page using referenced lore.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {stagedResponse ? (
            /* STAGED REVIEW VIEW */
            <div className="space-y-5">
              {/* New Page Configuration Overview */}
              <div className="bg-indigo-950/30 border border-indigo-700/40 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <FilePlus2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Destination: Brand New Page
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>Layout: {columnCount} Columns</span>
                    <span>•</span>
                    <span className="capitalize">Skin: {themeSkin}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      New Page Title
                    </label>
                    <input
                      type="text"
                      value={stagedPageTitle}
                      onChange={(e) => setStagedPageTitle(e.target.value)}
                      placeholder="Title for the new page..."
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      AI Reasoning & Lore Connection
                    </span>
                    <p className="text-xs text-neutral-300/90 italic line-clamp-2">
                      &ldquo;{stagedResponse.reasoningSummary || 'Generated elements tailored to scenario context.'}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Elements Review Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                    <span>Generated Elements ({acceptedCount} of {stagedResponse.newEntities.length} selected)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const all: Record<number, boolean> = {};
                        stagedResponse.newEntities.forEach((_, i) => (all[i] = true));
                        setSelectedElements(all);
                      }}
                      className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-neutral-600">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedElements({})}
                      className="text-[11px] text-neutral-400 hover:text-white cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {stagedResponse.newEntities.map((entity, idx) => {
                    const isSelected = selectedElements[idx] !== false;
                    const span = elementSpans[idx] || 1;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg border transition-all text-xs ${
                          isSelected
                            ? 'bg-neutral-900/90 border-neutral-700'
                            : 'bg-neutral-900/30 border-neutral-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedElements((prev) => ({
                                  ...prev,
                                  [idx]: !isSelected,
                                }))
                              }
                              className="mt-0.5 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                              title={isSelected ? 'Exclude this element' : 'Include this element'}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-neutral-500" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="opacity-80">
                                  {getEntityIcon(entity.entityType, 'w-3.5 h-3.5')}
                                </span>
                                <span className="font-bold text-neutral-200">{entity.name}</span>
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                                  {entity.entityType}
                                </span>
                              </div>

                              {/* Attributes Highlight View */}
                              <div className="mt-1 text-[11px] text-neutral-400 space-y-1">
                                {entity.attributes.challengeRating && (
                                  <div>
                                    <strong className="text-neutral-300">CR:</strong>{' '}
                                    {entity.attributes.challengeRating} •{' '}
                                    <strong className="text-neutral-300">HP:</strong>{' '}
                                    {entity.attributes.hitPoints} •{' '}
                                    <strong className="text-neutral-300">AC:</strong>{' '}
                                    {entity.attributes.armorClass}
                                  </div>
                                )}
                                {entity.attributes.trigger && (
                                  <div>
                                    <strong className="text-neutral-300">Trigger:</strong>{' '}
                                    {entity.attributes.trigger} (Detect DC {entity.attributes.detectionDc}, Disarm DC {entity.attributes.disarmDc})
                                  </div>
                                )}
                                {entity.attributes.value && (
                                  <div>
                                    <strong className="text-neutral-300">Value:</strong>{' '}
                                    {entity.attributes.value} •{' '}
                                    <strong className="text-neutral-300">Rarity:</strong>{' '}
                                    {entity.attributes.rarity}
                                  </div>
                                )}
                                {entity.attributes.lore && (
                                  <p className="italic text-neutral-400 line-clamp-2">
                                    {entity.attributes.lore}
                                  </p>
                                )}
                                {entity.attributes.sensoryBox && (
                                  <p className="italic text-neutral-400 line-clamp-2">
                                    {entity.attributes.sensoryBox}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Column Span Selector */}
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-neutral-500 uppercase mr-1">Span:</span>
                            <button
                              type="button"
                              onClick={() =>
                                setElementSpans((prev) => ({
                                  ...prev,
                                  [idx]: 1,
                                }))
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                                span === 1
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              1 Col
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setElementSpans((prev) => ({
                                  ...prev,
                                  [idx]: 2,
                                }))
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                                span === 2
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              2 Col
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* STEP 1: CONTEXT & REQUEST CONFIGURATION */
            <div className="space-y-6">
              {/* Context Baseline Card */}
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      Active Scenario Context
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-[11px]">
                      {context.ruleset}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px]">
                      Lvl {context.targetPartyLevel}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px] truncate max-w-[140px]">
                      {context.theme}
                    </span>
                  </div>
                </div>

                {/* Referenced Elements Picker */}
                <div className="pt-2 border-t border-neutral-800/80 mt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-neutral-400">
                        Referenced Context Elements ({referencedEntities.length})
                      </span>
                      <span
                        className="text-neutral-500 hover:text-neutral-300 cursor-help"
                        title="Selected elements will be provided in the prompt as background lore so the LLM connects the new elements seamlessly."
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {store.activePageId && (
                        <button
                          type="button"
                          onClick={handleSelectActivePageReferences}
                          className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                          title="Reference all elements on the active page"
                        >
                          Add Active Page
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSelectAllReferences}
                        className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                        title="Reference all elements in the scenario"
                      >
                        Add All
                      </button>
                      {referencedEntityIds.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearReferences}
                          className="text-[11px] px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-800/50 text-red-300 transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected Reference Tags */}
                  <div className="flex flex-wrap gap-1.5 min-h-[30px] items-center">
                    {referencedEntityIds.map((id) => {
                      const ent = store.entities[id];
                      if (!ent) return null;
                      return (
                        <span
                          key={id}
                          className="px-2 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-700/50 text-indigo-200 text-xs flex items-center gap-1.5"
                        >
                          <span className="opacity-70 text-[9px] uppercase font-mono">
                            {ent.entityType}
                          </span>
                          <span className="font-medium truncate max-w-[140px]">{ent.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleReferenceEntity(id)}
                            className="text-indigo-400 hover:text-red-400 p-0.5 rounded cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                    {referencedEntityIds.length === 0 && (
                      <p className="text-xs text-neutral-500 italic">
                        No specific elements referenced yet. Choose existing elements below to weave them into the new page!
                      </p>
                    )}
                  </div>

                  {/* Toggle Search & Library Elements Picker */}
                  {allScenarioEntities.length > 0 && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() => setShowEntityPicker(!showEntityPicker)}
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        {showEntityPicker ? '▲ Hide Library Selector' : '▼ Pick elements from scenario library to reference'}
                      </button>

                      {showEntityPicker && (
                        <div className="mt-2 p-2.5 bg-neutral-950/80 rounded-lg border border-neutral-800 space-y-2">
                          <input
                            id={searchInputId}
                            type="text"
                            value={filterSearch}
                            onChange={(e) => setFilterSearch(e.target.value)}
                            placeholder="Filter scenario elements..."
                            className="w-full px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                          />
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                            {allScenarioEntities
                              .filter((ent) =>
                                !filterSearch ||
                                ent.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
                                ent.entityType.toLowerCase().includes(filterSearch.toLowerCase())
                              )
                              .map((ent) => {
                                const isChecked = referencedEntityIds.includes(ent.id);
                                return (
                                  <label
                                    key={ent.id}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs cursor-pointer select-none transition-colors ${
                                      isChecked
                                        ? 'bg-indigo-950/60 border-indigo-600 text-white'
                                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleReferenceEntity(ent.id)}
                                      className="rounded border-neutral-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                    />
                                    <span className="opacity-70">{getEntityIcon(ent.entityType, 'w-3 h-3')}</span>
                                    <span className="truncate">{ent.name}</span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Destination New Page Settings */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                  New Page Setup
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                      Suggested Page Title (optional)
                    </label>
                    <input
                      type="text"
                      value={customPageTitle}
                      onChange={(e) => setCustomPageTitle(e.target.value)}
                      placeholder="e.g. Flooded Sewers & Rat Den"
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                      Page Layout
                    </label>
                    <select
                      value={columnCount}
                      onChange={(e) => setColumnCount(Number(e.target.value) as 1 | 2)}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value={2}>2 Columns (Standard RPG)</option>
                      <option value={1}>1 Column (Full Width)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                      Visual Theme Skin
                    </label>
                    <select
                      value={themeSkin}
                      onChange={(e) => setThemeSkin(e.target.value as ThemeSkin)}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="parchment">Parchment Fantasy</option>
                      <option value="gothic">Gothic Horror</option>
                      <option value="cyberpunk">Cyberpunk HUD</option>
                      <option value="minimalist">Clean Minimalist</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* User Instructions Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Prompt Instructions for the LLM
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    Be specific about encounter level, creature types, traps, and story hooks.
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Create a flooded sewer system beneath the crypt ruled by a Wererat boss. Add a diseased water pipe trap, a smuggler's rowboat item, and a rumor table about an escape tunnel..."
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />

                {/* Preset Prompt Inspiration Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-neutral-500 font-semibold mr-1">
                    Quick Presets:
                  </span>
                  {PRESET_PROMPTS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setInstructions(preset.prompt)}
                      className="px-2 py-1 rounded bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 text-[11px] text-neutral-300 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Copy Prompt Section */}
              <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                      <span>Copy Structured Request to Clipboard</span>
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Includes scenario context, referenced lore, schema blueprints, and formatting rules for your AI chat (ChatGPT, Claude, Gemini, Ollama).
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPromptPreview(!showPromptPreview)}
                      className="text-xs text-neutral-400 hover:text-white px-2.5 py-1.5 rounded border border-neutral-800 hover:border-neutral-700 cursor-pointer"
                    >
                      {showPromptPreview ? 'Hide Prompt' : 'Inspect Prompt'}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        copiedPrompt
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                      }`}
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-4 h-4" /> Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="w-4 h-4" /> Copy Full Request
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {showPromptPreview && (
                  <div className="pt-2 border-t border-neutral-800">
                    <pre className="p-3 bg-black/60 rounded-lg text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-48 border border-neutral-800 whitespace-pre-wrap">
                      {getFullPromptText()}
                    </pre>
                  </div>
                )}
              </div>

              {/* Step 3: Paste and Parse AI Response */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Paste LLM JSON Response
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" /> Paste from Clipboard
                    </button>
                    <span className="text-neutral-600">•</span>
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
                      title="Load high-quality sample encounter elements for instant testing"
                    >
                      <Wand2 className="w-3.5 h-3.5" /> ⚡ Try Sample Encounter
                    </button>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={rawAiResponse}
                  onChange={(e) => setRawAiResponse(e.target.value)}
                  placeholder="Paste the raw text or markdown code fence from your LLM chat here..."
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-mono text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />

                {parseError && (
                  <div className="p-3 bg-red-950/60 border border-red-700/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-[#1e2028] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (stagedResponse) {
                setStagedResponse(null);
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            {stagedResponse ? '← Back to Request' : 'Cancel'}
          </button>

          {stagedResponse ? (
            <button
              type="button"
              onClick={handleCommitCreation}
              disabled={acceptedCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-lg transition-all cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Create Page & Add {acceptedCount} Elements</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test with Sample</span>
              </button>
              <button
                type="button"
                onClick={handleParseClipboard}
                disabled={!rawAiResponse.trim()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md transition-all cursor-pointer"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Parse & Review Elements</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
