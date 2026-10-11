'use client';

import React, { useState } from 'react';
import { useScenarioStore, Page } from '@/store/scenarioStore';
import { getEntityIcon } from './themeSkin';
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  X,
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Pencil,
  Check,
  LayoutGrid,
  ExternalLink,
} from 'lucide-react';
import { ConfirmDeletePageModal } from './ConfirmDeletePageModal';

interface SortablePageCardProps {
  page: Page;
  index: number;
  total: number;
  isActive: boolean;
  onSelect: () => void;
  onDeleteRequest: () => void;
  onDuplicate: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onMoveToIndex: (targetIdx: number) => void;
}

const SortablePageCard: React.FC<SortablePageCardProps> = ({
  page,
  index,
  total,
  isActive,
  onSelect,
  onDeleteRequest,
  onDuplicate,
  onMoveLeft,
  onMoveRight,
  onMoveToIndex,
}) => {
  const store = useScenarioStore();
  const placements = store.placements[page.id] || [];
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(page.title || '');

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
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 30 : 'auto',
  };

  const handleSaveTitle = (e?: React.FormEvent) => {
    if (e) e.stopPropagation();
    if (titleInput.trim()) {
      store.updatePage(page.id, { title: titleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-150 ${
        isActive
          ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40'
          : 'bg-[#181a20] border-neutral-800 hover:border-neutral-700 hover:bg-[#1c1f26]'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-800/80">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-neutral-500 hover:text-neutral-300 rounded hover:bg-neutral-800"
            title="Drag to reorder page"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          <span className="font-bold text-xs text-indigo-400 shrink-0">
            Page {page.pageNumber}
          </span>

          {/* Title with inline edit */}
          {isEditingTitle ? (
            <div className="flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={() => handleSaveTitle()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="w-28 px-1.5 py-0.5 text-xs bg-black/60 border border-indigo-400 rounded text-white focus:outline-none"
              />
              <button
                onClick={(e) => handleSaveTitle(e)}
                className="p-1 rounded text-emerald-400 hover:bg-neutral-800"
                title="Save title"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 min-w-0 group/title cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              title="Click to rename page"
            >
              <span className="text-xs font-semibold text-neutral-200 truncate group-hover/title:text-white group-hover/title:underline">
                {page.title || 'Untitled'}
              </span>
              <Pencil className="w-2.5 h-2.5 text-neutral-500 opacity-0 group-hover/title:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Layout & Skin Badges */}
        <div className="flex items-center gap-1 shrink-0 text-[10px] text-neutral-400">
          <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono">
            {page.columnCount} Col
          </span>
          <span className="capitalize px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
            {page.themeSkin}
          </span>
        </div>
      </div>

      {/* Miniature Visual Layout Preview */}
      <div
        onClick={onSelect}
        className="my-3 min-h-[110px] max-h-[140px] overflow-y-auto p-2 rounded-lg bg-[#111317] border border-neutral-850 hover:border-indigo-600/50 cursor-pointer space-y-1.5 transition-colors"
        title="Click to open this page"
      >
        {placements.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[11px] text-neutral-600 italic py-6">
            (Empty Page)
          </div>
        ) : (
          <div className="space-y-1">
            {placements.map((plc) => {
              const ent = store.entities[plc.entityId];
              if (!ent) return null;
              return (
                <div
                  key={plc.id}
                  className="flex items-center justify-between gap-1.5 px-2 py-1 rounded bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-300"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="opacity-70 shrink-0">
                      {getEntityIcon(ent.entityType, 'w-3 h-3', ent.attributes)}
                    </span>
                    <span className="truncate">{ent.name}</span>
                  </div>
                  <span className="text-[9px] uppercase font-mono px-1 rounded bg-neutral-800 text-neutral-400 shrink-0">
                    {plc.columnSpan === 2 ? 'Span' : plc.columnIndex === 1 ? 'Col 2' : 'Col 1'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs">
        {/* Reordering Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveLeft}
            disabled={index === 0}
            className={`p-1 rounded border border-neutral-800 transition-colors ${
              index === 0
                ? 'opacity-20 cursor-not-allowed bg-neutral-900 text-neutral-600'
                : 'hover:bg-neutral-800 hover:text-white bg-neutral-900 text-neutral-300 cursor-pointer'
            }`}
            title="Move page earlier"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Jump to specific position select */}
          <select
            value={index}
            onChange={(e) => onMoveToIndex(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[11px] text-neutral-300 focus:outline-none cursor-pointer"
            title="Move directly to page position"
          >
            {Array.from({ length: total }).map((_, i) => (
              <option key={i} value={i}>
                Pos {i + 1}
              </option>
            ))}
          </select>

          <button
            onClick={onMoveRight}
            disabled={index === total - 1}
            className={`p-1 rounded border border-neutral-800 transition-colors ${
              index === total - 1
                ? 'opacity-20 cursor-not-allowed bg-neutral-900 text-neutral-600'
                : 'hover:bg-neutral-800 hover:text-white bg-neutral-900 text-neutral-300 cursor-pointer'
            }`}
            title="Move page later"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Page Actions: Duplicate, Open, Delete */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onDuplicate}
            className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-indigo-400 transition-colors cursor-pointer"
            title="Duplicate this page and its placements"
          >
            <Copy className="w-3 h-3" />
          </button>

          <button
            onClick={onSelect}
            className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 text-[11px] font-medium transition-colors cursor-pointer"
            title="Jump to this page"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open</span>
          </button>

          <button
            onClick={onDeleteRequest}
            disabled={total <= 1}
            className={`p-1.5 rounded border transition-colors ${
              total <= 1
                ? 'opacity-20 cursor-not-allowed border-neutral-850 text-neutral-600'
                : 'bg-neutral-900 hover:bg-red-950/80 border-neutral-800 hover:border-red-800/60 text-neutral-400 hover:text-red-400 cursor-pointer'
            }`}
            title={total <= 1 ? 'Cannot delete the only page' : 'Delete page'}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export interface PageOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PageOverviewModal: React.FC<PageOverviewModalProps> = ({ isOpen, onClose }) => {
  const store = useScenarioStore();
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);

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

  if (!isOpen) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = store.pages.findIndex((p) => p.id === active.id);
    const newIndex = store.pages.findIndex((p) => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(store.pages, oldIndex, newIndex);
      store.reorderPages(reordered);
    }
  };

  const handleSelectPage = (pageId: string) => {
    store.setActivePage(pageId);
    onClose();
  };

  const totalElements = Object.values(store.placements).reduce((acc, plcs) => acc + plcs.length, 0);

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
        <div
          className="w-full max-w-5xl max-h-[90vh] bg-[#14161a] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col text-neutral-100 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-[#191c22]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-indigo-400">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-100">Pages Overview</h2>
                <p className="text-xs text-neutral-400">
                  {store.currentScenario?.title || 'Scenario'} • {store.pages.length} {store.pages.length === 1 ? 'Page' : 'Pages'} • {totalElements} Placed Elements
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => store.createPage()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950 transition-colors cursor-pointer"
                title="Create a new page at the end of the scenario"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Page</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tip Banner */}
          <div className="px-6 py-2 bg-[#101216] border-b border-neutral-850 flex items-center justify-between text-[11px] text-neutral-400">
            <span>
              💡 <span className="font-semibold text-neutral-300">Tip:</span> Drag and drop cards with the grip handle to reorder pages, or click any card to jump directly to it.
            </span>
            <span className="text-neutral-500 font-mono">
              A4 Print Bounds (210mm × 297mm)
            </span>
          </div>

          {/* Grid Area with Sortable Pages */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#0f1114]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={store.pages.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {store.pages.map((page, index) => (
                    <SortablePageCard
                      key={page.id}
                      page={page}
                      index={index}
                      total={store.pages.length}
                      isActive={store.activePageId === page.id}
                      onSelect={() => handleSelectPage(page.id)}
                      onDeleteRequest={() => setPageToDelete(page)}
                      onDuplicate={() => store.duplicatePage(page.id)}
                      onMoveLeft={() => store.movePage(page.id, 'up')}
                      onMoveRight={() => store.movePage(page.id, 'down')}
                      onMoveToIndex={(targetIdx) => store.movePageToIndex(page.id, targetIdx)}
                    />
                  ))}

                  {/* Add New Page Button Card */}
                  <button
                    onClick={() => store.createPage()}
                    className="flex flex-col items-center justify-center gap-2 min-h-[220px] rounded-xl border-2 border-dashed border-neutral-800 hover:border-indigo-500/60 bg-[#14161b]/50 hover:bg-indigo-950/20 text-neutral-400 hover:text-indigo-300 transition-all cursor-pointer group"
                    title="Add new page"
                  >
                    <div className="p-3 rounded-full bg-neutral-850 group-hover:bg-indigo-900/40 text-neutral-400 group-hover:text-indigo-400 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold">Add New Page</span>
                    <span className="text-[10px] text-neutral-500">Page {store.pages.length + 1}</span>
                  </button>
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-neutral-800 bg-[#16181d] flex items-center justify-between text-xs text-neutral-400">
            <span className="text-[11px]">
              Active Page: <strong className="text-indigo-400">Page {store.pages.find((p) => p.id === store.activePageId)?.pageNumber || 1}</strong>
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

      {/* Confirmation modal for page deletion */}
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
    </>
  );
};
