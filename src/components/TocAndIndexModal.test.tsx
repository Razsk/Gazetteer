import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TocAndIndexModal } from './TocAndIndexModal';
import { useScenarioStore } from '@/store/scenarioStore';
import { createDefaultEntity } from '@/domain/entities';

describe('TocAndIndexModal', () => {
  beforeEach(() => {
    useScenarioStore.getState().resetStore();
    const store = useScenarioStore.getState();
    const p1 = store.pages[0];

    const npc = createDefaultEntity(store.currentScenario!.id, 'npc', 'Belinda the Seer');
    npc.attributes = { role: 'Diviner', lore: 'Foresees the dragon attack.' };
    store.addEntity(npc);
    store.addPlacement(p1.id, npc.id, 0, 1);

    const site = createDefaultEntity(store.currentScenario!.id, 'adventure_site', 'Dragon Spire');
    store.addEntity(site);
    store.addPlacement(p1.id, site.id, 0, 2);

    const p2 = store.createPage({ title: 'Spire Catacombs' });
    const trap = createDefaultEntity(store.currentScenario!.id, 'trap', 'Acid Sprayer');
    store.addEntity(trap);
    store.addPlacement(p2.id, trap.id, 0, 1);
  });

  it('does not render when isOpen is false', () => {
    render(<TocAndIndexModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders Table of Contents tab with page entries and entities', () => {
    render(<TocAndIndexModal isOpen={true} onClose={vi.fn()} defaultTab="toc" />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByText('Spire Catacombs')).toBeInTheDocument();
    expect(screen.getByText('Belinda the Seer')).toBeInTheDocument();
    expect(screen.getByText('Dragon Spire')).toBeInTheDocument();
    expect(screen.getByText('Acid Sprayer')).toBeInTheDocument();
  });

  it('filters Table of Contents entries when typing in search query', () => {
    render(<TocAndIndexModal isOpen={true} onClose={vi.fn()} defaultTab="toc" />);

    const searchInput = screen.getByPlaceholderText(/filter pages or elements/i);
    fireEvent.change(searchInput, { target: { value: 'Catacombs' } });

    expect(screen.getByText('Spire Catacombs')).toBeInTheDocument();
    expect(screen.queryByText('Belinda the Seer')).not.toBeInTheDocument();
  });

  it('switches to Scenario Index (A-Z) tab and displays alphabetical entries with page tags', () => {
    render(<TocAndIndexModal isOpen={true} onClose={vi.fn()} defaultTab="index" />);

    expect(screen.getByText('Acid Sprayer')).toBeInTheDocument();
    expect(screen.getByText('Belinda the Seer')).toBeInTheDocument();
    expect(screen.getByText('Dragon Spire')).toBeInTheDocument();

    // Check letter headings A, B, D
    expect(screen.getAllByText('A').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('B').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('D').length).toBeGreaterThanOrEqual(1);

    // Check page badge
    expect(screen.getAllByText('P1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('P2').length).toBeGreaterThanOrEqual(1);
  });

  it('inserts Table of Contents as new Page 1 in scenario', () => {
    const onClose = vi.fn();
    render(<TocAndIndexModal isOpen={true} onClose={onClose} defaultTab="toc" />);

    const insertBtn = screen.getByRole('button', { name: /insert toc page/i });
    fireEvent.click(insertBtn);

    const state = useScenarioStore.getState();
    expect(state.pages[0].title).toBe('Table of Contents');
    expect(state.activePageId).toBe(state.pages[0].id);
    expect(onClose).toHaveBeenCalled();
  });

  it('inserts Scenario Index as new page at end of scenario', () => {
    const onClose = vi.fn();
    render(<TocAndIndexModal isOpen={true} onClose={onClose} defaultTab="index" />);

    const insertBtn = screen.getByRole('button', { name: /insert index page/i });
    fireEvent.click(insertBtn);

    const state = useScenarioStore.getState();
    const lastPage = state.pages[state.pages.length - 1];
    expect(lastPage.title).toBe('Scenario Index');
    expect(state.activePageId).toBe(lastPage.id);
    expect(onClose).toHaveBeenCalled();
  });
});
