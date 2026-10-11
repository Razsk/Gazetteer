'use client';

import React, { useState } from 'react';
import { useScenarioStore, Page } from '@/store/scenarioStore';
import { EntityType, createDefaultEntity } from '@/domain/entities';
import { getEntityIcon, getEventListIcon } from './themeSkin';
import {
  Plus,
  BookOpen,
  Layers,
  Settings,
  ChevronUp,
  ChevronDown,
  Pencil,
  Check,
  Download,
  Upload,
  RotateCcw,
  BookPlus,
  Sparkles,
  LayoutGrid,
  Hash,
  Trash2,
  Copy,
  GripVertical,
  X,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditEntityModal } from './EditEntityModal';
import { NewScenarioModal } from './NewScenarioModal';
import { ConfirmDeletePageModal } from './ConfirmDeletePageModal';

interface PaletteTypeItem {
  type: EntityType;
  label: string;
  eventListType?: 'random_event' | 'progress_clock';
}

const ENTITY_CATEGORIES: {
  title: string;
  types: PaletteTypeItem[];
}[] = [
  {
    title: 'Macro & Geography',
    types: [
      { type: 'region', label: 'Region' },
      { type: 'adventure_site', label: 'Adventure Site' },
      { type: 'location', label: 'Location' },
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
      { type: 'generic_list', label: 'Generic List' },
      { type: 'random_event_list', label: 'Random Events', eventListType: 'random_event' },
      { type: 'random_event_list', label: 'Progress Clock', eventListType: 'progress_clock' },
      { type: 'image', label: 'Image Module' },
    ],
  },
];

export interface ScenarioSidebarProps {
  onOpenAiGenerateModal?: () => void;
  onOpenPageOverview?: () => void;
  onOpenToc?: () => void;
  onOpenIndex?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  initialTab?: 'elements' | 'pages' | 'settings';
}

interface SortableSidebarPageRowProps {
  page: Page;
  index: number;
  total: number;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  count: number;
  onStartRename: () => void;
  onSaveRename: () => void;
  onChangeEditingTitle: (val: string) => void;
  onCancelRename: () => void;
  onSelect: () => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToIndex: (targetIdx: number) => void;
}

const SortableSidebarPageRow: React.FC<SortableSidebarPageRowProps> = ({
  page,
  index,
  total,
  isActive,
  isEditing,
  editingTitle,
  count,
  onStartRename,
  onSaveRename,
  onChangeEditingTitle,
  onCancelRename,
  onSelect,
  onDuplicate,
  onDeleteRequest,
  onMoveUp,
  onMoveDown,
  onMoveToIndex,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 20 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
        isActive
          ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm'
          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
      }`}
    >
      {/* Drag grip handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-neutral-500 hover:text-neutral-300 rounded hover:bg-neutral-800 shrink-0"
        title="Drag to reorder page"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <div className="flex-1 min-w-0 px-1.5">
        {isEditing ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="font-semibold text-neutral-400">P{page.pageNumber}:</span>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => onChangeEditingTitle(e.target.value)}
              onBlur={onSaveRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveRename();
                if (e.key === 'Escape') onCancelRename();
              }}
              autoFocus
              className="flex-1 px-1.5 py-0.5 text-xs bg-black/60 border border-indigo-400 rounded text-white focus:outline-none"
            />
            <button
              onClick={onSaveRename}
              className="p-1 rounded hover:bg-neutral-800 text-emerald-400 cursor-pointer"
              title="Save name"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold truncate">Page {page.pageNumber}: {page.title || 'Untitled'}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartRename();
              }}
              className="opacity-0 group-hover:opacity-60 hover:opacity-100 p-0.5 rounded text-neutral-400 hover:text-white transition-opacity cursor-pointer"
              title="Rename page"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
          <span>{count} {count === 1 ? 'element' : 'elements'}</span>
          <span>•</span>
          <span>{page.columnCount} Col</span>
          <span>•</span>
          <span className="capitalize">{page.themeSkin}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Reordering Up/Down controls */}
        <div className="flex flex-col opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            disabled={index === 0}
            onClick={onMoveUp}
            className={`p-0.5 rounded hover:bg-neutral-800 ${
              index === 0 ? 'opacity-20 cursor-not-allowed' : 'text-neutral-300 hover:text-white cursor-pointer'
            }`}
            title="Move page up"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            disabled={index === total - 1}
            onClick={onMoveDown}
            className={`p-0.5 rounded hover:bg-neutral-800 ${
              index === total - 1 ? 'opacity-20 cursor-not-allowed' : 'text-neutral-300 hover:text-white cursor-pointer'
            }`}
            title="Move page down"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Move to Position Dropdown */}
        <select
          value={index}
          onChange={(e) => onMoveToIndex(Number(e.target.value))}
          className="bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-[9px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 cursor-pointer"
          title="Move directly to page position"
        >
          {Array.from({ length: total }).map((_, i) => (
            <option key={i} value={i} className="bg-neutral-900 text-white">
              P{i + 1}
            </option>
          ))}
        </select>

        {/* Duplicate page */}
        <button
          onClick={onDuplicate}
          className="opacity-0 group-hover:opacity-80 hover:opacity-100 p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-indigo-300 transition-all cursor-pointer"
          title="Duplicate page"
        >
          <Copy className="w-3 h-3" />
        </button>

        {/* Delete page */}
        <button
          onClick={onDeleteRequest}
          disabled={total <= 1}
          className={`p-1 rounded transition-colors ${
            total <= 1
              ? 'opacity-20 cursor-not-allowed text-neutral-600'
              : 'text-neutral-500 hover:text-red-400 hover:bg-red-950/40 cursor-pointer'
          }`}
          title={total <= 1 ? 'Cannot delete the only page' : 'Delete page'}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const ScenarioSidebar: React.FC<ScenarioSidebarProps> = ({
  onOpenAiGenerateModal,
  onOpenPageOverview,
  onOpenToc,
  onOpenIndex,
  isOpenMobile = false,
  onCloseMobile,
  initialTab,
}) => {
  const store = useScenarioStore();
  const [activeTab, setActiveTab] = useState<'elements' | 'pages' | 'settings'>('elements');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState('');
  const [editingEntityModalId, setEditingEntityModalId] = useState<string | null>(null);
  const [isNewScenarioModalOpen, setIsNewScenarioModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const pageSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handlePageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = store.pages.findIndex((p) => p.id === active.id);
    const newIndex = store.pages.findIndex((p) => p.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(store.pages, oldIndex, newIndex);
      store.reorderPages(reordered);
    }
  };

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

  const handleAddElementToActivePage = (type: EntityType, subtype?: string) => {
    if (!store.currentScenario) return;

    // 1. Create canonical entity in library
    const newEntity = createDefaultEntity(store.currentScenario.id, type, undefined, subtype);
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
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          data-testid="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        data-testid="scenario-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm md:static md:w-80 md:z-auto bg-[#16181d] border-r border-neutral-800 flex flex-col h-full no-print shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Scenario Header */}
        <div className="p-4 border-b border-neutral-800 bg-[#1b1e24] flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
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

          {/* Close button for mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 ml-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
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
            {/* AI Generate New Elements Action */}
            {onOpenAiGenerateModal && (
              <div className="pb-3 border-b border-neutral-800">
                <button
                  type="button"
                  onClick={onOpenAiGenerateModal}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-700/50 hover:border-emerald-600 text-emerald-300 hover:text-emerald-200 font-semibold transition-colors cursor-pointer text-xs shadow-sm"
                  title="Ask LLM to create and fill new elements on a new page"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI Generate Elements (New Page)</span>
                </button>
              </div>
            )}

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
                        key={`${t.type}-${t.eventListType || 'default'}`}
                        onClick={() => handleAddElementToActivePage(t.type, t.eventListType)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 text-xs transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="opacity-70">
                            {t.eventListType
                              ? getEventListIcon(t.eventListType, 'w-3.5 h-3.5')
                              : getEntityIcon(t.type, 'w-3.5 h-3.5')}
                          </span>
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
                  {allEntitiesList.map((ent) => {
                    const placedCount = Object.values(store.placements).flat().filter((p) => p.entityId === ent.id).length;
                    return (
                      <div
                        key={ent.id}
                        className="w-full flex items-center justify-between p-1.5 rounded bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 hover:border-neutral-700 transition-colors group"
                      >
                        <button
                          onClick={() => handleAddExistingToActivePage(ent.id)}
                          className="flex-1 min-w-0 text-left flex items-center gap-2 truncate cursor-pointer hover:text-white"
                          title="Place synchronized instance on active page"
                        >
                          <span className="opacity-60">{getEntityIcon(ent.entityType, 'w-3 h-3', ent.attributes)}</span>
                          <span className="truncate">{ent.name}</span>
                          {placedCount > 1 ? (
                            <span
                              className="text-[9px] px-1 py-0.2 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-700/40 font-mono shrink-0"
                              title={`Synced across ${placedCount} placements`}
                            >
                              x{placedCount}
                            </span>
                          ) : placedCount === 1 ? (
                            <span className="text-[9px] text-neutral-500 font-mono shrink-0">x1</span>
                          ) : null}
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
                  );
                })}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'pages' && (
          <div className="space-y-3">
            {/* Quick Navigation Ribbon */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#121418] border border-neutral-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={onOpenPageOverview}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer text-[11px] font-medium"
                title="Open bird's-eye Page Overview gallery"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={onOpenToc}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer text-[11px] font-medium"
                title="View Table of Contents"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>TOC</span>
              </button>

              <button
                type="button"
                onClick={onOpenIndex}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer text-[11px] font-medium"
                title="View Scenario Index (A-Z)"
              >
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                <span>Index</span>
              </button>
            </div>

            {/* Header with Page Count & Add Page Actions */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Pages ({store.pages.length})
              </span>
              <div className="flex items-center gap-1.5">
                {onOpenAiGenerateModal && (
                  <button
                    onClick={onOpenAiGenerateModal}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-750 hover:bg-emerald-700 text-emerald-100 text-xs font-semibold cursor-pointer border border-emerald-600/50"
                    title="Generate new elements on a new page using AI"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-300" /> AI Page
                  </button>
                )}
                <button
                  onClick={() => store.createPage()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-sm shadow-indigo-950"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Page
                </button>
              </div>
            </div>

            {/* Drag & Drop Sortable Pages List */}
            <DndContext
              sensors={pageSensors}
              collisionDetection={closestCenter}
              onDragEnd={handlePageDragEnd}
            >
              <SortableContext
                items={store.pages.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {store.pages.map((p, idx) => (
                    <SortableSidebarPageRow
                      key={p.id}
                      page={p}
                      index={idx}
                      total={store.pages.length}
                      isActive={store.activePageId === p.id}
                      isEditing={editingPageId === p.id}
                      editingTitle={editingPageTitle}
                      count={(store.placements[p.id] || []).length}
                      onStartRename={() => handleStartRenamePage(p.id, p.title || '')}
                      onSaveRename={() => handleSaveRenamePage(p.id)}
                      onChangeEditingTitle={(val) => setEditingPageTitle(val)}
                      onCancelRename={() => setEditingPageId(null)}
                      onSelect={() => {
                        store.setActivePage(p.id);
                        onCloseMobile?.();
                      }}
                      onDuplicate={() => store.duplicatePage(p.id)}
                      onDeleteRequest={() => setPageToDelete(p)}
                      onMoveUp={() => store.movePage(p.id, 'up')}
                      onMoveDown={() => store.movePage(p.id, 'down')}
                      onMoveToIndex={(targetIdx) => store.movePageToIndex(p.id, targetIdx)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs">
            {/* New Scenario Quick Launch */}
            <div className="pb-3 border-b border-neutral-800">
              <button
                type="button"
                onClick={() => setIsNewScenarioModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 hover:border-indigo-500/70 text-indigo-300 hover:text-indigo-200 font-semibold transition-colors cursor-pointer text-xs"
              >
                <BookPlus className="w-4 h-4 text-indigo-400" />
                <span>New Scenario (Setup Wizard)</span>
              </button>
            </div>

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

      {/* New Scenario Settings Modal */}
      <NewScenarioModal
        isOpen={isNewScenarioModalOpen}
        onClose={() => setIsNewScenarioModalOpen(false)}
      />

      {/* Confirm Delete Page Modal */}
      {pageToDelete && (
        <ConfirmDeletePageModal
          isOpen={!!pageToDelete}
          onClose={() => setPageToDelete(null)}
          onConfirm={() => {
            store.deletePage(pageToDelete.id);
            setPageToDelete(null);
          }}
          pageNumber={pageToDelete.pageNumber}
          pageTitle={pageToDelete.title}
          elementCount={(store.placements[pageToDelete.id] || []).length}
        />
      )}
    </aside>
    </>
  );
};
