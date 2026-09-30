'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Page, Placement, FlowMode, useScenarioStore } from '@/store/scenarioStore';
import { Entity } from '@/domain/entities';
import { EntityCard } from './EntityCard';
import { SortableEntityCard } from './SortableEntityCard';
import { ThemeSkin } from './themeSkin';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  Columns2,
  Palette,
  Pencil,
  Check,
  Layout,
  X,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

export function estimateEntityHeight(entity?: Entity, isCollapsed?: boolean): number {
  if (!entity) return 140;
  if (isCollapsed) return 46;

  let baseHeight = 46; // Header and padding
  const attrs = entity.attributes || {};

  switch (entity.entityType) {
    case 'rumor_list': {
      const entries = Array.isArray(attrs.entries) ? attrs.entries : [];
      baseHeight += 34; // Roll formula banner
      baseHeight += Math.max(entries.length, 1) * 70; // Entry items
      return Math.max(baseHeight, 140);
    }
    case 'random_event_list': {
      const isClock = (attrs.eventListType || attrs.eventType || attrs.listType) === 'progress_clock';
      if (isClock) {
        baseHeight += 95; // Clock visual + step buttons
        if (attrs.outcome) baseHeight += 45;
        const entries = Array.isArray(attrs.entries) ? attrs.entries : [];
        baseHeight += entries.length * 50;
        return Math.max(baseHeight, 150);
      }
      const entries = Array.isArray(attrs.entries) ? attrs.entries : [];
      baseHeight += 34; // Roll formula banner
      baseHeight += Math.max(entries.length, 1) * 70; // Entry items
      return Math.max(baseHeight, 140);
    }
    case 'region':
    case 'adventure_site':
    case 'area': {
      const textLen = (attrs.loreHistory || attrs.flavorText || attrs.environmentalHazards || attrs.entranceAccess || attrs.sensoryBox || '').length;
      const attrCount = ['climateTerrain', 'factionsPolitics', 'travelMechanics', 'siteType', 'entranceAccess', 'environmentalHazards', 'areaType', 'lightingAcoustics'].filter((k) => !!attrs[k]).length;
      const contentsCount = Array.isArray(attrs.contents) ? attrs.contents.length : (attrs.contents ? 1 : 0);
      baseHeight += attrCount * 26 + contentsCount * 20;
      baseHeight += Math.ceil(textLen / 45) * 18;
      return Math.max(baseHeight, 150);
    }
    case 'npc': {
      const loreLen = (attrs.lore || '').length;
      const attrCount = ['role', 'demeanor', 'motivation'].filter((k) => !!attrs[k]).length;
      baseHeight += attrCount * 24;
      baseHeight += Math.ceil(loreLen / 45) * 18;
      if (attrs.hitPoints || attrs.armorClass) baseHeight += 26;
      return Math.max(baseHeight, 130);
    }
    case 'enemy': {
      const actions = Array.isArray(attrs.actions) ? attrs.actions : [];
      baseHeight += 56;
      baseHeight += actions.length * 40;
      return Math.max(baseHeight, 160);
    }
    case 'image': {
      return 300;
    }
    case 'generic_list': {
      const items = Array.isArray(attrs.items) ? attrs.items : [];
      const contextLen = (attrs.context || '').length;
      baseHeight += 24;
      baseHeight += Math.ceil(contextLen / 45) * 18;
      baseHeight += Math.max(items.length, 1) * 22;
      return Math.max(baseHeight, 130);
    }
    case 'trap':
    case 'item':
    case 'treasure':
    default:
      return 150;
  }
}

export interface PageCanvasProps {
  page: Page;
  isPrintOnly?: boolean;
  isLast?: boolean;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({
  page,
  isPrintOnly = false,
  isLast = false,
}) => {
  const store = useScenarioStore();
  const rawPlacements = store.placements[page.id] || [];
  const sortedPlacements = [...rawPlacements].sort((a, b) => a.displayOrder - b.displayOrder);

  const [mounted, setMounted] = useState(false);
  const [activePlacementId, setActivePlacementId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(page.title || '');
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isPrintOnly) return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest('[data-entity-card="true"]')) {
        setActiveCardId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveCardId(null);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPrintOnly]);

  const handleHeightChange = useCallback((placementId: string, height: number) => {
    setMeasuredHeights((prev) => {
      if (Math.abs((prev[placementId] || 0) - height) < 2) return prev;
      return { ...prev, [placementId]: height };
    });
  }, []);

  const flowMode: FlowMode = page.flowMode || 'balanced';

  const handleToggleColumn = (placement: Placement, targetCol: 0 | 1) => {
    store.updatePlacement(page.id, placement.id, { columnIndex: targetCol });
    if (flowMode !== 'manual') {
      store.updatePage(page.id, { flowMode: 'manual' });
    }
  };

  // Build segments: contiguous 1-column items form 2-column flow blocks, while 2-column spans form full-width rows
  type Segment =
    | { type: 'full'; placement: Placement }
    | { type: 'columns'; leftPlacements: Placement[]; rightPlacements: Placement[] };

  const segments: Segment[] = [];
  let pendingColPlacements: Placement[] = [];

  const flushColPlacements = () => {
    if (pendingColPlacements.length === 0) return;

    const leftPlacements: Placement[] = [];
    const rightPlacements: Placement[] = [];

    if (flowMode === 'manual') {
      for (const p of pendingColPlacements) {
        if (p.columnIndex === 1) {
          rightPlacements.push(p);
        } else {
          leftPlacements.push(p);
        }
      }
    } else if (flowMode === 'alternating') {
      pendingColPlacements.forEach((p, idx) => {
        if (idx % 2 === 0) {
          leftPlacements.push(p);
        } else {
          rightPlacements.push(p);
        }
      });
    } else {
      // Balanced Masonry flow: greedily pack each card into whichever column has less height
      let leftAccum = 0;
      let rightAccum = 0;

      for (const p of pendingColPlacements) {
        const entity = store.entities[p.entityId];
        const h = measuredHeights[p.id] ?? estimateEntityHeight(entity, p.styleOverrides?.isCollapsed);

        if (leftAccum <= rightAccum) {
          leftPlacements.push(p);
          leftAccum += h + 16;
        } else {
          rightPlacements.push(p);
          rightAccum += h + 16;
        }
      }
    }

    segments.push({
      type: 'columns',
      leftPlacements,
      rightPlacements,
    });

    pendingColPlacements = [];
  };

  for (const p of sortedPlacements) {
    if (page.columnCount === 1 || p.columnSpan === 2) {
      flushColPlacements();
      segments.push({ type: 'full', placement: p });
    } else {
      pendingColPlacements.push(p);
    }
  }
  flushColPlacements();

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActivePlacementId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePlacementId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = sortedPlacements.findIndex((p) => p.id === active.id);
    const newIndex = sortedPlacements.findIndex((p) => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(sortedPlacements, oldIndex, newIndex);
      store.reorderPlacements(page.id, newOrder);
    }
  };

  const handleDragCancel = () => {
    setActivePlacementId(null);
  };

  const activePlacement = activePlacementId
    ? sortedPlacements.find((p) => p.id === activePlacementId)
    : null;
  const activeEntity = activePlacement ? store.entities[activePlacement.entityId] : null;

  const currentIndex = store.pages.findIndex((p) => p.id === page.id);
  const totalPages = store.pages.length;
  const prevPage = currentIndex > 0 ? store.pages[currentIndex - 1] : null;
  const nextPage = currentIndex < totalPages - 1 ? store.pages[currentIndex + 1] : null;

  const handlePrevPage = () => {
    if (prevPage) {
      store.setActivePage(prevPage.id);
    }
  };

  const handleNextPage = () => {
    if (nextPage) {
      store.setActivePage(nextPage.id);
    }
  };

  const handleAddPage = () => {
    const newPage = store.createPage();
    store.setActivePage(newPage.id);
  };

  useEffect(() => {
    setTitleInput(page.title || '');
  }, [page.title]);

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      store.updatePage(page.id, { title: titleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTogglePageColumns = () => {
    store.updatePage(page.id, {
      columnCount: page.columnCount === 1 ? 2 : 1,
    });
  };

  const handleSkinChange = (newSkin: ThemeSkin) => {
    store.updatePage(page.id, { themeSkin: newSkin });
  };

  if (isPrintOnly) {
    return (
      <div
        data-theme-skin={page.themeSkin || 'parchment'}
        className={`print-page relative w-full p-0 border-none transition-none shadow-none bg-transparent ${isLast ? 'last-page' : ''}`}
        style={{
          breakAfter: isLast ? 'auto' : 'page',
          pageBreakAfter: isLast ? 'auto' : 'always',
        }}
      >
        <div className="flex flex-col gap-4 w-full">
          {segments.map((seg, sIdx) => {
            if (seg.type === 'full') {
              const placement = seg.placement;
              const entity = store.entities[placement.entityId];
              if (!entity) return null;

              return (
                <div key={placement.id} className="w-full">
                  <EntityCard
                    placement={placement}
                    entity={entity}
                    pageSkin={page.themeSkin}
                    isActive={false}
                  />
                </div>
              );
            }

            return (
              <div key={`col-seg-${sIdx}`} className="flex gap-4 items-start w-full">
                {/* Left Column */}
                <div className="flex-1 min-w-0 flex flex-col gap-4">
                  {seg.leftPlacements.map((placement) => {
                    const entity = store.entities[placement.entityId];
                    if (!entity) return null;

                    return (
                      <EntityCard
                        key={placement.id}
                        placement={placement}
                        entity={entity}
                        pageSkin={page.themeSkin}
                        currentColumn={0}
                        isActive={false}
                      />
                    );
                  })}
                </div>

                {/* Right Column */}
                <div className="flex-1 min-w-0 flex flex-col gap-4">
                  {seg.rightPlacements.map((placement) => {
                    const entity = store.entities[placement.entityId];
                    if (!entity) return null;

                    return (
                      <EntityCard
                        key={placement.id}
                        placement={placement}
                        entity={entity}
                        pageSkin={page.themeSkin}
                        currentColumn={1}
                        isActive={false}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {sortedPlacements.length === 0 && (
            <div className="w-full py-12 text-center opacity-40 text-xs italic">
              (Page {page.pageNumber} is empty)
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Top Page Toolbar & Navigation (no-print) */}
      <div className="w-[210mm] max-w-full flex items-center justify-between pb-3 text-xs text-neutral-400 no-print gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Top Page Switcher Controls */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-md p-0.5">
            <button
              onClick={handlePrevPage}
              disabled={!prevPage}
              className={`p-1 rounded transition-colors ${
                prevPage
                  ? 'hover:bg-neutral-800 text-neutral-200 hover:text-white cursor-pointer'
                  : 'opacity-25 cursor-not-allowed text-neutral-600'
              }`}
              title={prevPage ? `Previous: Page ${prevPage.pageNumber} (${prevPage.title || 'Untitled'})` : 'First page'}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2 text-xs font-semibold text-neutral-300 select-none">
              {currentIndex + 1} / {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={!nextPage}
              className={`p-1 rounded transition-colors ${
                nextPage
                  ? 'hover:bg-neutral-800 text-neutral-200 hover:text-white cursor-pointer'
                  : 'opacity-25 cursor-not-allowed text-neutral-600'
              }`}
              title={nextPage ? `Next: Page ${nextPage.pageNumber} (${nextPage.title || 'Untitled'})` : 'Last page'}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-neutral-800" />

          {/* Page Title & Inline Rename */}
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-neutral-300">Page {page.pageNumber}:</span>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="px-1.5 py-0.5 text-xs bg-neutral-900 border border-indigo-400 rounded text-white focus:outline-none"
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 rounded hover:bg-neutral-800 text-emerald-400 cursor-pointer"
                title="Save title"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1.5 cursor-pointer group"
              title="Click to rename page"
            >
              <span className="font-semibold text-neutral-200 group-hover:text-white group-hover:underline">
                Page {page.pageNumber}: {page.title || 'Untitled'}
              </span>
              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 text-neutral-400" />
            </div>
          )}

          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-300">
            {page.pageSize} ({page.columnCount} Col)
          </span>

          {/* Quick Selection Helpers on Page */}
          {store.selectedEntityIds.length > 0 ? (
            <button
              onClick={() => store.clearSelection()}
              className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded bg-red-950/40 hover:bg-red-900 border border-red-800/40 text-red-300 text-[11px] transition-colors cursor-pointer"
              title="Clear all checked checkboxes across scenario"
            >
              <X className="w-3 h-3" />
              <span>Deselect All ({store.selectedEntityIds.length})</span>
            </button>
          ) : sortedPlacements.length > 0 && (
            <button
              onClick={() => store.selectAllOnPage(page.id)}
              className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-[11px] transition-colors cursor-pointer"
              title="Select all entities on this page for AI editing"
            >
              <CheckSquare className="w-3 h-3" />
              <span>Select Page</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Add Page Shortcut */}
          <button
            onClick={handleAddPage}
            className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-neutral-200 text-xs transition-colors cursor-pointer"
            title="Create and switch to a new page"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Page</span>
          </button>

          {/* Skin selector */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5">
            <Palette className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={page.themeSkin}
              onChange={(e) => handleSkinChange(e.target.value as ThemeSkin)}
              className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="parchment" className="bg-neutral-900 text-white">Parchment Fantasy</option>
              <option value="gothic" className="bg-neutral-900 text-white">Gothic Horror</option>
              <option value="cyberpunk" className="bg-neutral-900 text-white">Cyberpunk HUD</option>
              <option value="minimalist" className="bg-neutral-900 text-white">Clean Minimalist</option>
            </select>
          </div>

          {/* Column Toggle */}
          <button
            onClick={handleTogglePageColumns}
            className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
            title="Toggle between 1-column and 2-column page layout"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>{page.columnCount === 1 ? '1 Col' : '2 Col'}</span>
          </button>

          {/* Flow Mode Selector (Visible in 2-column mode) */}
          {page.columnCount === 2 && (
            <div
              className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5"
              title="Card Flow Layout: Balanced (Masonry) packs cards to eliminate gaps and maximize space. Alternating maintains sequence across columns. Manual follows assigned columns."
            >
              <span className="text-[10px] text-neutral-400 font-semibold uppercase">Flow:</span>
              <select
                value={page.flowMode || 'balanced'}
                onChange={(e) => store.updatePage(page.id, { flowMode: e.target.value as FlowMode })}
                className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="balanced" className="bg-neutral-900 text-white">Balanced (Masonry)</option>
                <option value="alternating" className="bg-neutral-900 text-white">Alternating</option>
                <option value="manual" className="bg-neutral-900 text-white">Manual Columns</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Physical Page Sheet (A4 dimensions: 210mm x 297mm) */}
      <div
        className={`print-page relative w-[210mm] min-h-[297mm] p-[15mm] border transition-all duration-200 rounded-sm shadow-xl print:border-none print:shadow-none print:m-0 print:p-0 print:w-full print:bg-transparent ${
          page.themeSkin === 'parchment'
            ? 'bg-[#f8f4e6] border-[#dfcfb0]'
            : page.themeSkin === 'gothic'
            ? 'bg-[#15161a] border-[#31333a]'
            : page.themeSkin === 'cyberpunk'
            ? 'bg-[#080b11] border-[#00f3ff]/20'
            : 'bg-white border-neutral-300'
        }`}
      >
        {/* Decorative corner embellishments for parchment/gothic (hidden in print) */}
        {page.themeSkin === 'parchment' && (
          <div className="absolute inset-2 border border-[#d8c39d]/40 pointer-events-none rounded no-print print:hidden" />
        )}

        {/* Page Grid Track with Sortable Drag and Drop */}
        <DndContext
          id={`dnd-context-page-${page.id}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={sortedPlacements.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="flex flex-col gap-4 w-full">
              {segments.map((seg, sIdx) => {
                if (seg.type === 'full') {
                  const placement = seg.placement;
                  const entity = store.entities[placement.entityId];
                  if (!entity) return null;
                  const globalIndex = sortedPlacements.findIndex((p) => p.id === placement.id);

                  return (
                    <div key={placement.id} className="w-full">
                      <SortableEntityCard
                        placement={placement}
                        entity={entity}
                        pageSkin={page.themeSkin}
                        isFirst={globalIndex === 0}
                        isLast={globalIndex === sortedPlacements.length - 1}
                        onMoveUp={() => store.movePlacementOrder(page.id, placement.id, 'up')}
                        onMoveDown={() => store.movePlacementOrder(page.id, placement.id, 'down')}
                        onHeightChange={(h) => handleHeightChange(placement.id, h)}
                        isActive={activeCardId === placement.id}
                        onActivate={() => setActiveCardId(placement.id)}
                      />
                    </div>
                  );
                }

                return (
                  <div key={`col-seg-${sIdx}`} className="flex gap-4 items-start w-full">
                    {/* Left Column */}
                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                      {seg.leftPlacements.map((placement) => {
                        const entity = store.entities[placement.entityId];
                        if (!entity) return null;
                        const globalIndex = sortedPlacements.findIndex((p) => p.id === placement.id);

                        return (
                          <SortableEntityCard
                            key={placement.id}
                            placement={placement}
                            entity={entity}
                            pageSkin={page.themeSkin}
                            isFirst={globalIndex === 0}
                            isLast={globalIndex === sortedPlacements.length - 1}
                            onMoveUp={() => store.movePlacementOrder(page.id, placement.id, 'up')}
                            onMoveDown={() => store.movePlacementOrder(page.id, placement.id, 'down')}
                            onHeightChange={(h) => handleHeightChange(placement.id, h)}
                            currentColumn={0}
                            onToggleColumn={() => handleToggleColumn(placement, 1)}
                            isActive={activeCardId === placement.id}
                            onActivate={() => setActiveCardId(placement.id)}
                          />
                        );
                      })}
                    </div>

                    {/* Right Column */}
                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                      {seg.rightPlacements.map((placement) => {
                        const entity = store.entities[placement.entityId];
                        if (!entity) return null;
                        const globalIndex = sortedPlacements.findIndex((p) => p.id === placement.id);

                        return (
                          <SortableEntityCard
                            key={placement.id}
                            placement={placement}
                            entity={entity}
                            pageSkin={page.themeSkin}
                            isFirst={globalIndex === 0}
                            isLast={globalIndex === sortedPlacements.length - 1}
                            onMoveUp={() => store.movePlacementOrder(page.id, placement.id, 'up')}
                            onMoveDown={() => store.movePlacementOrder(page.id, placement.id, 'down')}
                            onHeightChange={(h) => handleHeightChange(placement.id, h)}
                            currentColumn={1}
                            onToggleColumn={() => handleToggleColumn(placement, 0)}
                            isActive={activeCardId === placement.id}
                            onActivate={() => setActiveCardId(placement.id)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {sortedPlacements.length === 0 && (
                <div className="w-full border-2 border-dashed border-neutral-500/20 rounded-lg p-12 flex flex-col items-center justify-center text-center opacity-40">
                  <Layout className="w-10 h-10 mb-2" />
                  <p className="text-sm font-medium">This page is currently empty</p>
                  <p className="text-xs">Add elements from the Library in the sidebar to populate this page spread.</p>
                </div>
              )}
            </div>
          </SortableContext>

          {mounted && (
            <DragOverlay
              dropAnimation={{
                duration: 180,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}
            >
              {activePlacement && activeEntity ? (
                <div
                  className={`cursor-grabbing opacity-95 transition-shadow ${
                    page.columnCount === 1 || activePlacement.columnSpan === 2
                      ? 'w-[180mm] max-w-full'
                      : 'w-[88mm] max-w-full'
                  }`}
                >
                  <EntityCard
                    placement={activePlacement}
                    entity={activeEntity}
                    pageSkin={page.themeSkin}
                    isDragOverlay
                  />
                </div>
              ) : null}
            </DragOverlay>
          )}
        </DndContext>
      </div>

      {/* Bottom Page Navigation (no-print) */}
      <div className="w-[210mm] max-w-full flex items-center justify-between mt-6 pb-12 text-xs text-neutral-400 no-print border-t border-neutral-800/80 pt-4 gap-2 flex-wrap">
        {/* Previous Page Button */}
        <button
          onClick={handlePrevPage}
          disabled={!prevPage}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            prevPage
              ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white cursor-pointer'
              : 'opacity-25 cursor-not-allowed bg-neutral-950 border-neutral-900 text-neutral-600'
          }`}
          title={prevPage ? `Previous: Page ${prevPage.pageNumber} (${prevPage.title || 'Untitled'})` : 'No previous page'}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{prevPage ? `Page ${prevPage.pageNumber}: ${prevPage.title || 'Untitled'}` : 'Previous Page'}</span>
        </button>

        {/* Page Jump Pills */}
        <div className="flex items-center gap-1.5 max-w-sm overflow-x-auto py-1">
          {store.pages.map((p) => {
            const isCurrent = p.id === page.id;
            return (
              <button
                key={p.id}
                onClick={() => store.setActivePage(p.id)}
                className={`min-w-7 h-7 px-2 flex items-center justify-center rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40'
                    : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }`}
                title={`Jump to Page ${p.pageNumber}: ${p.title || 'Untitled'}`}
              >
                {p.pageNumber}
              </button>
            );
          })}

          <button
            onClick={handleAddPage}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-neutral-900 border border-dashed border-neutral-700 hover:border-indigo-500 text-neutral-400 hover:text-indigo-400 text-xs transition-colors cursor-pointer"
            title="Add a new page"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Next Page Button */}
        <button
          onClick={handleNextPage}
          disabled={!nextPage}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            nextPage
              ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white cursor-pointer'
              : 'opacity-25 cursor-not-allowed bg-neutral-950 border-neutral-900 text-neutral-600'
          }`}
          title={nextPage ? `Next: Page ${nextPage.pageNumber} (${nextPage.title || 'Untitled'})` : 'No next page'}
        >
          <span>{nextPage ? `Page ${nextPage.pageNumber}: ${nextPage.title || 'Untitled'}` : 'Next Page'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
