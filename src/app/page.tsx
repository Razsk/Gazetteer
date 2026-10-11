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
import { PageOverviewModal } from '@/components/PageOverviewModal';
import { TocAndIndexModal } from '@/components/TocAndIndexModal';
import {
  Sparkles,
  Printer,
  Download,
  Upload,
  X,
  BookPlus,
  Replace,
  LayoutGrid,
  BookOpen,
  Hash,
  Menu,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';

export default function Home() {
  const store = useScenarioStore();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiGenerateModalOpen, setIsAiGenerateModalOpen] = useState(false);
  const [isNewScenarioModalOpen, setIsNewScenarioModalOpen] = useState(false);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);
  const [isSearchReplaceModalOpen, setIsSearchReplaceModalOpen] = useState(false);
  const [isPageOverviewOpen, setIsPageOverviewOpen] = useState(false);
  const [isTocAndIndexOpen, setIsTocAndIndexOpen] = useState(false);
  const [tocAndIndexDefaultTab, setTocAndIndexDefaultTab] = useState<'toc' | 'index'>('toc');
  const [printPageIds, setPrintPageIds] = useState<string[] | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarInitialTab, setSidebarInitialTab] = useState<'elements' | 'pages' | 'settings'>('elements');
  const [isTopMenuVisible, setIsTopMenuVisible] = useState(true);
  const [isTopActionsOpen, setIsTopActionsOpen] = useState(false);
  const [isBottomMenuVisible, setIsBottomMenuVisible] = useState(true);
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
        detectionClue: 'Greenish copper wire glistening faintly beneath murky swamp runoff.',
        disarm: 'Carefully snip the wire with shears while securing the tension peg.',
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

  const activePageIndex = store.pages.findIndex((p) => p.id === activePage?.id);
  const prevPage = activePageIndex > 0 ? store.pages[activePageIndex - 1] : null;
  const nextPage = activePageIndex < store.pages.length - 1 ? store.pages[activePageIndex + 1] : null;

  const handlePrevPage = () => {
    if (prevPage) store.setActivePage(prevPage.id);
  };
  const handleNextPage = () => {
    if (nextPage) store.setActivePage(nextPage.id);
  };

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
        <ScenarioSidebar
          onOpenAiGenerateModal={() => {
            setIsMobileSidebarOpen(false);
            setIsAiGenerateModalOpen(true);
          }}
          onOpenPageOverview={() => {
            setIsMobileSidebarOpen(false);
            setIsPageOverviewOpen(true);
          }}
          onOpenToc={() => {
            setIsMobileSidebarOpen(false);
            setTocAndIndexDefaultTab('toc');
            setIsTocAndIndexOpen(true);
          }}
          onOpenIndex={() => {
            setIsMobileSidebarOpen(false);
            setTocAndIndexDefaultTab('index');
            setIsTocAndIndexOpen(true);
          }}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          initialTab={sidebarInitialTab}
        />

        {/* Main Workspace Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* Floating Pill when Top Bar is slid out (mobile only) */}
          {!isTopMenuVisible && (
            <button
              onClick={() => setIsTopMenuVisible(true)}
              data-testid="show-top-menu-btn"
              className="fixed top-2 right-3 z-30 flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 shadow-xl backdrop-blur-xs md:hidden animate-in fade-in duration-200 cursor-pointer"
              title="Slide down top header"
            >
              <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>Top Bar</span>
            </button>
          )}

          {/* Top Navbar */}
          <header
            data-testid="top-navbar"
            className={`h-14 border-b border-neutral-800 bg-[#16181d] px-3 sm:px-6 flex items-center justify-between no-print z-20 shrink-0 transition-transform duration-300 ease-in-out ${
              isTopMenuVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
            }`}
          >
            {/* Left: Mobile Hamburger & Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Hamburger Drawer Opener */}
              <button
                onClick={() => {
                  setSidebarInitialTab('elements');
                  setIsMobileSidebarOpen(true);
                }}
                data-testid="mobile-hamburger-btn"
                className="md:hidden p-1.5 -ml-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Open Elements & Pages Sidebar Drawer"
              >
                <Menu className="w-5 h-5 text-neutral-300" />
              </button>

              <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-neutral-300 shrink-0">
                Gazetteer
              </span>
              <span className="text-neutral-600">/</span>
              <span className="text-xs text-neutral-400 truncate max-w-[120px] sm:max-w-xs">
                {store.currentScenario?.title}
              </span>
            </div>

            {/* Desktop Right Toolbar */}
            <div className="hidden md:flex items-center gap-2.5">
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

            {/* Pages Overview */}
            <button
              onClick={() => setIsPageOverviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
              title="Open bird's-eye Page Overview and reordering gallery"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span>Overview ({store.pages.length})</span>
            </button>

            {/* Table of Contents */}
            <button
              onClick={() => {
                setTocAndIndexDefaultTab('toc');
                setIsTocAndIndexOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
              title="Table of Contents"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>TOC</span>
            </button>

            {/* Scenario Index (A-Z) */}
            <button
              onClick={() => {
                setTocAndIndexDefaultTab('index');
                setIsTocAndIndexOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
              title="Alphabetical Scenario Index (A-Z)"
            >
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              <span>Index</span>
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

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Quick Deselect if active */}
            {store.selectedEntityIds.length > 0 && (
              <button
                onClick={() => store.clearSelection()}
                className="p-1.5 rounded-lg bg-red-950/60 border border-red-800/60 text-red-200 text-xs"
                title="Deselect all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Mobile Actions Drawer Toggle */}
            <button
              onClick={() => setIsTopActionsOpen((prev) => !prev)}
              data-testid="mobile-actions-toggle-btn"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 text-xs font-medium cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Actions</span>
              <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isTopActionsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Slide Out Top Menu Button */}
            <button
              onClick={() => {
                setIsTopMenuVisible(false);
                setIsTopActionsOpen(false);
              }}
              data-testid="hide-top-menu-btn"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Slide out top bar"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Top Actions Drawer Tray (slides down when toggled) */}
        {isTopActionsOpen && (
          <>
            <div
              data-testid="top-actions-backdrop"
              onClick={() => setIsTopActionsOpen(false)}
              className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-xs animate-in fade-in"
            />
            <div
              data-testid="top-actions-tray"
              className="fixed top-14 left-0 right-0 z-30 bg-[#16181d] border-b border-neutral-800 p-3 shadow-2xl animate-in slide-in-from-top duration-200 md:hidden"
            >
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    setIsTopActionsOpen(false);
                    setIsAiGenerateModalOpen(true);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 font-medium cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>AI Create</span>
                </button>
                <button
                  onClick={() => {
                    setIsTopActionsOpen(false);
                    setIsAiModalOpen(true);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/60 text-indigo-200 font-medium cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>AI Batch Edit</span>
                </button>
                <button
                  onClick={() => {
                    setIsTopActionsOpen(false);
                    handlePrintPdf();
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-medium cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-neutral-400" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={() => {
                    setIsTopActionsOpen(false);
                    setIsSearchReplaceModalOpen(true);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-medium cursor-pointer"
                >
                  <Replace className="w-4 h-4 text-indigo-400" />
                  <span>Search & Replace</span>
                </button>
                <button
                  onClick={() => {
                    setIsTopActionsOpen(false);
                    handleSaveScenario();
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-medium cursor-pointer"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Save Scenario</span>
                </button>
                <button
                  onClick={() => {
                    setIsTopActionsOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-medium cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Load Scenario</span>
                </button>
                <button
                  onClick={() => {
                    setIsTopActionsOpen(false);
                    setIsNewScenarioModalOpen(true);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-medium col-span-2 cursor-pointer"
                >
                  <BookPlus className="w-4 h-4 text-indigo-400" />
                  <span>New Scenario Setup</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Scrollable Page Canvas Viewport */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 flex justify-center bg-[#0d0f12]">
          {activePage ? (
            <PageCanvas
              page={activePage}
              onOpenPageOverview={() => setIsPageOverviewOpen(true)}
              onOpenToc={() => {
                setTocAndIndexDefaultTab('toc');
                setIsTocAndIndexOpen(true);
              }}
              onOpenIndex={() => {
                setTocAndIndexDefaultTab('index');
                setIsTocAndIndexOpen(true);
              }}
            />
          ) : (
            <div className="flex items-center justify-center text-neutral-500 text-sm">
              No page selected.
            </div>
          )}
        </main>

        {/* Floating Pill when Bottom Menu is slid out (mobile only) */}
        {!isBottomMenuVisible && (
          <button
            onClick={() => setIsBottomMenuVisible(true)}
            data-testid="show-bottom-menu-btn"
            className="fixed bottom-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 shadow-xl backdrop-blur-xs md:hidden animate-in fade-in duration-200 cursor-pointer"
            title="Slide up bottom menu"
          >
            <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Menu</span>
          </button>
        )}

        {/* Mobile Bottom Navigation Bar */}
        <nav
          data-testid="mobile-bottom-nav"
          className={`fixed bottom-0 left-0 right-0 z-30 bg-[#16181d]/95 backdrop-blur-md border-t border-neutral-800 transition-transform duration-300 ease-in-out md:hidden ${
            isBottomMenuVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between px-3 py-2 text-[11px] text-neutral-400 max-w-lg mx-auto">
            {/* Quick Page Nav: Prev, Current/Total, Next */}
            <div className="flex items-center bg-neutral-900/90 border border-neutral-800 rounded-lg p-0.5">
              <button
                onClick={handlePrevPage}
                disabled={!prevPage}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-300 disabled:opacity-25 transition-colors cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPageOverviewOpen(true)}
                className="px-2 py-0.5 font-bold text-neutral-200 hover:text-white cursor-pointer"
                title="Page Overview"
              >
                {activePageIndex + 1}/{store.pages.length}
              </button>
              <button
                onClick={handleNextPage}
                disabled={!nextPage}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-300 disabled:opacity-25 transition-colors cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Elements / Library drawer button */}
            <button
              onClick={() => {
                setSidebarInitialTab('elements');
                setIsMobileSidebarOpen(true);
              }}
              data-testid="bottom-nav-library-btn"
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Library</span>
            </button>

            {/* Overview button */}
            <button
              onClick={() => setIsPageOverviewOpen(true)}
              data-testid="bottom-nav-overview-btn"
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4 text-indigo-400" />
              <span>Overview</span>
            </button>

            {/* TOC & Index button */}
            <button
              onClick={() => {
                setTocAndIndexDefaultTab('toc');
                setIsTocAndIndexOpen(true);
              }}
              data-testid="bottom-nav-toc-btn"
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>TOC</span>
            </button>

            {/* Actions button */}
            <button
              onClick={() => setIsTopActionsOpen((prev) => !prev)}
              data-testid="bottom-nav-actions-btn"
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <span>Actions</span>
            </button>

            {/* Slide Down / Hide Button */}
            <button
              onClick={() => setIsBottomMenuVisible(false)}
              data-testid="hide-bottom-menu-btn"
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-850 transition-colors cursor-pointer"
              title="Slide out bottom menu"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </nav>
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

      {/* Pages Overview Modal */}
      <PageOverviewModal
        isOpen={isPageOverviewOpen}
        onClose={() => setIsPageOverviewOpen(false)}
      />

      {/* Table of Contents and Index Modal */}
      <TocAndIndexModal
        isOpen={isTocAndIndexOpen}
        onClose={() => setIsTocAndIndexOpen(false)}
        defaultTab={tocAndIndexDefaultTab}
      />
    </div>
  );
}
