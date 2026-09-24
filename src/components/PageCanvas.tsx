'use client';

import React from 'react';
import { Page, useScenarioStore } from '@/store/scenarioStore';
import { EntityCard } from './EntityCard';
import { ThemeSkin, THEME_SKINS } from './themeSkin';
import { Columns2, Layout, Plus, Palette } from 'lucide-react';

interface PageCanvasProps {
  page: Page;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({ page }) => {
  const store = useScenarioStore();
  const placements = store.placements[page.id] || [];
  const skin = THEME_SKINS[page.themeSkin];

  const handleTogglePageColumns = () => {
    const nextCol = page.columnCount === 1 ? 2 : 1;
    store.createPage(); // trigger re-render if needed
  };

  const handleSkinChange = (newSkin: ThemeSkin) => {
    // updates page skin
    const updatedPages = store.pages.map((p) =>
      p.id === page.id ? { ...p, themeSkin: newSkin } : p
    );
    useScenarioStore.setState({ pages: updatedPages });
  };

  return (
    <div className="flex flex-col items-center">
      {/* Page Toolbar (no-print) */}
      <div className="w-[210mm] max-w-full flex items-center justify-between pb-2 text-xs text-neutral-400 no-print">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-200">
            Page {page.pageNumber}: {page.title || 'Untitled'}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-300">
            {page.pageSize} ({page.columnCount} Col)
          </span>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={() => {
              const updated = store.pages.map((p) =>
                p.id === page.id ? { ...p, columnCount: (p.columnCount === 1 ? 2 : 1) as 1 | 2 } : p
              );
              useScenarioStore.setState({ pages: updated });
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
            title="Toggle between 1-column and 2-column page layout"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>{page.columnCount === 1 ? '1 Col' : '2 Col'}</span>
          </button>
        </div>
      </div>

      {/* Physical Page Sheet (A4 dimensions: 210mm x 297mm) */}
      <div
        className={`print-page relative w-[210mm] min-h-[297mm] p-[15mm] border transition-all duration-200 rounded-sm shadow-xl ${
          page.themeSkin === 'parchment'
            ? 'bg-[#f8f4e6] border-[#dfcfb0]'
            : page.themeSkin === 'gothic'
            ? 'bg-[#15161a] border-[#31333a]'
            : page.themeSkin === 'cyberpunk'
            ? 'bg-[#080b11] border-[#00f3ff]/20'
            : 'bg-white border-neutral-300'
        }`}
      >
        {/* Decorative corner embellishments for parchment/gothic */}
        {page.themeSkin === 'parchment' && (
          <div className="absolute inset-2 border border-[#d8c39d]/40 pointer-events-none rounded" />
        )}

        {/* Page Grid Track */}
        <div
          className={`grid gap-4 ${
            page.columnCount === 2 ? 'grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {placements.map((placement) => {
            const entity = store.entities[placement.entityId];
            if (!entity) return null;

            return (
              <EntityCard
                key={placement.id}
                placement={placement}
                entity={entity}
                pageSkin={page.themeSkin}
              />
            );
          })}

          {placements.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-neutral-500/20 rounded-lg p-12 flex flex-col items-center justify-center text-center opacity-40">
              <Layout className="w-10 h-10 mb-2" />
              <p className="text-sm font-medium">This page is currently empty</p>
              <p className="text-xs">Add elements from the Library in the sidebar to populate this page spread.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
