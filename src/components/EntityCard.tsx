'use client';

import React, { useState } from 'react';
import { Entity } from '@/domain/entities';
import { Placement, useScenarioStore } from '@/store/scenarioStore';
import { THEME_SKINS, ThemeSkin, getEntityIcon } from './themeSkin';
import {
  CheckSquare,
  Square,
  Copy,
  Trash2,
  Maximize2,
  Minimize2,
  Columns2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Edit3,
} from 'lucide-react';

interface EntityCardProps {
  placement: Placement;
  entity: Entity;
  pageSkin: ThemeSkin;
  isOverflowing?: boolean;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  placement,
  entity,
  pageSkin,
  isOverflowing = false,
}) => {
  const store = useScenarioStore();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(entity.name);
  const [isExpanded, setIsExpanded] = useState(!placement.styleOverrides.isCollapsed);

  const isSelected = store.selectedEntityIds.includes(entity.id);
  const skin = THEME_SKINS[placement.styleOverrides.themeSkin || pageSkin];

  const handleToggleColSpan = () => {
    store.updatePlacement(placement.pageId, placement.id, {
      columnSpan: placement.columnSpan === 1 ? 2 : 1,
    });
  };

  const handleFork = () => {
    store.forkPlacement(placement.pageId, placement.id);
  };

  const handleDelete = () => {
    store.removePlacement(placement.pageId, placement.id);
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

  // Render type-specific attributes summary
  const renderAttributeSummary = () => {
    const a = entity.attributes || {};
    switch (entity.entityType) {
      case 'npc':
        return (
          <div className="space-y-1.5 text-xs">
            <div className="flex gap-2">
              <span className="font-semibold opacity-75">Role:</span>
              <span>{a.role || 'Unspecified'}</span>
            </div>
            {a.demeanor && (
              <div className="flex gap-2">
                <span className="font-semibold opacity-75">Demeanor:</span>
                <span className="italic">{a.demeanor}</span>
              </div>
            )}
            {a.lore && <p className="opacity-90 leading-relaxed pt-1">{a.lore}</p>}
            {(a.hitPoints || a.armorClass) && (
              <div className="flex gap-4 pt-1 font-mono text-[11px] opacity-80 border-t border-current/10">
                {a.hitPoints && <span>HP: {a.hitPoints}</span>}
                {a.armorClass && <span>AC: {a.armorClass}</span>}
              </div>
            )}
          </div>
        );

      case 'trap':
        return (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                DC {a.detectionDc} Detection
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
                DC {a.disarmDc} Disarm
              </span>
            </div>
            <div>
              <span className="font-semibold opacity-75">Trigger:</span> {a.trigger}
            </div>
            {a.effect && (
              <p className="opacity-90 leading-relaxed">
                <span className="font-semibold opacity-75">Effect:</span> {a.effect}
              </p>
            )}
          </div>
        );

      case 'item':
      case 'treasure':
        return (
          <div className="space-y-1.5 text-xs">
            <div className="flex gap-2 items-center">
              <span className="font-semibold opacity-75">Value:</span> {a.value}
              {a.rarity && <span className="opacity-60">• {a.rarity}</span>}
            </div>
            {a.physicalDescription && <p className="opacity-90">{a.physicalDescription}</p>}
            {a.mechanicalProperties && (
              <p className="opacity-80 italic">{a.mechanicalProperties}</p>
            )}
          </div>
        );

      case 'enemy':
        return (
          <div className="space-y-1.5 text-xs">
            <div className="flex gap-3 font-mono text-[11px] font-bold opacity-85">
              <span>CR {a.challengeRating}</span>
              <span>HP {a.hitPoints}</span>
              <span>AC {a.armorClass}</span>
              <span>{a.speed}</span>
            </div>
            {a.actions && (
              <div>
                <span className="font-semibold opacity-75">Actions:</span> {a.actions}
              </div>
            )}
            {a.tactics && <p className="opacity-80 italic">{a.tactics}</p>}
          </div>
        );

      case 'location':
      case 'adventure_site':
      case 'area':
        return (
          <div className="space-y-1.5 text-xs">
            {a.dimensionsLighting && <div>{a.dimensionsLighting}</div>}
            {a.sensoryBox && (
              <blockquote className="border-l-2 border-current/30 pl-2 italic opacity-85">
                "{a.sensoryBox}"
              </blockquote>
            )}
            {a.hazards && (
              <div className="text-red-600 dark:text-red-400">
                <span className="font-semibold">Hazard:</span> {a.hazards}
              </div>
            )}
            {a.exitsConnections && <div>Exits: {a.exitsConnections}</div>}
          </div>
        );

      default:
        return (
          <div className="text-xs opacity-80 whitespace-pre-wrap">
            {JSON.stringify(a, null, 2).slice(0, 200)}
          </div>
        );
    }
  };

  return (
    <div
      className={`relative group rounded-md border transition-all duration-150 ${skin.containerClass} ${
        placement.columnSpan === 2 ? 'col-span-full' : 'col-span-1'
      } ${isSelected ? 'ring-2 ring-indigo-500 shadow-md' : ''}`}
    >
      {/* Overflow Warning Badge */}
      {isOverflowing && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
          <AlertCircle className="w-3 h-3" /> Overflow
        </div>
      )}

      {/* Card Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b rounded-t-md ${skin.headerClass}`}>
        <div className="flex items-center gap-2 min-w-0">
          {/* Multi-Selection Checkbox for AI Batching */}
          <button
            onClick={() => store.toggleEntitySelection(entity.id)}
            className="text-neutral-500 hover:text-indigo-600 focus:outline-none"
            title={isSelected ? 'Deselect from AI batch' : 'Select for AI batch editing'}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 opacity-50 hover:opacity-100" />
            )}
          </button>

          {/* Entity Icon & Type Badge */}
          <span className="opacity-70">{getEntityIcon(entity.entityType)}</span>

          {/* Editable Name */}
          {isEditing ? (
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              autoFocus
              className="px-1 py-0.5 text-xs font-semibold bg-white/80 dark:bg-black/60 rounded border border-indigo-400 focus:outline-none"
            />
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              className={`text-sm truncate cursor-pointer hover:underline ${skin.titleClass}`}
              title="Click to rename"
            >
              {entity.name}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity no-print">
          <button
            onClick={handleToggleColSpan}
            title={placement.columnSpan === 1 ? 'Expand to 2 columns' : 'Shrink to 1 column'}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFork}
            title="Fork / Detach into independent copy"
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
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
      </div>

      {/* Card Body */}
      {isExpanded && (
        <div className={`p-3 ${skin.bodyClass}`}>
          {renderAttributeSummary()}
        </div>
      )}
    </div>
  );
};
