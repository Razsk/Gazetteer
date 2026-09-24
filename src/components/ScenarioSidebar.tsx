'use client';

import React, { useState } from 'react';
import { useScenarioStore } from '@/store/scenarioStore';
import { EntityType, createDefaultEntity } from '@/domain/entities';
import { getEntityIcon } from './themeSkin';
import { Plus, BookOpen, Layers, Settings, ChevronRight } from 'lucide-react';

const ENTITY_CATEGORIES: {
  title: string;
  types: { type: EntityType; label: string }[];
}[] = [
  {
    title: 'Macro & Geography',
    types: [
      { type: 'region', label: 'Region' },
      { type: 'adventure_site', label: 'Adventure Site' },
      { type: 'area', label: 'Area / Room' },
    ],
  },
  {
    title: 'Narrative & Social',
    types: [
      { type: 'npc', label: 'NPC' },
      { type: 'rumor_list', label: 'Rumor List' },
    ],
  },
  {
    title: 'Tactical & Hazards',
    types: [
      { type: 'enemy', label: 'Enemy / Boss' },
      { type: 'trap', label: 'Trap / Hazard' },
    ],
  },
  {
    title: 'Loot & Economy',
    types: [
      { type: 'item', label: 'Item / Magic Item' },
      { type: 'treasure', label: 'Treasure Cache' },
    ],
  },
  {
    title: 'Tables & Assets',
    types: [
      { type: 'random_event_list', label: 'Random Events' },
      { type: 'image', label: 'Image Module' },
    ],
  },
];

export const ScenarioSidebar: React.FC = () => {
  const store = useScenarioStore();
  const [activeTab, setActiveTab] = useState<'elements' | 'pages' | 'settings'>('elements');

  const handleAddElementToActivePage = (type: EntityType) => {
    if (!store.currentScenario) return;

    // 1. Create canonical entity in library
    const newEntity = createDefaultEntity(store.currentScenario.id, type);
    store.addEntity(newEntity);

    // 2. Place on active page
    const targetPageId = store.activePageId || store.pages[0]?.id;
    if (targetPageId) {
      store.addPlacement(targetPageId, newEntity.id, 0, 1);
    }
  };

  const handleAddExistingToActivePage = (entityId: string) => {
    const targetPageId = store.activePageId || store.pages[0]?.id;
    if (targetPageId) {
      store.addPlacement(targetPageId, entityId, 0, 1);
    }
  };

  const allEntitiesList = Object.values(store.entities);

  return (
    <aside className="w-80 bg-[#16181d] border-r border-neutral-800 flex flex-col h-full no-print">
      {/* Scenario Header */}
      <div className="p-4 border-b border-neutral-800 bg-[#1b1e24]">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h1 className="font-bold text-sm text-neutral-100 truncate">
            {store.currentScenario?.title || 'Gazetteer Scenario'}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <span>{store.currentScenario?.ruleset}</span>
          <span>•</span>
          <span>Lvl {store.currentScenario?.targetPartyLevel}</span>
          <span>•</span>
          <span className="truncate">{store.currentScenario?.theme}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 text-xs font-medium text-neutral-400 bg-[#131519]">
        <button
          onClick={() => setActiveTab('elements')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'elements'
              ? 'border-indigo-500 text-neutral-100 bg-[#191b22]'
              : 'border-transparent hover:text-neutral-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Elements
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'pages'
              ? 'border-indigo-500 text-neutral-100 bg-[#191b22]'
              : 'border-transparent hover:text-neutral-200'
          }`}
        >
          <span>Pages ({store.pages.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'settings'
              ? 'border-indigo-500 text-neutral-100 bg-[#191b22]'
              : 'border-transparent hover:text-neutral-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Settings
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'elements' && (
          <>
            {/* Create New Element Sections */}
            <div className="space-y-4">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Add New Element
              </span>
              {ENTITY_CATEGORIES.map((cat) => (
                <div key={cat.title} className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-neutral-500">{cat.title}</div>
                  <div className="grid grid-cols-1 gap-1">
                    {cat.types.map((t) => (
                      <button
                        key={t.type}
                        onClick={() => handleAddElementToActivePage(t.type)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 text-xs transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="opacity-70">{getEntityIcon(t.type, 'w-3.5 h-3.5')}</span>
                          <span>{t.label}</span>
                        </span>
                        <Plus className="w-3.5 h-3.5 opacity-50" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Reusable Canonical Entity Library */}
            {allEntitiesList.length > 0 && (
              <div className="pt-4 border-t border-neutral-800 space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Scenario Library ({allEntitiesList.length})
                </span>
                <p className="text-[11px] text-neutral-500">
                  Click to place another instance of a shared entity on this page:
                </p>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {allEntitiesList.map((ent) => (
                    <button
                      key={ent.id}
                      onClick={() => handleAddExistingToActivePage(ent.id)}
                      className="w-full text-left flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 hover:border-indigo-500 transition-colors"
                      title="Place another instance of this entity"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="opacity-60">{getEntityIcon(ent.entityType, 'w-3 h-3')}</span>
                        <span className="truncate">{ent.name}</span>
                      </span>
                      <span className="text-[10px] text-indigo-400 font-mono">Reuse</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'pages' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Pages Overview
              </span>
              <button
                onClick={() => store.createPage()}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Page
              </button>
            </div>

            <div className="space-y-1.5">
              {store.pages.map((p) => {
                const isActive = store.activePageId === p.id;
                const count = (store.placements[p.id] || []).length;
                return (
                  <div
                    key={p.id}
                    onClick={() => store.setActivePage(p.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">Page {p.pageNumber}: {p.title}</div>
                      <div className="text-[10px] text-neutral-400">
                        {count} elements • {p.columnCount} Col • {p.themeSkin}
                      </div>
                    </div>
                    {store.pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          store.deletePage(p.id);
                        }}
                        className="text-neutral-500 hover:text-red-400 p-1"
                        title="Delete page"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Scenario Title</label>
              <input
                type="text"
                value={store.currentScenario?.title || ''}
                onChange={(e) => store.setScenarioMetadata({ title: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Ruleset</label>
              <input
                type="text"
                value={store.currentScenario?.ruleset || ''}
                onChange={(e) => store.setScenarioMetadata({ ruleset: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Setting / Theme</label>
              <input
                type="text"
                value={store.currentScenario?.theme || ''}
                onChange={(e) => store.setScenarioMetadata({ theme: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Target Party Level</label>
              <input
                type="number"
                value={store.currentScenario?.targetPartyLevel || 1}
                onChange={(e) => store.setScenarioMetadata({ targetPartyLevel: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-100"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
