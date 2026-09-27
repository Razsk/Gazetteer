'use client';

import React, { useState, useEffect } from 'react';
import { Entity } from '@/domain/entities';
import { useScenarioStore } from '@/store/scenarioStore';
import { getEntityIcon } from './themeSkin';
import {
  X,
  Check,
  Code2,
  Sliders,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  List,
  ListOrdered,
} from 'lucide-react';

interface EditEntityModalProps {
  entityId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditEntityModal: React.FC<EditEntityModalProps> = ({
  entityId,
  isOpen,
  onClose,
}) => {
  const store = useScenarioStore();
  const entity = entityId ? store.entities[entityId] : null;

  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [name, setName] = useState('');
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [jsonString, setJsonString] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync state whenever entity changes or modal opens
  useEffect(() => {
    if (entity) {
      setName(entity.name);
      const attrs = JSON.parse(JSON.stringify(entity.attributes || {}));
      setAttributes(attrs);
      setJsonString(JSON.stringify(attrs, null, 2));
      setJsonError(null);
    }
  }, [entityId, isOpen, entity]);

  if (!isOpen || !entity) return null;

  const handleAttrChange = (key: string, value: any) => {
    const updated = { ...attributes, [key]: value };
    setAttributes(updated);
    setJsonString(JSON.stringify(updated, null, 2));
    setJsonError(null);
  };

  const handleJsonChange = (raw: string) => {
    setJsonString(raw);
    try {
      const parsed = JSON.parse(raw);
      setAttributes(parsed);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON syntax');
    }
  };

  const handleSave = () => {
    if (jsonError) {
      setActiveTab('json');
      return;
    }

    if (!name.trim()) {
      alert('Element name cannot be empty.');
      return;
    }

    store.updateEntity(entity.id, {
      name: name.trim(),
      attributes,
    });
    onClose();
  };

  // Helper sub-renderers for type-specific forms
  const renderFormFields = () => {
    switch (entity.entityType) {
      case 'npc':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Role / Profession</label>
                <input
                  type="text"
                  value={attributes.role || ''}
                  onChange={(e) => handleAttrChange('role', e.target.value)}
                  placeholder="e.g. Village Herbalist, Guildmaster"
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Demeanor / Attitude</label>
                <input
                  type="text"
                  value={attributes.demeanor || ''}
                  onChange={(e) => handleAttrChange('demeanor', e.target.value)}
                  placeholder="e.g. Nervous, suspicious, boisterous"
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Motivation / Goal</label>
              <input
                type="text"
                value={attributes.motivation || ''}
                onChange={(e) => handleAttrChange('motivation', e.target.value)}
                placeholder="What drives this character?"
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Lore & Background</label>
              <textarea
                rows={3}
                value={attributes.lore || ''}
                onChange={(e) => handleAttrChange('lore', e.target.value)}
                placeholder="History, secrets, relationships..."
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Hit Points (HP)</label>
                <input
                  type="number"
                  value={attributes.hitPoints ?? ''}
                  onChange={(e) => handleAttrChange('hitPoints', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Armor Class (AC)</label>
                <input
                  type="number"
                  value={attributes.armorClass ?? ''}
                  onChange={(e) => handleAttrChange('armorClass', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        );

      case 'enemy':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Creature Type</label>
                <input
                  type="text"
                  value={attributes.creatureType || ''}
                  onChange={(e) => handleAttrChange('creatureType', e.target.value)}
                  placeholder="e.g. Undead, Fiend, Beast"
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Challenge Rating (CR)</label>
                <input
                  type="text"
                  value={attributes.challengeRating || ''}
                  onChange={(e) => handleAttrChange('challengeRating', e.target.value)}
                  placeholder="e.g. 1/2, 3, 5"
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Hit Points (HP)</label>
                <input
                  type="number"
                  value={attributes.hitPoints ?? 10}
                  onChange={(e) => handleAttrChange('hitPoints', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Armor Class (AC)</label>
                <input
                  type="number"
                  value={attributes.armorClass ?? 10}
                  onChange={(e) => handleAttrChange('armorClass', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Speed</label>
                <input
                  type="text"
                  value={attributes.speed || '30 ft'}
                  onChange={(e) => handleAttrChange('speed', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Actions & Attacks</label>
              <textarea
                rows={3}
                value={attributes.actions || ''}
                onChange={(e) => handleAttrChange('actions', e.target.value)}
                placeholder="Multiattack, Claws: +4 to hit, 2d6+2 slashing..."
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Combat Tactics</label>
              <textarea
                rows={2}
                value={attributes.tactics || ''}
                onChange={(e) => handleAttrChange('tactics', e.target.value)}
                placeholder="Ambush from shadows, target spellcasters first..."
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        );

      case 'trap':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Trigger Condition</label>
              <input
                type="text"
                value={attributes.trigger || ''}
                onChange={(e) => handleAttrChange('trigger', e.target.value)}
                placeholder="e.g. Tripping a submerged wire, stepping on pressure plate"
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Detection DC</label>
                <input
                  type="number"
                  value={attributes.detectionDc ?? 12}
                  onChange={(e) => handleAttrChange('detectionDc', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Disarm DC</label>
                <input
                  type="number"
                  value={attributes.disarmDc ?? 12}
                  onChange={(e) => handleAttrChange('disarmDc', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Trap Effect / Damage</label>
              <textarea
                rows={2}
                value={attributes.effect || ''}
                onChange={(e) => handleAttrChange('effect', e.target.value)}
                placeholder="e.g. 2d10 piercing damage and DC 13 Con save or poisoned for 1 hour."
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Reset Conditions</label>
              <input
                type="text"
                value={attributes.resetConditions || ''}
                onChange={(e) => handleAttrChange('resetConditions', e.target.value)}
                placeholder="e.g. Automatic after 1 round, or manual winch"
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        );

      case 'item':
      case 'treasure':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Value</label>
                <input
                  type="text"
                  value={attributes.value || ''}
                  onChange={(e) => handleAttrChange('value', e.target.value)}
                  placeholder="e.g. 250 gp"
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Rarity</label>
                <input
                  type="text"
                  value={attributes.rarity || ''}
                  onChange={(e) => handleAttrChange('rarity', e.target.value)}
                  placeholder="e.g. Common, Rare, Legendary"
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                {entity.entityType === 'treasure' ? 'Contents / Items Cache' : 'Physical Description'}
              </label>
              <textarea
                rows={2}
                value={entity.entityType === 'treasure' ? attributes.contents || '' : attributes.physicalDescription || ''}
                onChange={(e) =>
                  handleAttrChange(
                    entity.entityType === 'treasure' ? 'contents' : 'physicalDescription',
                    e.target.value
                  )
                }
                placeholder="Appearance, materials, tactile feel..."
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                {entity.entityType === 'treasure' ? 'Hidden / Access Condition' : 'Mechanical Properties'}
              </label>
              <textarea
                rows={2}
                value={entity.entityType === 'treasure' ? attributes.hiddenCondition || '' : attributes.mechanicalProperties || ''}
                onChange={(e) =>
                  handleAttrChange(
                    entity.entityType === 'treasure' ? 'hiddenCondition' : 'mechanicalProperties',
                    e.target.value
                  )
                }
                placeholder={
                  entity.entityType === 'treasure'
                    ? 'e.g. Locked iron chest (DC 14 Thieves Tools), buried under rubble'
                    : 'e.g. +1 bonus to attack rolls, grants darkvision 30ft'
                }
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Lore / History</label>
              <textarea
                rows={2}
                value={attributes.lore || ''}
                onChange={(e) => handleAttrChange('lore', e.target.value)}
                placeholder="Origin, previous owners, mythical properties..."
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        );

      case 'adventure_site':
      case 'area':
      case 'location':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Type / Classification</label>
                <input
                  type="text"
                  value={attributes.siteType || attributes.environmentType || ''}
                  onChange={(e) =>
                    handleAttrChange(
                      attributes.siteType !== undefined ? 'siteType' : 'environmentType',
                      e.target.value
                    )
                  }
                  placeholder="e.g. Crypt, Stronghold, Chamber"
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Dimensions & Lighting</label>
                <input
                  type="text"
                  value={attributes.dimensionsLighting || ''}
                  onChange={(e) => handleAttrChange('dimensionsLighting', e.target.value)}
                  placeholder="e.g. 40ft x 60ft, pitch black, vaulted ceiling"
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Sensory Box / Read-Aloud Text</label>
              <textarea
                rows={3}
                value={attributes.sensoryBox || ''}
                onChange={(e) => handleAttrChange('sensoryBox', e.target.value)}
                placeholder="What players see, smell, hear as they enter..."
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500 italic"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Environmental Hazards</label>
              <input
                type="text"
                value={attributes.environmentalHazards || attributes.hazards || ''}
                onChange={(e) =>
                  handleAttrChange(
                    attributes.environmentalHazards !== undefined ? 'environmentalHazards' : 'hazards',
                    e.target.value
                  )
                }
                placeholder="e.g. Toxic spores, slippery ice, flooded floor"
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Exits & Connections</label>
              <input
                type="text"
                value={attributes.exitsConnections || attributes.entranceAccess || ''}
                onChange={(e) =>
                  handleAttrChange(
                    attributes.exitsConnections !== undefined ? 'exitsConnections' : 'entranceAccess',
                    e.target.value
                  )
                }
                placeholder="e.g. North archway to catacombs, hidden door in east wall"
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        );

      case 'rumor_list':
        const entries = attributes.entries || [];
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Dice Formula</label>
              <input
                type="text"
                value={attributes.diceFormula || '1d6'}
                onChange={(e) => handleAttrChange('diceFormula', e.target.value)}
                className="w-32 px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 font-mono"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Rumors Table ({entries.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newEntries = [
                      ...entries,
                      {
                        roll: entries.length + 1,
                        statement: 'A mysterious rumor heard in the tavern...',
                        veracity: 'True',
                        sourceDc: 'DC 10',
                      },
                    ];
                    handleAttrChange('entries', newEntries);
                  }}
                  className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Rumor
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {entries.map((item: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-400">#{item.roll || idx + 1}</span>
                        <select
                          value={item.veracity || 'True'}
                          onChange={(e) => {
                            const copy = [...entries];
                            copy[idx] = { ...copy[idx], veracity: e.target.value };
                            handleAttrChange('entries', copy);
                          }}
                          className="bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-[11px] text-neutral-200"
                        >
                          <option value="True">True</option>
                          <option value="Partially True">Partially True</option>
                          <option value="False/Deceptive">False/Deceptive</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const copy = entries.filter((_: any, i: number) => i !== idx);
                          handleAttrChange('entries', copy);
                        }}
                        className="text-neutral-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={item.statement || item.text || ''}
                      onChange={(e) => {
                        const copy = [...entries];
                        copy[idx] = { ...copy[idx], statement: e.target.value };
                        handleAttrChange('entries', copy);
                      }}
                      placeholder="Rumor statement..."
                      className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Image Asset URL</label>
              <input
                type="text"
                value={attributes.assetUrl || ''}
                onChange={(e) => handleAttrChange('assetUrl', e.target.value)}
                placeholder="https://... (or leave empty for placeholder)"
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Caption / Subtitle</label>
              <input
                type="text"
                value={attributes.caption || ''}
                onChange={(e) => handleAttrChange('caption', e.target.value)}
                placeholder="e.g. Map of the Sunken Catacombs"
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Generation Prompt</label>
              <textarea
                rows={2}
                value={attributes.prompt || ''}
                onChange={(e) => handleAttrChange('prompt', e.target.value)}
                placeholder="Atmospheric dark fantasy illustration..."
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        );

      case 'generic_list': {
        const items = Array.isArray(attributes.items) ? attributes.items : [];
        const listStyle = attributes.listStyle || 'bullet';

        return (
          <div className="space-y-4">
            {/* Context explanation field */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Context & Explanation (Describe what this list represents)
              </label>
              <textarea
                rows={3}
                value={attributes.context || ''}
                onChange={(e) => handleAttrChange('context', e.target.value)}
                placeholder="Explain what this list represents (e.g. Clues found in the study, Ritual components, Merchant inventory, Rumors heard at the docks...)"
                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Use this context to set the scene, outline rules, or explain how players interact with this list.
              </span>
            </div>

            {/* Toggle bullet and numbers */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                List Display Style
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAttrChange('listStyle', 'bullet')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    listStyle === 'bullet'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Bullet List (•)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAttrChange('listStyle', 'numbered')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    listStyle === 'numbered'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Numbered List (1. 2. 3.)</span>
                </button>
              </div>
            </div>

            {/* List items editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  List Items ({items.length})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    handleAttrChange('items', [...items, '']);
                  }}
                  className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {items.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs font-mono font-bold text-neutral-500 shrink-0">
                      {listStyle === 'numbered' ? `${idx + 1}.` : '•'}
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx] = e.target.value;
                        handleAttrChange('items', copy);
                      }}
                      placeholder={`Item #${idx + 1}...`}
                      className="flex-1 px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = items.filter((_: unknown, i: number) => i !== idx);
                        handleAttrChange('items', copy);
                      }}
                      className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="p-4 border border-dashed border-neutral-800 rounded text-center text-xs text-neutral-500">
                    No items yet. Click &ldquo;Add Item&rdquo; above to start adding elements.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      default:
        // Generic form for arbitrary custom entity types
        return (
          <div className="space-y-3">
            <p className="text-xs text-neutral-400">
              Editing attributes for <span className="font-semibold text-neutral-200">{entity.entityType}</span>. You can edit key properties below or use the JSON tab for full schema control.
            </p>
            {Object.entries(attributes).map(([key, val]) => {
              if (key === 'customFields') return null;
              return (
                <div key={key}>
                  <label className="block text-xs font-semibold text-neutral-400 capitalize mb-1">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </label>
                  {typeof val === 'string' && val.length > 50 ? (
                    <textarea
                      rows={2}
                      value={val}
                      onChange={(e) => handleAttrChange(key, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <input
                      type={typeof val === 'number' ? 'number' : 'text'}
                      value={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                      onChange={(e) =>
                        handleAttrChange(
                          key,
                          typeof val === 'number' ? Number(e.target.value) : e.target.value
                        )
                      }
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-neutral-700 text-neutral-100 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#1e2028]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-indigo-400">
              {getEntityIcon(entity.entityType, 'w-4 h-4')}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-neutral-100 truncate">
                Edit Element: {entity.name}
              </h2>
              <span className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider">
                Type: {entity.entityType.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 px-6 bg-[#15171d] text-xs font-medium">
          <button
            onClick={() => setActiveTab('form')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Structured Form
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'json'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> Raw JSON Schema
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Universal Name Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
              Element Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kaelen the Herbalist, Pit Trap..."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {activeTab === 'form' ? (
            <div className="pt-2">{renderFormFields()}</div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Attributes JSON (Direct homebrew / schema control)
              </label>
              <textarea
                rows={12}
                value={jsonString}
                onChange={(e) => handleJsonChange(e.target.value)}
                className={`w-full px-3 py-2 bg-neutral-950 font-mono text-xs text-neutral-200 rounded-lg border focus:outline-none ${
                  jsonError ? 'border-red-500 focus:border-red-500' : 'border-neutral-700 focus:border-indigo-500'
                }`}
              />
              {jsonError && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {jsonError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-800 bg-[#1e2028]">
          <span className="text-[11px] text-neutral-400">
            Updates will reflect across all pages referencing this entity.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={Boolean(jsonError)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-semibold shadow transition-all cursor-pointer ${
                jsonError
                  ? 'bg-neutral-700 opacity-50 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
