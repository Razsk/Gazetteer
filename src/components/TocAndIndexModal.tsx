'use client';

import React, { useState, useMemo } from 'react';
import { useScenarioStore } from '@/store/scenarioStore';
import { getEntityIcon } from './themeSkin';
import { Entity } from '@/domain/entities';
import {
  X,
  BookOpen,
  Hash,
  Search,
  ExternalLink,
  Plus,
  Copy,
  Check,
  Filter,
} from 'lucide-react';

export interface TocAndIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'toc' | 'index';
}

export const TocAndIndexModal: React.FC<TocAndIndexModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'toc',
}) => {
  const store = useScenarioStore();
  const [prevDefaultTab, setPrevDefaultTab] = useState(defaultTab);
  const [activeTab, setActiveTab] = useState<'toc' | 'index'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  if (prevDefaultTab !== defaultTab) {
    setPrevDefaultTab(defaultTab);
    setActiveTab(defaultTab);
  }

  const showCopiedToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Jump to page helper
  const handleJumpToPage = (pageId: string) => {
    store.setActivePage(pageId);
    onClose();
  };

  // Table of Contents Data
  const tocEntries = store.pages.map((p) => {
    const plcs = store.placements[p.id] || [];
    const entities = plcs
      .map((plc) => store.entities[plc.entityId])
      .filter((ent): ent is Entity => Boolean(ent));

    return {
      page: p,
      placementsCount: plcs.length,
      entities,
    };
  });

  const filteredToc = tocEntries.filter(({ page, entities }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (page.title || '').toLowerCase().includes(q);
    const numMatch = `page ${page.pageNumber}`.includes(q);
    const entityMatch = entities.some((e) => e.name.toLowerCase().includes(q) || e.entityType.includes(q));
    return titleMatch || numMatch || entityMatch;
  });

  // Index (A-Z) Data
  const allEntitiesList = Object.values(store.entities);

  const filteredIndexEntities = allEntitiesList.filter((ent) => {
    // Category filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'geo' && !['region', 'adventure_site', 'location', 'area'].includes(ent.entityType)) return false;
      if (typeFilter === 'social' && !['npc', 'rumor_list'].includes(ent.entityType)) return false;
      if (typeFilter === 'tactical' && !['enemy', 'trap'].includes(ent.entityType)) return false;
      if (typeFilter === 'loot' && !['item', 'treasure'].includes(ent.entityType)) return false;
      if (typeFilter === 'tables' && !['generic_list', 'random_event_list', 'image'].includes(ent.entityType)) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = ent.name.toLowerCase().includes(q);
    const typeMatch = ent.entityType.toLowerCase().includes(q);
    const attrsStr = JSON.stringify(ent.attributes).toLowerCase();
    return nameMatch || typeMatch || attrsStr.includes(q);
  });

  // Group entities by first letter
  const groupedIndex = useMemo(() => {
    const sorted = [...filteredIndexEntities].sort((a, b) => a.name.localeCompare(b.name));
    const groups: Record<string, { entity: Entity; pageNumbers: { id: string; num: number }[] }[]> = {};

    sorted.forEach((ent) => {
      const firstLetter = (ent.name[0] || '#').toUpperCase();
      const letterKey = /[A-Z]/.test(firstLetter) ? firstLetter : '#';

      if (!groups[letterKey]) {
        groups[letterKey] = [];
      }

      // Find which pages have this entity
      const pageNumbers: { id: string; num: number }[] = [];
      store.pages.forEach((p) => {
        const plcs = store.placements[p.id] || [];
        if (plcs.some((plc) => plc.entityId === ent.id)) {
          pageNumbers.push({ id: p.id, num: p.pageNumber });
        }
      });

      groups[letterKey].push({
        entity: ent,
        pageNumbers,
      });
    });

    return groups;
  }, [filteredIndexEntities, store.pages, store.placements]);

  const availableLetters = Object.keys(groupedIndex).sort();

  // Handle Export / Copy TOC as Markdown
  const handleCopyTocMarkdown = () => {
    let md = `# Table of Contents: ${store.currentScenario?.title || 'Scenario'}\n\n`;
    tocEntries.forEach(({ page, entities }) => {
      md += `### Page ${page.pageNumber}: ${page.title || 'Untitled'}\n`;
      if (entities.length > 0) {
        entities.forEach((ent) => {
          md += `- **${ent.name}** (${ent.entityType.replace(/_/g, ' ')})\n`;
        });
      } else {
        md += `- *(Empty Page)*\n`;
      }
      md += `\n`;
    });

    navigator.clipboard.writeText(md);
    showCopiedToast('Table of Contents copied as Markdown!');
  };

  // Handle Export / Copy Index as Markdown
  const handleCopyIndexMarkdown = () => {
    let md = `# Index (A-Z): ${store.currentScenario?.title || 'Scenario'}\n\n`;
    availableLetters.forEach((letter) => {
      md += `## ${letter}\n`;
      groupedIndex[letter].forEach(({ entity, pageNumbers }) => {
        const pages = pageNumbers.length > 0
          ? `Page ${pageNumbers.map((p) => p.num).join(', ')}`
          : 'Library (unplaced)';
        md += `- **${entity.name}** (${entity.entityType.replace(/_/g, ' ')}) — *${pages}*\n`;
      });
      md += `\n`;
    });

    navigator.clipboard.writeText(md);
    showCopiedToast('Scenario Index copied as Markdown!');
  };

  const handleInsertTocPage = () => {
    store.generateTableOfContentsPage();
    showCopiedToast('Inserted Table of Contents as Page 1!');
    onClose();
  };

  const handleInsertIndexPage = () => {
    store.generateIndexPage();
    showCopiedToast(`Inserted Scenario Index as Page ${store.pages.length}!`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-[#14161a] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col text-neutral-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Navigation Tabs */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-[#191c22]">
          <div className="flex items-center gap-4">
            <div className="flex bg-[#121418] p-1 rounded-xl border border-neutral-800">
              <button
                onClick={() => setActiveTab('toc')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'toc'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Table of Contents</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
                  {store.pages.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('index')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'index'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Scenario Index (A-Z)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
                  {allEntitiesList.length}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {copiedNotification && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> {copiedNotification}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filters & Page Insertion Actions */}
        <div className="px-6 py-3 bg-[#111317] border-b border-neutral-850 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder={
                  activeTab === 'toc'
                    ? 'Filter pages or elements...'
                    : 'Search index entities, lore, types...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#181a20] border border-neutral-800 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Filter for Index */}
            {activeTab === 'index' && (
              <div className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-neutral-500" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-[#181a20] border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="geo">Sites & Geography</option>
                  <option value="social">NPCs & Rumors</option>
                  <option value="tactical">Enemies & Traps</option>
                  <option value="loot">Items & Treasures</option>
                  <option value="tables">Tables & Clocks</option>
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons: Insert Page into Document & Copy Markdown */}
          <div className="flex items-center gap-2">
            {activeTab === 'toc' ? (
              <>
                <button
                  onClick={handleCopyTocMarkdown}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
                  title="Copy Table of Contents as Markdown to clipboard"
                >
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copy Markdown</span>
                </button>

                <button
                  onClick={handleInsertTocPage}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950 transition-colors cursor-pointer"
                  title="Generate a formatted Table of Contents page and place it as Page 1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert TOC Page</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCopyIndexMarkdown}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
                  title="Copy A-Z Index as Markdown to clipboard"
                >
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copy Markdown</span>
                </button>

                <button
                  onClick={handleInsertIndexPage}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950 transition-colors cursor-pointer"
                  title="Generate a 2-column A-Z Index page and append it to your scenario"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Index Page</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0f1114]">
          {activeTab === 'toc' ? (
            /* Table of Contents View */
            <div className="space-y-4">
              {filteredToc.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs italic">
                  No pages or elements matched &quot;{searchQuery}&quot;.
                </div>
              ) : (
                filteredToc.map(({ page, placementsCount, entities }) => (
                  <div
                    key={page.id}
                    className="p-4 rounded-xl border border-neutral-800 bg-[#16181d] hover:border-neutral-700 transition-colors space-y-3"
                  >
                    {/* Page Header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 font-bold text-xs font-mono">
                          Page {page.pageNumber}
                        </span>
                        <h3 className="font-semibold text-sm text-neutral-100">
                          {page.title || 'Untitled'}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {placementsCount} {placementsCount === 1 ? 'element' : 'elements'} • {page.columnCount} Col • {page.themeSkin}
                        </span>
                        <button
                          onClick={() => handleJumpToPage(page.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
                          title="Open this page on canvas"
                        >
                          <ExternalLink className="w-3 h-3 text-indigo-400" />
                          <span>Open Page</span>
                        </button>
                      </div>
                    </div>

                    {/* Entities Breakdown on this Page */}
                    {entities.length === 0 ? (
                      <div className="text-[11px] text-neutral-600 italic pl-1">
                        (No elements placed on this page)
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                        {entities.map((ent) => {
                          const typeLabel = ent.entityType.replace(/_/g, ' ');
                          return (
                            <div
                              key={ent.id}
                              onClick={() => handleJumpToPage(page.id)}
                              className="flex items-start gap-2 p-2 rounded-lg bg-neutral-900/80 border border-neutral-800/80 hover:border-indigo-600/40 text-xs cursor-pointer group transition-colors"
                              title={`Jump to ${ent.name} on Page ${page.pageNumber}`}
                            >
                              <div className="mt-0.5 opacity-70 group-hover:opacity-100 text-neutral-400">
                                {getEntityIcon(ent.entityType, 'w-3.5 h-3.5', ent.attributes)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-neutral-200 truncate group-hover:text-white">
                                  {ent.name}
                                </div>
                                <div className="text-[10px] text-neutral-500 capitalize">
                                  {typeLabel}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Scenario Index (A-Z) View */
            <div className="space-y-6">
              {/* Quick Alphabetical Jump Ribbon */}
              {availableLetters.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-[#14161a] border border-neutral-800 text-xs">
                  {availableLetters.map((l) => (
                    <a
                      key={l}
                      href={`#idx-letter-${l}`}
                      className="w-6 h-6 flex items-center justify-center rounded font-mono font-bold text-indigo-400 hover:bg-indigo-950/80 hover:text-indigo-200 transition-colors"
                    >
                      {l}
                    </a>
                  ))}
                </div>
              )}

              {availableLetters.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs italic">
                  No entities matched your search or filter.
                </div>
              ) : (
                availableLetters.map((letter) => (
                  <div key={letter} id={`idx-letter-${letter}`} className="space-y-2.5 scroll-mt-4">
                    <div className="flex items-center gap-2 border-b border-neutral-800 pb-1">
                      <span className="font-mono font-bold text-sm text-indigo-400">{letter}</span>
                      <div className="h-px flex-1 bg-neutral-800" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {groupedIndex[letter].map(({ entity, pageNumbers }) => {
                        const typeLabel = entity.entityType.replace(/_/g, ' ');
                        return (
                          <div
                            key={entity.id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-[#16181d] border border-neutral-800 hover:border-neutral-700 transition-colors gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="opacity-70 text-neutral-400 shrink-0">
                                {getEntityIcon(entity.entityType, 'w-3.5 h-3.5', entity.attributes)}
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold text-neutral-200 truncate">
                                  {entity.name}
                                </div>
                                <div className="text-[10px] text-neutral-500 capitalize">
                                  {typeLabel}
                                </div>
                              </div>
                            </div>

                            {/* Page Links */}
                            <div className="flex items-center gap-1 shrink-0">
                              {pageNumbers.length > 0 ? (
                                pageNumbers.map((p) => (
                                  <button
                                    key={p.id}
                                    onClick={() => handleJumpToPage(p.id)}
                                    className="px-2 py-0.5 rounded bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/40 text-[10px] text-indigo-300 font-mono transition-colors cursor-pointer"
                                    title={`Jump to Page ${p.num}`}
                                  >
                                    P{p.num}
                                  </button>
                                ))
                              ) : (
                                <span className="text-[10px] text-neutral-600 font-mono px-1.5 py-0.5 rounded bg-neutral-900">
                                  Library
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-[#16181d] flex items-center justify-between text-xs text-neutral-400">
          <span className="text-[11px]">
            {activeTab === 'toc'
              ? `Scenario has ${store.pages.length} pages`
              : `Total ${allEntitiesList.length} canonical entities in library`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
