'use client';

import React, { useState } from 'react';
import { useScenarioStore } from '@/store/scenarioStore';
import { ThemeSkin } from './themeSkin';
import {
  BookPlus,
  X,
  Sparkles,
  Download,
  AlertTriangle,
  Layout,
  Columns2,
  FileText,
  Shield,
  Palette,
  Check,
  Compass,
} from 'lucide-react';

interface NewScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_RULESETS = [
  'D&D 5e',
  'Pathfinder 2e',
  'Shadowdark',
  'Grimwild',
  'MÖRK BORG',
  'Call of Cthulhu',
  'Old School Essentials',
  'Mothership',
  'System Agnostic',
];

const SUGGESTED_THEMES = [
  'Grimdark Swamp',
  'Ancient Sunken Crypt',
  'Eldritch Cosmic Horror',
  'High Fantasy Citadel',
  'Cyberpunk Megacity',
  'Haunted Frozen Wastes',
  'Underdark Caverns',
];

const THEME_SKIN_OPTIONS: {
  id: ThemeSkin;
  name: string;
  desc: string;
  badgeBg: string;
  previewClass: string;
}[] = [
  {
    id: 'parchment',
    name: 'Parchment Fantasy',
    desc: 'Warm aged paper with classic RPG serif accents',
    badgeBg: 'bg-[#d8c39d]/20 text-[#a37c44] border-[#d8c39d]/40',
    previewClass: 'bg-[#f8f4e6] text-[#2c1d11] border-[#dfcfb0]',
  },
  {
    id: 'gothic',
    name: 'Gothic Horror',
    desc: 'Ominous dark slate with crimson bloodline trims',
    badgeBg: 'bg-red-950/40 text-red-400 border-red-900/40',
    previewClass: 'bg-[#15161a] text-neutral-200 border-[#31333a]',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk HUD',
    desc: 'Deep terminal black with neon cyan and yellow telemetry',
    badgeBg: 'bg-cyan-950/40 text-cyan-400 border-cyan-800/40',
    previewClass: 'bg-[#080b11] text-[#00f3ff] border-[#00f3ff]/30',
  },
  {
    id: 'minimalist',
    name: 'Clean Minimalist',
    desc: 'Crisp white paper with modern monochrome borders',
    badgeBg: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    previewClass: 'bg-white text-neutral-900 border-neutral-300',
  },
];

export const NewScenarioModal: React.FC<NewScenarioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const store = useScenarioStore();

  const [title, setTitle] = useState('');
  const [initialPageTitle, setInitialPageTitle] = useState('Overview & Entry');
  const [ruleset, setRuleset] = useState('D&D 5e');
  const [theme, setTheme] = useState('Grimdark Swamp');
  const [targetPartyLevel, setTargetPartyLevel] = useState(3);
  const [defaultThemeSkin, setDefaultThemeSkin] = useState<ThemeSkin>('parchment');
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [columnCount, setColumnCount] = useState<1 | 2>(2);
  const [starterOption, setStarterOption] = useState<'blank' | 'sample'>('blank');

  if (!isOpen) return null;

  const currentEntityCount = Object.keys(store.entities).length;

  const handleDownloadBackup = () => {
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
    link.download = `${safeTitle || 'scenario'}-backup.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    store.createNewScenario({
      title: title.trim() || 'Untitled Adventure',
      ruleset,
      theme,
      targetPartyLevel,
      defaultThemeSkin,
      pageSize,
      columnCount,
      initialPageTitle: initialPageTitle.trim() || 'Page 1 - Overview',
      seedSampleContent: starterOption === 'sample',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#14161c] border border-neutral-700/80 rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-[#191b22]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/70 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>New Scenario</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/40">
                  Settings
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Configure your adventure ruleset, atmosphere, and visual layout spread.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Warning banner if current scenario contains active entities */}
          {currentEntityCount > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-800/40 flex items-start justify-between gap-3 text-amber-200/90">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs text-amber-300">
                    Existing Scenario in Workspace ({currentEntityCount} elements)
                  </p>
                  <p className="text-[11px] text-amber-200/70 mt-0.5">
                    Creating a new scenario will initialize a fresh workspace. Download a backup first if you want to keep your current progress.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 text-amber-200 text-[11px] font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Backup</span>
              </button>
            </div>
          )}

          {/* Section 1: Scenario Identification */}
          <div className="space-y-3.5">
            <h3 className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-neutral-400">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Adventure Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Scenario Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Whispers of the Sunken Crypt"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 focus:border-indigo-500 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Initial Page 1 Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Overview & Entry Grounds"
                  value={initialPageTitle}
                  onChange={(e) => setInitialPageTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 focus:border-indigo-500 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Game System & Ruleset */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-neutral-400">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ruleset & System</span>
              </h3>
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_RULESETS.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRuleset(r)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer border ${
                    ruleset === r
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                placeholder="Or specify custom ruleset / homebrew..."
                value={ruleset}
                onChange={(e) => setRuleset(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 focus:border-indigo-500 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Setting & Atmosphere */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-neutral-400">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Theme & Challenge</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-neutral-300 font-medium mb-1">
                  Setting / Atmosphere
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grimdark Swamp, Flooded Catacombs"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 focus:border-indigo-500 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none mb-1.5"
                />
                <div className="flex flex-wrap gap-1">
                  {SUGGESTED_THEMES.slice(0, 4).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setTheme(t)}
                      className="text-[10px] px-2 py-0.5 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 cursor-pointer"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Target Party Level
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={targetPartyLevel}
                  onChange={(e) => setTargetPartyLevel(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 focus:border-indigo-500 rounded-lg text-neutral-100 focus:outline-none"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  {targetPartyLevel <= 4
                    ? 'Tier 1: Local Heroes'
                    : targetPartyLevel <= 10
                    ? 'Tier 2: Heroes of Realm'
                    : targetPartyLevel <= 16
                    ? 'Tier 3: Masters of Realm'
                    : 'Tier 4: Masters of the World'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Visual Theme Skin Preset */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-neutral-400">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span>Visual Theme Skin</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEME_SKIN_OPTIONS.map((skin) => {
                const isSelected = defaultThemeSkin === skin.id;
                return (
                  <button
                    type="button"
                    key={skin.id}
                    onClick={() => setDefaultThemeSkin(skin.id)}
                    className={`text-left p-3 rounded-lg border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-neutral-850 border-indigo-500 ring-2 ring-indigo-500/40 shadow-md'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-neutral-100">{skin.name}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-1">{skin.desc}</p>
                    <div className={`mt-2 h-6 rounded border px-2 flex items-center text-[10px] font-medium ${skin.previewClass}`}>
                      Sample Card Preview
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Layout & Starter Options */}
          <div className="space-y-3 pt-1 border-t border-neutral-800/80">
            <h3 className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-neutral-400 pt-2">
              <Layout className="w-3.5 h-3.5 text-indigo-400" />
              <span>Canvas Spread & Starters</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Page Format</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as 'A4' | 'Letter')}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none cursor-pointer"
                >
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="Letter">US Letter (8.5 × 11 in)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Default Grid</label>
                <select
                  value={columnCount}
                  onChange={(e) => setColumnCount(Number(e.target.value) as 1 | 2)}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none cursor-pointer"
                >
                  <option value={2}>2 Columns (Standard Gazette)</option>
                  <option value={1}>1 Column (Single Flow)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Starter Content</label>
                <select
                  value={starterOption}
                  onChange={(e) => setStarterOption(e.target.value as 'blank' | 'sample')}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none cursor-pointer"
                >
                  <option value="blank">Blank Slate (Clean Canvas)</option>
                  <option value="sample">Seed Sample Elements</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Scenario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
