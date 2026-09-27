'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useScenarioStore } from '@/store/scenarioStore';
import { createDefaultEntity } from '@/domain/entities';
import { ScenarioSidebar } from '@/components/ScenarioSidebar';
import { PageCanvas } from '@/components/PageCanvas';
import { AiBatchModal } from '@/components/AiBatchModal';
import { AiGeneratePageModal } from '@/components/AiGeneratePageModal';
import { NewScenarioModal } from '@/components/NewScenarioModal';
import { ExportPdfModal } from '@/components/ExportPdfModal';
import { SearchReplaceModal } from '@/components/SearchReplaceModal';
import {
  Sparkles,
  Printer,
  Download,
  Upload,
  X,
  BookPlus,
  Replace,
} from 'lucide-react';

export default function Home() {
  const store = useScenarioStore();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiGenerateModalOpen, setIsAiGenerateModalOpen] = useState(false);
  const [isNewScenarioModalOpen, setIsNewScenarioModalOpen] = useState(false);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);
  const [isSearchReplaceModalOpen, setIsSearchReplaceModalOpen] = useState(false);
  const [printPageIds, setPrintPageIds] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsSearchReplaceModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize: load from localStorage if exists, or seed sample scenario elements
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gazetteer_saved_scenario');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (store.loadScenario(parsed)) {
            return;
          }
        } catch (e) {
          console.error('Failed to load auto-saved scenario', e);
        }
      }
    }

    if (Object.keys(store.entities).length === 0 && store.currentScenario) {
      const page1Id = store.pages[0]?.id;
      if (!page1Id) return;

      const npc = createDefaultEntity(store.currentScenario.id, 'npc', 'Kaelen the Herbalist');
      npc.attributes = {
        role: 'Informant',
        demeanor: 'Guarded and nervous, constantly checking shadows.',
        lore: 'Searches for the rare Moon-Lily root to brew a cure for his infected daughter.',
        hitPoints: 12,
        armorClass: 11,
      };

      const trap = createDefaultEntity(store.currentScenario.id, 'trap', 'Serpent-Spit Crossbow');
      trap.attributes = {
        trigger: 'Taut algae-coated chord across submerged corridor floor.',
        detectionDc: 13,
        disarmDc: 12,
        effect: 'Fires venom-tipped iron bolt: 1d10 piercing + DC 13 Con save or 2d6 poison damage.',
        resetConditions: 'Manual reload behind brick false wall.',
      };

      const site = createDefaultEntity(store.currentScenario.id, 'adventure_site', 'Sunken Crypt of Saint Othelia');
      site.attributes = {
        siteType: 'Flooded Tomb',
        entranceAccess: 'Shattered marble mausoleum half-submerged in black swampwater.',
        alertState: 'passive',
        environmentalHazards: 'Knee-deep murky water (difficult terrain), thick choking spores.',
      };

      const treasure = createDefaultEntity(store.currentScenario.id, 'treasure', 'The Moon-Lily Relic');
      treasure.attributes = {
        value: '750 gp',
        rarity: 'Rare Alchemical Focus',
        contents: 'A luminescent silver chalice holding preserved glowing marsh flora.',
      };

      store.addEntity(npc);
      store.addEntity(trap);
      store.addEntity(site);
      store.addEntity(treasure);

      // Place them on page 1
      store.addPlacement(page1Id, site.id, 0, 2);      // 2-column header splash
      store.addPlacement(page1Id, npc.id, 0, 1);       // 1-column left
      store.addPlacement(page1Id, trap.id, 1, 1);      // 1-column right
      store.addPlacement(page1Id, treasure.id, 0, 1);  // 1-column left
    }
  }, []);

  // Auto-save changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && store.currentScenario && Object.keys(store.entities).length > 0) {
      const data = store.exportScenario();
      localStorage.setItem('gazetteer_saved_scenario', JSON.stringify(data));
    }
  }, [store.currentScenario, store.pages, store.entities, store.placements]);

  const activePage =
    store.pages.find((p) => p.id === store.activePageId) || store.pages[0];

  const pagesToPrint = printPageIds
    ? store.pages.filter((p) => printPageIds.includes(p.id))
    : store.pages;

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintPageIds(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const handlePrintPdf = () => {
    setIsExportPdfModalOpen(true);
  };

  const handleConfirmPrint = (selectedPageIds: string[]) => {
    setPrintPageIds(selectedPageIds);
    setTimeout(() => {
      window.print();
    }, 100);
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
          alert('Invalid scenario file format. Please upload a valid Gazetteer scenario JSON file.');
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0f12] text-neutral-100 font-sans print:h-auto print:w-full print:overflow-visible print:bg-white print:block">
      {/* Screen Interactive Workspace (hidden in print) */}
      <div className="flex h-full w-full overflow-hidden print:hidden">
        {/* Sidebar: Elements, Pages, Settings */}
        <ScenarioSidebar onOpenAiGenerateModal={() => setIsAiGenerateModalOpen(true)} />

        {/* Main Workspace Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 border-b border-neutral-800 bg-[#16181d] px-6 flex items-center justify-between no-print z-10">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm tracking-wider uppercase text-neutral-300">
              Gazetteer
            </span>
            <span className="text-neutral-600">/</span>
            <span className="text-xs text-neutral-400">
              {store.currentScenario?.title}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Hidden File Input for Loading Scenarios */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            {/* Quick Deselect All Checkboxes Button (Visible when entities are selected) */}
            {store.selectedEntityIds.length > 0 && (
              <button
                onClick={() => store.clearSelection()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900 border border-red-800/60 text-red-200 text-xs font-medium transition-colors cursor-pointer"
                title="Clear all checked checkboxes across the scenario"
              >
                <X className="w-3.5 h-3.5 text-red-400" />
                <span>Deselect All ({store.selectedEntityIds.length})</span>
              </button>
            )}

            {/* New Scenario Button */}
            <button
              onClick={() => setIsNewScenarioModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-200 text-xs font-medium border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
              title="Create a new scenario and configure ruleset, theme, and layout settings"
            >
              <BookPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>New Scenario</span>
            </button>

            {/* Save Scenario to Disk */}
            <button
              onClick={handleSaveScenario}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-200 text-xs font-medium border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
              title="Save current scenario as a .json backup file"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Save Scenario</span>
            </button>

            {/* Load Scenario from Disk */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-200 text-xs font-medium border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
              title="Load a scenario from a .json backup file"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Load Scenario</span>
            </button>

            {/* AI Generate Elements on New Page Button */}
            <button
              onClick={() => setIsAiGenerateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
              title="Prompt LLM to create and fill new scenario elements on a brand new page"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>AI Create Elements</span>
            </button>

            {/* AI Batch Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Batch Edit</span>
              {store.selectedEntityIds.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-800 text-[10px]">
                  {store.selectedEntityIds.length}
                </span>
              )}
            </button>

            {/* Search and Replace */}
            <button
              onClick={() => setIsSearchReplaceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
              title="Search and Replace across all pages (Ctrl+H)"
            >
              <Replace className="w-3.5 h-3.5 text-indigo-400" />
              <span>Search & Replace</span>
            </button>

            {/* Print / Export to PDF */}
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors cursor-pointer"
              title="Export high-fidelity A4 PDF using browser print engine"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Canvas Viewport */}
        <main className="flex-1 overflow-y-auto p-8 flex justify-center bg-[#0d0f12]">
          {activePage ? (
            <PageCanvas page={activePage} />
          ) : (
            <div className="flex items-center justify-center text-neutral-500 text-sm">
              No page selected.
            </div>
          )}
        </main>
      </div>
    </div>

      {/* Dedicated Multi-Page Print Document Container (active only during print) */}
      <div className="hidden print:block print-document-container w-full">
        {pagesToPrint.map((p, idx) => (
          <PageCanvas
            key={`print-${p.id}`}
            page={p}
            isPrintOnly
            isLast={idx === pagesToPrint.length - 1}
          />
        ))}
      </div>

      {/* Export to PDF / Print Modal */}
      <ExportPdfModal
        isOpen={isExportPdfModalOpen}
        onClose={() => setIsExportPdfModalOpen(false)}
        pages={store.pages}
        activePageId={activePage?.id || store.pages[0]?.id || ''}
        scenarioTitle={store.currentScenario?.title}
        onConfirmPrint={handleConfirmPrint}
      />

      {/* AI Generate New Elements on New Page Modal */}
      <AiGeneratePageModal
        isOpen={isAiGenerateModalOpen}
        onClose={() => setIsAiGenerateModalOpen(false)}
      />

      {/* AI Batch Edit & Clipboard Bridge Modal */}
      <AiBatchModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      {/* New Scenario Settings Modal */}
      <NewScenarioModal
        isOpen={isNewScenarioModalOpen}
        onClose={() => setIsNewScenarioModalOpen(false)}
      />

      {/* Search and Replace Modal */}
      <SearchReplaceModal
        isOpen={isSearchReplaceModalOpen}
        onClose={() => setIsSearchReplaceModalOpen(false)}
      />
    </div>
  );
}
