'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useScenarioStore } from '@/store/scenarioStore';
import { findMatches, SearchMatch, SearchOptions } from '@/domain/searchReplace';
import { getEntityIcon } from './themeSkin';
import {
  Replace,
  Search,
  X,
  Check,
  CheckSquare,
  Square,
  Layers,
  FileText,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface SearchReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchReplaceModal: React.FC<SearchReplaceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const store = useScenarioStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [scope, setScope] = useState<'all' | string>('all');
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setNotification(null);
    }
  }, [isOpen]);

  // Compute matches
  const searchOptions: SearchOptions = useMemo(
    () => ({
      query,
      replacement,
      scope,
      matchCase,
      matchWholeWord,
      useRegex,
    }),
    [query, replacement, scope, matchCase, matchWholeWord, useRegex]
  );

  const matches: SearchMatch[] = useMemo(() => {
    if (!isOpen || !query.trim()) return [];
    return findMatches(
      {
        currentScenario: store.currentScenario,
        pages: store.pages,
        entities: store.entities,
        placements: store.placements,
      },
      searchOptions
    );
  }, [
    isOpen,
    query,
    searchOptions,
    store.currentScenario,
    store.pages,
    store.entities,
    store.placements,
  ]);

  // Auto-select all matches when matches list changes
  useEffect(() => {
    setSelectedMatchIds(new Set(matches.map((m) => m.id)));
  }, [matches]);

  if (!isOpen) return null;

  const handleToggleSelectMatch = (id: string) => {
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedMatchIds(new Set(matches.map((m) => m.id)));
  };

  const handleDeselectAll = () => {
    setSelectedMatchIds(new Set());
  };

  const handleReplaceSelected = () => {
    if (selectedMatchIds.size === 0) return;

    const idsToReplace = Array.from(selectedMatchIds);
    const result = store.searchAndReplace(searchOptions, idsToReplace);

    setNotification({
      text: `Replaced ${result.replacementCount} occurrence(s) across ${result.entitiesUpdatedCount} element(s) on ${result.pagesUpdatedCount} page(s).`,
      type: 'success',
    });
  };

  const handleReplaceAll = () => {
    if (matches.length === 0) return;

    const result = store.searchAndReplace(searchOptions);

    setNotification({
      text: `Replaced ${result.replacementCount} occurrence(s) across all pages!`,
      type: 'success',
    });
  };

  const handleReplaceSingle = (match: SearchMatch) => {
    const result = store.searchAndReplace(searchOptions, [match.id]);

    setNotification({
      text: `Replaced 1 occurrence in ${match.entityName || match.fieldLabel}.`,
      type: 'success',
    });
  };

  const handleGoToPage = (pageId?: string) => {
    if (pageId) {
      store.setActivePage(pageId);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 no-print"
      onClick={onClose}
    >
      <div
        className="bg-[#16181d] border border-neutral-700/80 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col text-neutral-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search and Replace"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-[#1a1d24]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Replace className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100">
                  Search & Replace
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 font-semibold">
                  {scope === 'all' ? 'All Pages' : 'Current Page'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Find and replace text across page titles, scenario metadata, and element attributes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs & Options Section */}
        <div className="p-5 border-b border-neutral-800 space-y-3.5 bg-[#131519]">
          {/* Find and Replace Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Find
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setNotification(null);
                  }}
                  placeholder="Search across all pages..."
                  className="w-full bg-[#1e2128] border border-neutral-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-neutral-300"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Replace With
              </label>
              <div className="relative">
                <Replace className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={replacement}
                  onChange={(e) => {
                    setReplacement(e.target.value);
                    setNotification(null);
                  }}
                  placeholder="Replacement text..."
                  className="w-full bg-[#1e2128] border border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Scope and Match Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Scope Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-neutral-500" />
                Scope:
              </span>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="bg-[#1e2128] border border-neutral-700 rounded-md px-2.5 py-1 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">
                  All Pages ({store.pages.length})
                </option>
                {store.pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    Page {p.pageNumber}: {p.title || `Page ${p.pageNumber}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Match Option Toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMatchCase(!matchCase)}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                  matchCase
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                    : 'bg-[#1e2128] text-neutral-400 border-neutral-700 hover:text-neutral-200'
                }`}
                title="Match Case (Case Sensitive)"
              >
                Match Case (Aa)
              </button>

              <button
                type="button"
                onClick={() => setMatchWholeWord(!matchWholeWord)}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                  matchWholeWord
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                    : 'bg-[#1e2128] text-neutral-400 border-neutral-700 hover:text-neutral-200'
                }`}
                title="Match Whole Word"
              >
                Whole Word
              </button>

              <button
                type="button"
                onClick={() => setUseRegex(!useRegex)}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                  useRegex
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                    : 'bg-[#1e2128] text-neutral-400 border-neutral-700 hover:text-neutral-200'
                }`}
                title="Regular Expression (e.g. \b[0-9]+d[0-9]+\b)"
              >
                Regex (.*)
              </button>
            </div>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center justify-between border-b ${
              notification.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                : 'bg-red-950/40 text-red-300 border-red-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-neutral-400 hover:text-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Results Header / Sub-bar */}
        <div className="px-5 py-2.5 bg-[#171a20] border-b border-neutral-800 flex items-center justify-between text-xs">
          <div className="text-neutral-400 font-medium">
            {query.trim() ? (
              <span>
                Found <strong className="text-neutral-200">{matches.length}</strong> match
                {matches.length === 1 ? '' : 'es'}
                {scope === 'all' ? ' across all pages' : ' on this page'}
              </span>
            ) : (
              <span>Type in the search field above to find text.</span>
            )}
          </div>

          {matches.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleSelectAll}
                className="text-neutral-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Select All
              </button>
              <span className="text-neutral-600">|</span>
              <button
                onClick={handleDeselectAll}
                className="text-neutral-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          )}
        </div>

        {/* Matches Scrollable View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#0f1115]">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              <Search className="w-8 h-8 mx-auto text-neutral-600 mb-2 opacity-50" />
              Enter search text to find occurrences across scenario pages.
            </div>
          ) : matches.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-500/50 mb-2" />
              No matches found for &quot;{query}&quot; {scope === 'all' ? 'across all pages' : 'in selected scope'}.
            </div>
          ) : (
            matches.map((match) => {
              const isSelected = selectedMatchIds.has(match.id);
              const entity = match.entityId ? store.entities[match.entityId] : null;

              return (
                <div
                  key={match.id}
                  className={`p-3 rounded-lg border text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#181b22] border-indigo-900/60 hover:border-indigo-700/80'
                      : 'bg-[#131519] border-neutral-800 opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelectMatch(match.id)}
                        className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-600" />
                        )}
                      </button>

                      {/* Page Badge */}
                      <button
                        type="button"
                        onClick={() => handleGoToPage(match.pageId)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium text-[11px] hover:bg-neutral-700 transition-colors"
                        title={match.pageId ? 'Jump to this page in canvas' : undefined}
                      >
                        <FileText className="w-3 h-3 text-indigo-400" />
                        <span>{match.pageTitle || 'Page'}</span>
                        {match.pageId && <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />}
                      </button>

                      {/* Entity Name & Type Badge */}
                      {entity && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800/70 text-neutral-300 text-[11px]">
                          {getEntityIcon(entity.entityType, 'w-3 h-3 text-amber-400', entity.attributes)}
                          <span className="font-semibold text-neutral-200">{entity.name}</span>
                        </span>
                      )}

                      {/* Field Label Badge */}
                      <span className="px-1.5 py-0.5 rounded bg-neutral-850 text-neutral-400 text-[10px] border border-neutral-800">
                        {match.fieldLabel}
                      </span>
                    </div>

                    {/* Quick Single-Replace Button */}
                    <button
                      type="button"
                      onClick={() => handleReplaceSingle(match)}
                      className="px-2 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-800/60 text-indigo-300 hover:text-indigo-100 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                      title="Replace only this occurrence"
                    >
                      Replace
                    </button>
                  </div>

                  {/* Context Diff Box */}
                  <div className="font-mono text-[11px] bg-[#0c0e12] p-2.5 rounded border border-neutral-800/80 leading-relaxed text-neutral-300">
                    <span className="text-neutral-500">{match.beforeSnippet}</span>
                    <span className="bg-red-950/80 text-red-200 line-through px-1 py-0.5 rounded font-semibold mx-0.5 border border-red-800/40">
                      {match.matchedText}
                    </span>
                    <ArrowRight className="inline w-3 h-3 text-neutral-500 mx-1" />
                    <span className="bg-emerald-950/80 text-emerald-200 px-1 py-0.5 rounded font-semibold mx-0.5 border border-emerald-800/40">
                      {match.replacementText || '(delete)'}
                    </span>
                    <span className="text-neutral-500">{match.afterSnippet}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-[#16181d] flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            {matches.length > 0 && (
              <span>
                <strong className="text-neutral-200">{selectedMatchIds.size}</strong> of{' '}
                <strong className="text-neutral-200">{matches.length}</strong> selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* Replace Selected */}
            <button
              onClick={handleReplaceSelected}
              disabled={selectedMatchIds.size === 0}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:pointer-events-none text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer"
            >
              Replace Selected ({selectedMatchIds.size})
            </button>

            {/* Replace All */}
            <button
              onClick={handleReplaceAll}
              disabled={matches.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
            >
              <Replace className="w-3.5 h-3.5" />
              <span>Replace All ({matches.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
