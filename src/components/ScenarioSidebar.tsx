'use client';

import React, { useState } from 'react';
import { useScenarioStore } from '@/store/scenarioStore';
import { EntityType, createDefaultEntity } from '@/domain/entities';
import { getEntityIcon } from './themeSkin';
import { Plus, BookOpen, Layers, Settings, ChevronUp, ChevronDown, Pencil, Check, Download, Upload, RotateCcw } from 'lucide-react';
import { EditEntityModal } from './EditEntityModal';

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
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState('');
  const [editingEntityModalId, setEditingEntityModalId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleStartRenamePage = (pageId: string, currentTitle: string) => {
    setEditingPageId(pageId);
    setEditingPageTitle(currentTitle || '');
  };

  const handleSaveRenamePage = (pageId: string) => {
    if (editingPageTitle.trim()) {
      store.updatePage(pageId, { title: editingPageTitle.trim() });
    }
    setEditingPageId(null);
  };

  const handleSaveScenario = () => {
    const data = store.exportScenario();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (store.currentScenario?.title || 'scenario')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    link.href = url;
    link.download = `${safeTitle || 'scenario'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const success = store.loadScenario(parsed);
        if (!success) {
          alert('Invalid scenario file format.');
        }
      } catch (err) {
        alert('Failed to parse scenario JSON file.');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetScenario = () => {
    if (window.confirm('Reset this scenario? All unsaved changes will be lost.')) {
      store.resetStore();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gazetteer_saved_scenario');
      }
    }
  };

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
                    <div
                      key={ent.id}
                      className="w-full flex items-center justify-between p-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 hover:border-neutral-700 transition-colors group"
                    >
                      <button
                        onClick={() => handleAddExistingToActivePage(ent.id)}
                        className="flex-1 min-w-0 text-left flex items-center gap-2 truncate cursor-pointer hover:text-white"
                        title="Place instance on active page"
                      >
                        <span className="opacity-60">{getEntityIcon(ent.entityType, 'w-3 h-3')}</span>
                        <span className="truncate">{ent.name}</span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingEntityModalId(ent.id)}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-indigo-400 transition-colors cursor-pointer"
                          title="Edit element details"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleAddExistingToActivePage(ent.id)}
                          className="px-1.5 py-0.5 rounded bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 text-[10px] text-indigo-300 font-mono transition-colors cursor-pointer"
                          title="Place instance on active page"
                        >
                          Place
                        </button>
                      </div>
                    </div>
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
              {store.pages.map((p, idx) => {
                const isActive = store.activePageId === p.id;
                const count = (store.placements[p.id] || []).length;
                const isEditing = editingPageId === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => store.setActivePage(p.id)}
                    className={`group flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <span className="font-semibold text-neutral-400">P{p.pageNumber}:</span>
                          <input
                            type="text"
                            value={editingPageTitle}
                            onChange={(e) => setEditingPageTitle(e.target.value)}
                            onBlur={() => handleSaveRenamePage(p.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRenamePage(p.id);
                              if (e.key === 'Escape') setEditingPageId(null);
                            }}
                            autoFocus
                            className="flex-1 px-1.5 py-0.5 text-xs bg-black/60 border border-indigo-400 rounded text-white focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveRenamePage(p.id)}
                            className="p-1 rounded hover:bg-neutral-800 text-emerald-400"
                            title="Save name"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold truncate">Page {p.pageNumber}: {p.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRenamePage(p.id, p.title || '');
                            }}
                            className="opacity-0 group-hover:opacity-60 hover:opacity-100 p-0.5 rounded text-neutral-400 hover:text-white transition-opacity"
                            title="Rename page"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {count} elements • {p.columnCount} Col • {p.themeSkin}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Reordering Up/Down controls */}
                      <div className="flex flex-col opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            store.movePage(p.id, 'up');
                          }}
                          className={`p-0.5 rounded hover:bg-neutral-800 ${
                            idx === 0 ? 'opacity-20 cursor-not-allowed' : 'text-neutral-300 hover:text-white'
                          }`}
                          title="Move page up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={idx === store.pages.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            store.movePage(p.id, 'down');
                          }}
                          className={`p-0.5 rounded hover:bg-neutral-800 ${
                            idx === store.pages.length - 1 ? 'opacity-20 cursor-not-allowed' : 'text-neutral-300 hover:text-white'
                          }`}
                          title="Move page down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {store.pages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            store.deletePage(p.id);
                          }}
                          className="text-neutral-500 hover:text-red-400 p-1 ml-1"
                          title="Delete page"
                        >
                          ×
                        </button>
                      )}
                    </div>
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

            {/* Scenario Backup & Storage */}
            <div className="pt-4 border-t border-neutral-800 space-y-2">
              <label className="block text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
                Scenario Backup & File Storage
              </label>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleSaveScenario}
                  className="w-full flex items-center justify-between px-3 py-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-indigo-500 text-neutral-200 text-xs transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Save Scenario (.json)</span>
                  </span>
                  <span className="text-[10px] text-neutral-500">Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-between px-3 py-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-emerald-500 text-neutral-200 text-xs transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Load Scenario (.json)</span>
                  </span>
                  <span className="text-[10px] text-neutral-500">Upload</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetScenario}
                  className="w-full flex items-center justify-between px-3 py-2 rounded bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 hover:border-red-700/60 text-red-300 text-xs transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                    <span>Reset Scenario</span>
                  </span>
                  <span className="text-[10px] text-red-400/80">Clear</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Entity Modal */}
      <EditEntityModal
        entityId={editingEntityModalId}
        isOpen={Boolean(editingEntityModalId)}
        onClose={() => setEditingEntityModalId(null)}
      />
    </aside>
  );
};
