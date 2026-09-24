'use client';

import React, { useEffect, useState } from 'react';
import { useScenarioStore } from '@/store/scenarioStore';
import { createDefaultEntity } from '@/domain/entities';
import { ScenarioSidebar } from '@/components/ScenarioSidebar';
import { PageCanvas } from '@/components/PageCanvas';
import { AiBatchModal } from '@/components/AiBatchModal';
import {
  Sparkles,
  Printer,
  Plus,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Share2,
} from 'lucide-react';

export default function Home() {
  const store = useScenarioStore();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Seed sample scenario elements on initial load if empty
  useEffect(() => {
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

  const activePage =
    store.pages.find((p) => p.id === store.activePageId) || store.pages[0];

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0f12] text-neutral-100 font-sans">
      {/* Sidebar: Elements, Pages, Settings */}
      <ScenarioSidebar />

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

          <div className="flex items-center gap-3">
            {/* AI Batch Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Batch Edit</span>
              {store.selectedEntityIds.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-800 text-[10px]">
                  {store.selectedEntityIds.length}
                </span>
              )}
            </button>

            {/* Print / Export to PDF */}
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors"
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

      {/* AI Batch Edit & Clipboard Bridge Modal */}
      <AiBatchModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}
