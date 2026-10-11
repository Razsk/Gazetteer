import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageOverviewModal } from './PageOverviewModal';
import { useScenarioStore } from '@/store/scenarioStore';
import { createDefaultEntity } from '@/domain/entities';

describe('PageOverviewModal', () => {
  beforeEach(() => {
    useScenarioStore.getState().resetStore();
    const store = useScenarioStore.getState();
    const p1 = store.pages[0];

    const npc = createDefaultEntity(store.currentScenario!.id, 'npc', 'Lady Vespera');
    store.addEntity(npc);
    store.addPlacement(p1.id, npc.id, 0, 1);

    const p2 = store.createPage({ title: 'Flooded Chamber' });
    const trap = createDefaultEntity(store.currentScenario!.id, 'trap', 'Spike Pit');
    store.addEntity(trap);
    store.addPlacement(p2.id, trap.id, 0, 1);
  });

  it('does not render when isOpen is false', () => {
    render(<PageOverviewModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders pages with titles, badges, and placed entities', () => {
    render(<PageOverviewModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Pages Overview')).toBeInTheDocument();
    expect(screen.getByText(/2 Pages/i)).toBeInTheDocument();

    // Check page numbers and titles
    expect(screen.getAllByText(/Page 1/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Page 2/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Flooded Chamber')).toBeInTheDocument();

    // Check entities inside thumbnail
    expect(screen.getByText('Lady Vespera')).toBeInTheDocument();
    expect(screen.getByText('Spike Pit')).toBeInTheDocument();
  });

  it('switches active page and closes modal when clicking Open or page card', () => {
    const onClose = vi.fn();
    render(<PageOverviewModal isOpen={true} onClose={onClose} />);

    const openButtons = screen.getAllByRole('button', { name: /open/i });
    fireEvent.click(openButtons[1]); // Open page 2

    const state = useScenarioStore.getState();
    expect(state.activePageId).toBe(state.pages[1].id);
    expect(onClose).toHaveBeenCalled();
  });

  it('can duplicate a page from the overview card', () => {
    render(<PageOverviewModal isOpen={true} onClose={vi.fn()} />);

    const duplicateButtons = screen.getAllByTitle(/duplicate this page/i);
    expect(duplicateButtons).toHaveLength(2);

    fireEvent.click(duplicateButtons[0]);

    const state = useScenarioStore.getState();
    expect(state.pages).toHaveLength(3);
    expect(state.pages[1].title).toContain('(Copy)');
  });

  it('can create a new page via Add Page button', () => {
    render(<PageOverviewModal isOpen={true} onClose={vi.fn()} />);

    const addButtons = screen.getAllByRole('button', { name: /add page|add new page/i });
    fireEvent.click(addButtons[0]);

    const state = useScenarioStore.getState();
    expect(state.pages).toHaveLength(3);
  });

  it('can move a page later via ChevronRight button', () => {
    render(<PageOverviewModal isOpen={true} onClose={vi.fn()} />);

    const moveRightButtons = screen.getAllByTitle(/move page later/i);
    // Page 1 can move right
    fireEvent.click(moveRightButtons[0]);

    const state = useScenarioStore.getState();
    expect(state.pages[0].title).toBe('Flooded Chamber');
  });
});
