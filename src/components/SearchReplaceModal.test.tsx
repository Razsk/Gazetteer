import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchReplaceModal } from './SearchReplaceModal';
import { useScenarioStore } from '@/store/scenarioStore';
import { createDefaultEntity } from '@/domain/entities';

describe('SearchReplaceModal', () => {
  beforeEach(() => {
    useScenarioStore.getState().resetStore();
    const store = useScenarioStore.getState();
    const page1Id = store.pages[0].id;
    const page2 = store.createPage({ title: 'Ancient Ruin Level 2' });

    const npc = createDefaultEntity(store.currentScenario!.id, 'npc', 'Goblin King');
    npc.attributes = {
      ...npc.attributes,
      lore: 'The king rules over the goblin cave with an iron fist.',
    };
    store.addEntity(npc);
    store.addPlacement(page1Id, npc.id, 0, 1);

    const enemy = createDefaultEntity(store.currentScenario!.id, 'enemy', 'Goblin Sentry');
    enemy.attributes = {
      ...enemy.attributes,
      tactics: 'The goblin sounds the alarm immediately.',
    };
    store.addEntity(enemy);
    store.addPlacement(page2.id, enemy.id, 0, 1);
  });

  it('renders modal with "All Pages" as default scope', () => {
    render(<SearchReplaceModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: /search and replace/i })).toBeInTheDocument();
    expect(screen.getByText('All Pages')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search across all pages...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Replacement text...')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<SearchReplaceModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('searches across all pages and renders matching diff snippets', () => {
    render(<SearchReplaceModal isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('Search across all pages...');
    fireEvent.change(searchInput, { target: { value: 'goblin' } });

    // Should find matches in King name, King lore, Sentry name, Sentry tactics
    expect(screen.getByText(/Found/i)).toBeInTheDocument();
    expect(screen.getByText(/across all pages/i)).toBeInTheDocument();

    const replaceAllBtn = screen.getByRole('button', { name: /replace all/i });
    expect(replaceAllBtn).toBeEnabled();
  });

  it('replaces all occurrences across all pages when "Replace All" is clicked', () => {
    render(<SearchReplaceModal isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('Search across all pages...');
    const replaceInput = screen.getByPlaceholderText('Replacement text...');

    fireEvent.change(searchInput, { target: { value: 'goblin' } });
    fireEvent.change(replaceInput, { target: { value: 'kobold' } });

    const replaceAllBtn = screen.getByRole('button', { name: /replace all/i });
    fireEvent.click(replaceAllBtn);

    // Verify success banner appears
    expect(screen.getByText(/Replaced .* occurrence\(s\) across all pages!/i)).toBeInTheDocument();

    // Verify store has been mutated across pages
    const entities = Object.values(useScenarioStore.getState().entities);
    const names = entities.map((e) => e.name);
    expect(names).toContain('kobold King');
    expect(names).toContain('kobold Sentry');
  });

  it('allows scoping search to a single specific page', () => {
    render(<SearchReplaceModal isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('Search across all pages...');
    fireEvent.change(searchInput, { target: { value: 'goblin' } });

    const scopeSelect = screen.getByRole('combobox');
    const store = useScenarioStore.getState();
    const page2Id = store.pages[1].id;

    // Change scope to Page 2
    fireEvent.change(scopeSelect, { target: { value: page2Id } });

    // Now only page 2 entities (Goblin Sentry) should be matched
    expect(screen.getByText(/on this page/i)).toBeInTheDocument();
    expect(screen.getAllByText('Goblin Sentry').length).toBeGreaterThan(0);
    expect(screen.queryByText('Goblin King')).not.toBeInTheDocument();
  });

  it('supports selective replacement by unchecking matches', () => {
    render(<SearchReplaceModal isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('Search across all pages...');
    const replaceInput = screen.getByPlaceholderText('Replacement text...');

    fireEvent.change(searchInput, { target: { value: 'goblin' } });
    fireEvent.change(replaceInput, { target: { value: 'hobgoblin' } });

    // Deselect all
    const deselectBtn = screen.getByRole('button', { name: /^deselect all$/i });
    fireEvent.click(deselectBtn);

    const replaceSelectedBtn = screen.getByRole('button', { name: /replace selected \(0\)/i });
    expect(replaceSelectedBtn).toBeDisabled();

    // Select all back
    const selectAllBtn = screen.getByRole('button', { name: /^select all$/i });
    fireEvent.click(selectAllBtn);
    expect(screen.getByRole('button', { name: /replace selected \(\d+\)/i })).toBeEnabled();
  });
});
