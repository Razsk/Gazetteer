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
  Columns2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Dice5,
  MessageSquareQuote,
  ShieldAlert,
  Image as ImageIcon,
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
                <span className="font-semibold opacity-75">Demeanor:</span>
                <span className="italic">{attrs.demeanor}</span>
              </div>
            )}
            {attrs.motivation && (
              <div className="flex gap-2">
                <span className="font-semibold opacity-75">Motivation:</span>
                <span>{attrs.motivation}</span>
              </div>
            )}
            {attrs.lore && <p className="opacity-90 leading-relaxed pt-1">{attrs.lore}</p>}
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
              <span className="font-semibold opacity-75">Trigger:</span> {attrs.trigger || 'Pressure mechanism'}
            </div>
            {attrs.effect && (
              <p className="opacity-90 leading-relaxed">
                <span className="font-semibold opacity-75">Effect:</span> {attrs.effect}
              </p>
            )}
            {attrs.resetConditions && (
              <div className="text-[11px] opacity-75">
                <span className="font-semibold">Reset:</span> {attrs.resetConditions}
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
            {attrs.physicalDescription && <p className="opacity-90">{attrs.physicalDescription}</p>}
            {attrs.contents && (
              <div className="opacity-90">
                <span className="font-semibold opacity-75">Contents:</span> {attrs.contents}
              </div>
            )}
            {attrs.mechanicalProperties && (
              <p className="opacity-80 italic">{attrs.mechanicalProperties}</p>
            )}
            {attrs.lore && <p className="opacity-80 text-[11px] pt-1">{attrs.lore}</p>}
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
                <span className="font-semibold opacity-75">Actions:</span> {attrs.actions}
              </div>
            )}
            {attrs.tactics && <p className="opacity-80 italic">{attrs.tactics}</p>}
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
            {attrs.dimensionsLighting && <div>{attrs.dimensionsLighting}</div>}
            {attrs.sensoryBox && (
              <blockquote className="border-l-2 border-current/30 pl-2 italic opacity-85 my-1">
                "{attrs.sensoryBox}"
              </blockquote>
            )}
            {attrs.entranceAccess && (
              <div>
                <span className="font-semibold opacity-75">Access:</span> {attrs.entranceAccess}
              </div>
            )}
            {attrs.environmentalHazards && (
              <div className="text-red-600 dark:text-red-400">
                <span className="font-semibold">Hazard:</span> {attrs.environmentalHazards}
              </div>
            )}
            {attrs.exitsConnections && <div>Exits: {attrs.exitsConnections}</div>}
          </div>
        );

      case 'region':
        return (
          <div className="space-y-1.5 text-xs">
            {attrs.climateTerrain && (
              <div>
                <span className="font-semibold opacity-75">Biome:</span> {attrs.climateTerrain}
              </div>
            )}
            {attrs.factionsPolitics && (
              <div>
                <span className="font-semibold opacity-75">Factions:</span> {attrs.factionsPolitics}
              </div>
            )}
            {attrs.travelMechanics && (
              <div>
                <span className="font-semibold opacity-75">Travel:</span> {attrs.travelMechanics}
              </div>
            )}
            {attrs.loreHistory && <p className="opacity-85 pt-1">{attrs.loreHistory}</p>}
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
                      <p className="leading-snug italic">"{entry.statement || entry.text || entry.description}"</p>
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
                      <p className="opacity-90 leading-snug">{entry.description}</p>
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
              <p className="italic text-[11px] opacity-75">
                <span className="font-semibold not-italic">Prompt:</span> {attrs.prompt}
              </p>
            )}
            {attrs.caption && (
              <div className="text-center font-serif text-[11px] opacity-80 border-t border-current/10 pt-1">
                {attrs.caption}
              </div>
            )}
          </div>
        );

      default:
        // Graceful key-value fallback instead of raw JSON dump
        return (
          <div className="space-y-1 text-xs">
            {Object.entries(attrs).map(([key, val]) => {
              if (key === 'customFields' && Object.keys(val || {}).length === 0) return null;
              return (
                <div key={key} className="flex gap-2">
                  <span className="font-semibold capitalize opacity-70">
                    {key.replace(/([A-Z])/g, ' $1')}:
                  </span>
                  <span className="opacity-90 truncate">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              );
            })}
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
