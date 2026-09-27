'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Entity } from '@/domain/entities';
import { Placement, useScenarioStore } from '@/store/scenarioStore';
import { THEME_SKINS, ThemeSkin, getEntityIcon } from './themeSkin';
import {
  CheckSquare,
  Square,
  Copy,
  Trash2,
  Columns2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Dice5,
  Image as ImageIcon,
  ArrowRightLeft,
  Plus,
  Pencil,
  GripVertical,
  ArrowUp,
  ArrowDown,
  List,
  ListOrdered,
} from 'lucide-react';
import { EditEntityModal } from './EditEntityModal';
import { FormattedText } from './FormattedText';

interface EntityCardProps {
  placement: Placement;
  entity: Entity;
  pageSkin: ThemeSkin;
  isOverflowing?: boolean;
  isDragging?: boolean;
  isDragOverlay?: boolean;
  dragHandleProps?: Record<string, any>;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  currentColumn?: 0 | 1;
  onToggleColumn?: () => void;
  isActive?: boolean;
  onActivate?: () => void;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  placement,
  entity,
  pageSkin,
  isOverflowing = false,
  isDragging = false,
  isDragOverlay = false,
  dragHandleProps,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
  currentColumn,
  onToggleColumn,
  isActive = false,
  onActivate,
}) => {
  const store = useScenarioStore();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(entity.name);
  const [isExpanded, setIsExpanded] = useState(!placement.styleOverrides.isCollapsed);
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isSelected = store.selectedEntityIds.includes(entity.id);
  const skin = THEME_SKINS[placement.styleOverrides.themeSkin || pageSkin];

  // Count how many placements across all pages share this same canonical entity
  const allPlacements = Object.values(store.placements).flat();
  const instanceCount = allPlacements.filter((p) => p.entityId === entity.id).length;

  const handleToggleColSpan = () => {
    store.updatePlacement(placement.pageId, placement.id, {
      columnSpan: placement.columnSpan === 1 ? 2 : 1,
    });
  };

  const handleClone = (targetPageId?: string) => {
    store.clonePlacement(placement.pageId, placement.id, targetPageId);
    if (targetPageId && targetPageId !== placement.pageId) {
      store.setActivePage(targetPageId);
    }
  };

  const handleDelete = () => {
    store.removePlacement(placement.pageId, placement.id);
  };

  const handleMoveToPage = (targetPageId: string) => {
    const success = store.movePlacement(placement.pageId, targetPageId, placement.id);
    if (success) {
      store.setActivePage(targetPageId);
    }
    setIsMoveMenuOpen(false);
  };

  const handleMoveToNewPage = () => {
    const newPage = store.createPage();
    const success = store.movePlacement(placement.pageId, newPage.id, placement.id);
    if (success) {
      store.setActivePage(newPage.id);
    }
    setIsMoveMenuOpen(false);
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      store.updateEntity(entity.id, { name: nameInput.trim() });
    }
    setIsEditing(false);
  };

  const handleToggleCollapse = () => {
    setIsExpanded(!isExpanded);
    store.updatePlacement(placement.pageId, placement.id, {
      styleOverrides: {
        ...placement.styleOverrides,
        isCollapsed: isExpanded,
      },
    });
  };

  // Render type-specific attributes summary with structured RPG layouts
  const renderAttributeSummary = () => {
    const attrs = entity.attributes || {};

    switch (entity.entityType) {
      case 'npc':
        return (
          <div className="space-y-1.5 text-xs">
            <div className="flex gap-2">
              <span className="font-semibold opacity-75">Role:</span>
              <span>{attrs.role || 'Citizen'}</span>
            </div>
            {attrs.demeanor && (
              <div className="flex gap-2">
                <span className="font-semibold opacity-75 shrink-0">Demeanor:</span>
                <FormattedText content={attrs.demeanor} className="italic flex-1" />
              </div>
            )}
            {attrs.motivation && (
              <div className="flex gap-2">
                <span className="font-semibold opacity-75 shrink-0">Motivation:</span>
                <FormattedText content={attrs.motivation} className="flex-1" />
              </div>
            )}
            {attrs.lore && <FormattedText content={attrs.lore} className="opacity-90 leading-relaxed pt-1" />}
            {(attrs.hitPoints || attrs.armorClass) && (
              <div className="flex gap-4 pt-1 font-mono text-[11px] opacity-80 border-t border-current/10">
                {attrs.hitPoints && <span>HP: {attrs.hitPoints}</span>}
                {attrs.armorClass && <span>AC: {attrs.armorClass}</span>}
              </div>
            )}
          </div>
        );

      case 'trap':
        return (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                DC {attrs.detectionDc ?? 12} Detection
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
                DC {attrs.disarmDc ?? 12} Disarm
              </span>
            </div>
            <div>
              <span className="font-semibold opacity-75">Trigger:</span>{' '}
              <FormattedText content={attrs.trigger || 'Pressure mechanism'} />
            </div>
            {attrs.effect && (
              <div className="opacity-90 leading-relaxed">
                <span className="font-semibold opacity-75">Effect:</span>{' '}
                <FormattedText content={attrs.effect} />
              </div>
            )}
            {attrs.resetConditions && (
              <div className="text-[11px] opacity-75">
                <span className="font-semibold">Reset:</span>{' '}
                <FormattedText content={attrs.resetConditions} />
              </div>
            )}
          </div>
        );

      case 'item':
      case 'treasure':
        return (
          <div className="space-y-1.5 text-xs">
            <div className="flex gap-2 items-center">
              <span className="font-semibold opacity-75">Value:</span> {attrs.value || 'Unvalued'}
              {attrs.rarity && <span className="opacity-60">• {attrs.rarity}</span>}
            </div>
            {attrs.physicalDescription && <FormattedText content={attrs.physicalDescription} className="opacity-90" />}
            {attrs.contents && (
              <div className="opacity-90">
                <span className="font-semibold opacity-75 block mb-0.5">Contents:</span>
                <FormattedText content={attrs.contents} />
              </div>
            )}
            {attrs.mechanicalProperties && (
              <FormattedText content={attrs.mechanicalProperties} className="opacity-80 italic" />
            )}
            {attrs.lore && <FormattedText content={attrs.lore} className="opacity-80 text-[11px] pt-1" />}
          </div>
        );

      case 'enemy':
        return (
          <div className="space-y-1.5 text-xs">
            <div className="flex gap-3 font-mono text-[11px] font-bold opacity-85">
              <span>CR {attrs.challengeRating || '1'}</span>
              <span>HP {attrs.hitPoints || 10}</span>
              <span>AC {attrs.armorClass || 10}</span>
              <span>{attrs.speed || '30 ft'}</span>
            </div>
            {attrs.actions && (
              <div>
                <span className="font-semibold opacity-75 block mb-0.5">Actions:</span>
                <FormattedText content={attrs.actions} />
              </div>
            )}
            {attrs.tactics && (
              <div>
                <span className="font-semibold opacity-75 block mb-0.5">Tactics:</span>
                <FormattedText content={attrs.tactics} className="opacity-80 italic" />
              </div>
            )}
            {attrs.lore && <FormattedText content={attrs.lore} className="opacity-80 text-[11px] pt-1" />}
          </div>
        );

      case 'location':
      case 'adventure_site':
      case 'area':
        return (
          <div className="space-y-1.5 text-xs">
            {attrs.siteType && (
              <div className="font-semibold opacity-80 uppercase text-[10px] tracking-wider">
                {attrs.siteType}
              </div>
            )}
            {attrs.dimensionsLighting && <FormattedText content={attrs.dimensionsLighting} />}
            {attrs.sensoryBox && (
              <blockquote className="border-l-2 border-current/30 pl-2 italic opacity-85 my-1">
                <FormattedText content={attrs.sensoryBox} />
              </blockquote>
            )}
            {attrs.entranceAccess && (
              <div>
                <span className="font-semibold opacity-75">Access:</span>{' '}
                <FormattedText content={attrs.entranceAccess} />
              </div>
            )}
            {attrs.environmentalHazards && (
              <div className="text-red-600 dark:text-red-400">
                <span className="font-semibold">Hazard:</span>{' '}
                <FormattedText content={attrs.environmentalHazards} />
              </div>
            )}
            {attrs.exitsConnections && (
              <div>
                <span className="font-semibold opacity-75">Exits:</span>{' '}
                <FormattedText content={attrs.exitsConnections} />
              </div>
            )}
          </div>
        );

      case 'region':
        return (
          <div className="space-y-1.5 text-xs">
            {attrs.climateTerrain && (
              <div>
                <span className="font-semibold opacity-75">Biome:</span>{' '}
                <FormattedText content={attrs.climateTerrain} />
              </div>
            )}
            {attrs.factionsPolitics && (
              <div>
                <span className="font-semibold opacity-75">Factions:</span>{' '}
                <FormattedText content={attrs.factionsPolitics} />
              </div>
            )}
            {attrs.travelMechanics && (
              <div>
                <span className="font-semibold opacity-75">Travel:</span>{' '}
                <FormattedText content={attrs.travelMechanics} />
              </div>
            )}
            {attrs.loreHistory && <FormattedText content={attrs.loreHistory} className="opacity-85 pt-1" />}
          </div>
        );

      // Structured Rumor Table Layout (fixes raw JSON display!)
      case 'rumor_list':
        return (
          <div className="space-y-2 text-xs">
            {attrs.diceFormula && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono opacity-80 pb-1 border-b border-current/10">
                <Dice5 className="w-3.5 h-3.5" />
                <span>Roll: {attrs.diceFormula}</span>
              </div>
            )}
            <div className="space-y-1.5">
              {(attrs.entries || []).map((entry: any, idx: number) => {
                const rollVal = Array.isArray(entry.roll) ? entry.roll.join('-') : (entry.roll ?? idx + 1);
                const veracity = entry.veracity || 'True';
                const isDeceptive = veracity.includes('False') || veracity.includes('Deceptive');
                const isPartial = veracity.includes('Partial');

                return (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-black/5 dark:bg-white/5 border border-current/10 flex items-start gap-2"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px] font-bold flex-shrink-0">
                      d6 ({rollVal})
                    </span>
                    <div className="flex-1 min-w-0">
                      <FormattedText
                        content={entry.statement || entry.text || entry.description}
                        className="leading-snug italic"
                      />
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span
                          className={`font-semibold px-1 py-0.2 rounded text-[9px] uppercase ${
                            isDeceptive
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                              : isPartial
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {veracity}
                        </span>
                        {entry.sourceDc && <span className="opacity-70">Source: {entry.sourceDc}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!attrs.entries || attrs.entries.length === 0) && (
                <div className="opacity-50 italic">No rumor entries recorded yet.</div>
              )}
            </div>
          </div>
        );

      // Structured Random Event Table Layout (fixes raw JSON display!)
      case 'random_event_list':
        return (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-mono opacity-80 pb-1 border-b border-current/10">
              <span className="flex items-center gap-1.5">
                <Dice5 className="w-3.5 h-3.5" />
                <span>Roll: {attrs.diceFormula || '1d6'}</span>
              </span>
              {attrs.frequencyTrigger && <span className="text-[10px]">{attrs.frequencyTrigger}</span>}
            </div>
            <div className="space-y-1.5">
              {(attrs.entries || []).map((entry: any, idx: number) => {
                const rollVal = Array.isArray(entry.roll) ? entry.roll.join('-') : (entry.roll ?? idx + 1);
                return (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-black/5 dark:bg-white/5 border border-current/10 flex items-start gap-2"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold flex-shrink-0">
                      [{rollVal}]
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[11px]">{entry.title}</div>
                      <FormattedText content={entry.description} className="opacity-90 leading-snug" />
                    </div>
                  </div>
                );
              })}
              {(!attrs.entries || attrs.entries.length === 0) && (
                <div className="opacity-50 italic">No events in table yet.</div>
              )}
            </div>
          </div>
        );

      // Image Module Layout
      case 'image':
        return (
          <div className="space-y-2 text-xs">
            {attrs.assetUrl ? (
              <div className="overflow-hidden rounded border border-current/20">
                <img
                  src={attrs.assetUrl}
                  alt={attrs.caption || entity.name}
                  className="w-full object-cover max-h-48"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-current/20 rounded p-6 flex flex-col items-center justify-center opacity-60 text-center">
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="font-semibold">Image Asset Placeholder</span>
                <span className="text-[10px]">{attrs.aspectRatio || '1:1'} • {attrs.stylePreset || 'Sketch'}</span>
              </div>
            )}
            {attrs.prompt && (
              <div className="italic text-[11px] opacity-75">
                <span className="font-semibold not-italic">Prompt:</span>{' '}
                <FormattedText content={attrs.prompt} />
              </div>
            )}
            {attrs.caption && (
              <div className="text-center font-serif text-[11px] opacity-80 border-t border-current/10 pt-1">
                <FormattedText content={attrs.caption} />
              </div>
            )}
          </div>
        );

      case 'generic_list': {
        const listItems: string[] = Array.isArray(attrs.items)
          ? attrs.items
          : typeof attrs.items === 'string'
          ? attrs.items.split('\n').filter((s: string) => s.trim().length > 0)
          : [];
        const currentStyle: 'bullet' | 'numbered' = attrs.listStyle === 'numbered' ? 'numbered' : 'bullet';

        const handleToggleListStyle = (e: React.MouseEvent) => {
          e.stopPropagation();
          const nextStyle = currentStyle === 'bullet' ? 'numbered' : 'bullet';
          store.updateEntity(entity.id, {
            attributes: {
              ...attrs,
              listStyle: nextStyle,
            },
          });
        };

        return (
          <div className="space-y-2 text-xs">
            {/* Header controls: Context & List Style toggle */}
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-current/10">
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60 flex items-center gap-1">
                {currentStyle === 'bullet' ? <List className="w-3 h-3" /> : <ListOrdered className="w-3 h-3" />}
                <span>{currentStyle === 'bullet' ? 'Bullet List' : 'Numbered List'}</span>
              </span>

              {/* Interactive Toggle Button: Click to switch between bullets and numbers */}
              <button
                type="button"
                onClick={handleToggleListStyle}
                title={`Switch to ${currentStyle === 'bullet' ? 'Numbered (1. 2. 3.)' : 'Bullet (•)'} style`}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-black/5 dark:bg-white/5 hover:bg-indigo-600 hover:text-white border border-current/10 transition-colors flex items-center gap-1 cursor-pointer no-print"
              >
                {currentStyle === 'bullet' ? (
                  <>
                    <ListOrdered className="w-3 h-3" />
                    <span>To Numbers (1. 2. 3.)</span>
                  </>
                ) : (
                  <>
                    <List className="w-3 h-3" />
                    <span>To Bullets (•)</span>
                  </>
                )}
              </button>
            </div>

            {/* User-explained context */}
            {attrs.context && (
              <div className="opacity-85 text-xs italic leading-relaxed">
                <FormattedText content={attrs.context} />
              </div>
            )}

            {/* List items rendering with toggled style */}
            {listItems.length > 0 ? (
              <FormattedText content={listItems} listStyle={currentStyle} />
            ) : (
              <div className="opacity-40 italic text-[11px]">No items in list yet. Double-click to add items.</div>
            )}
          </div>
        );
      }

      default:
        // Graceful key-value fallback instead of raw JSON dump
        return (
          <div className="space-y-1 text-xs">
            {Object.entries(attrs).map(([key, val]) => {
              if (key === 'customFields' && Object.keys(val || {}).length === 0) return null;
              return (
                <div key={key} className="flex gap-2">
                  <span className="font-semibold capitalize opacity-70 shrink-0">
                    {key.replace(/([A-Z])/g, ' $1')}:
                  </span>
                  <div className="opacity-90 flex-1 min-w-0">
                    {typeof val === 'string' ? (
                      <FormattedText content={val} />
                    ) : (
                      <span className="truncate">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div
      data-entity-card="true"
      onClick={(e) => {
        e.stopPropagation();
        onActivate?.();
      }}
      className={`relative group rounded-md border transition-all duration-150 ${skin.containerClass} w-full cursor-pointer ${
        isActive ? 'ring-2 ring-indigo-500/80 shadow-md' : 'hover:border-neutral-400/40'
      } ${
        isSelected ? 'ring-2 ring-indigo-500 shadow-md print:ring-0 print:shadow-none' : ''
      } ${
        isDragging ? 'opacity-30 border-dashed border-indigo-400 shadow-none' : ''
      } ${isDragOverlay ? 'shadow-2xl ring-2 ring-indigo-500 scale-[1.02] cursor-grabbing select-none' : ''}`}
    >
      {/* Overflow Warning Badge */}
      {isOverflowing && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow no-print">
          <AlertCircle className="w-3 h-3" /> Overflow
        </div>
      )}

      {/* Card Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b rounded-t-md min-h-[40px] ${skin.headerClass}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Drag Handle (shown only when card is active) */}
          {!isDragOverlay && dragHandleProps && isActive && (
            <button
              {...dragHandleProps}
              type="button"
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-neutral-400 hover:text-neutral-200 opacity-60 hover:opacity-100 transition-opacity no-print touch-none focus:outline-none shrink-0"
              title="Drag to rearrange order on page"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Multi-Selection Checkbox for AI Batching (always shown by default) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              store.toggleEntitySelection(entity.id);
            }}
            className="text-neutral-500 hover:text-indigo-600 focus:outline-none no-print shrink-0"
            title={isSelected ? 'Deselect from AI batch' : 'Select for AI batch editing'}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 opacity-50 hover:opacity-100" />
            )}
          </button>

          {/* Entity Icon & Type Badge (shown only when card is active) */}
          {isActive && (
            <span className="opacity-70 shrink-0">{getEntityIcon(entity.entityType)}</span>
          )}

          {/* Editable Name (always shown by default, full width) */}
          {isEditing ? (
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="px-1 py-0.5 text-xs font-semibold bg-white/80 dark:bg-black/60 rounded border border-indigo-400 focus:outline-none flex-1 min-w-0"
            />
          ) : (
            <span
              onClick={(e) => {
                if (isActive) {
                  e.stopPropagation();
                  setIsEditing(true);
                }
              }}
              className={`text-sm truncate cursor-pointer hover:underline flex-1 min-w-0 ${skin.titleClass}`}
              title={isActive ? 'Click to rename' : entity.name}
            >
              {entity.name}
            </span>
          )}

          {/* Synced Clone Instance Badge (shown only when card is active) */}
          {instanceCount > 1 && isActive && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-950/70 text-indigo-300 border border-indigo-700/50 no-print shrink-0 cursor-default"
              title={`Synced clone: This element appears in ${instanceCount} placements across the scenario. Edits stay synchronized in real time.`}
            >
              <Copy className="w-2.5 h-2.5 text-indigo-400" />
              <span>Synced ({instanceCount})</span>
            </span>
          )}
        </div>

        {/* Action Controls - shown only when card is active (clicked) */}
        {isActive && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 no-print shrink-0 ml-2"
          >
          {/* Move / Clone to Page Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMoveMenuOpen(!isMoveMenuOpen)}
              title="Move or Clone to another page"
              className={`p-1 rounded transition-colors ${
                isMoveMenuOpen ? 'bg-indigo-600 text-white opacity-100' : 'hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            {isMoveMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20 cursor-default"
                  onClick={() => setIsMoveMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-30 w-56 bg-[#1b1e24] text-neutral-200 border border-neutral-700 rounded-md shadow-xl py-1 text-xs">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-700/60">
                    Move to Page
                  </div>
                  <div className="max-h-36 overflow-y-auto py-1">
                    {store.pages.map((p) => {
                      const isCurrent = p.id === placement.pageId;
                      return (
                        <button
                          key={p.id}
                          disabled={isCurrent}
                          onClick={() => handleMoveToPage(p.id)}
                          className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between text-xs transition-colors ${
                            isCurrent
                              ? 'opacity-40 cursor-default bg-neutral-800/40 text-neutral-400'
                              : 'hover:bg-indigo-600 hover:text-white text-neutral-200 cursor-pointer'
                          }`}
                        >
                          <span className="truncate">
                            Page {p.pageNumber}: {p.title || 'Untitled'}
                          </span>
                          {isCurrent && <span className="text-[10px] ml-1 font-mono">(current)</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-neutral-700/60 pt-1 mt-1 px-1">
                    <button
                      onClick={handleMoveToNewPage}
                      className="w-full text-left px-2 py-1.5 rounded flex items-center gap-1.5 text-xs text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Move to New Page</span>
                    </button>
                  </div>

                  {/* Clone to Page (Synced) */}
                  <div className="border-t border-neutral-700/60 pt-1 mt-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      Clone to Page (Synced)
                    </div>
                    <div className="max-h-36 overflow-y-auto py-0.5">
                      {store.pages.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            handleClone(p.id);
                            setIsMoveMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 flex items-center justify-between text-xs hover:bg-indigo-600 hover:text-white text-neutral-200 cursor-pointer"
                        >
                          <span className="truncate">
                            Page {p.pageNumber}: {p.title || 'Untitled'}
                          </span>
                          <span className="text-[10px] text-indigo-400 font-mono">+Clone</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Edit Element Details */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            title="Edit element attributes and details"
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Quick Reorder Up / Down */}
          {onMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={isFirst}
              title={isFirst ? 'Already at the top' : 'Move card up'}
              className={`p-1 rounded transition-colors ${
                isFirst
                  ? 'opacity-20 cursor-not-allowed text-neutral-500'
                  : 'hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-200 cursor-pointer'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={isLast}
              title={isLast ? 'Already at the bottom' : 'Move card down'}
              className={`p-1 rounded transition-colors ${
                isLast
                  ? 'opacity-20 cursor-not-allowed text-neutral-500'
                  : 'hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-200 cursor-pointer'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Switch Column (Col 1 <-> Col 2) when in 2-column mode */}
          {onToggleColumn && placement.columnSpan === 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleColumn();
              }}
              title={
                currentColumn === 0
                  ? 'Currently in Left Column (Click to move to Right Column)'
                  : 'Currently in Right Column (Click to move to Left Column)'
              }
              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/5 dark:bg-white/5 hover:bg-indigo-600 hover:text-white text-neutral-600 dark:text-neutral-300 border border-current/10 transition-colors cursor-pointer"
            >
              {currentColumn === 0 ? 'Col 1 →' : '← Col 2'}
            </button>
          )}

          <button
            onClick={handleToggleColSpan}
            title={placement.columnSpan === 1 ? 'Expand to 2 columns (Full Width)' : 'Shrink to 1 column'}
            className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${
              placement.columnSpan === 2 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
          {/* Clone element (Synced instance - updates across all pages) */}
          <button
            onClick={() => handleClone()}
            title="Clone element (Creates a synced instance on this page - stays in sync)"
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggleCollapse}
            title={isExpanded ? 'Collapse card' : 'Expand card'}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDelete}
            title="Remove from page"
            className="p-1 rounded hover:bg-red-500/20 text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>

      {/* Card Body */}
      {isExpanded && (
        <div
          onDoubleClick={() => setIsEditModalOpen(true)}
          title="Double-click to edit details"
          className={`p-3 cursor-pointer ${skin.bodyClass}`}
        >
          {renderAttributeSummary()}
        </div>
      )}

      {/* Full Element Editor Modal */}
      <EditEntityModal
        entityId={entity.id}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
