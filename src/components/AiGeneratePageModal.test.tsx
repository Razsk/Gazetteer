import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiGeneratePageModal } from './AiGeneratePageModal';
import { useScenarioStore } from '@/store/scenarioStore';
import { createDefaultEntity } from '@/domain/entities';

describe('AiGeneratePageModal UI', () => {
  beforeEach(() => {
    useScenarioStore.getState().resetStore();
    const scenario = useScenarioStore.getState().currentScenario!;
    const npc = createDefaultEntity(scenario.id, 'npc', 'Kaelen the Herbalist');
    npc.attributes = { role: 'Informant', lore: 'Lost in the bog' };
    useScenarioStore.getState().addEntity(npc);
  });

  it('renders modal with context baseline, presets, and actions when open', () => {
    const handleClose = vi.fn();
    render(<AiGeneratePageModal isOpen={true} onClose={handleClose} />);

    expect(screen.getByText('AI Page & Element Generator')).toBeInTheDocument();
    expect(screen.getByText('New Page Mode')).toBeInTheDocument();
    expect(screen.getByText('Active Scenario Context')).toBeInTheDocument();
    expect(screen.getByText('Boss & Dungeon Chamber')).toBeInTheDocument();
    expect(screen.getByText('Copy Structured Request to Clipboard')).toBeInTheDocument();
    expect(screen.getByText('⚡ Try Sample Encounter')).toBeInTheDocument();
  });

  it('populates prompt when clicking a quick preset chip', () => {
    render(<AiGeneratePageModal isOpen={true} onClose={() => {}} />);

    const presetBtn = screen.getByText('Boss & Dungeon Chamber');
    fireEvent.click(presetBtn);

    const textarea = screen.getByPlaceholderText(/Create a flooded sewer system/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('Generate a dramatic dungeon chamber');
  });

  it('loads sample response and commits creation of new page with elements', () => {
    const handleClose = vi.fn();
    render(<AiGeneratePageModal isOpen={true} onClose={handleClose} />);

    const initialPageCount = useScenarioStore.getState().pages.length;

    // Click Try Sample Encounter
    const sampleBtn = screen.getByRole('button', { name: /⚡ Try Sample Encounter/i });
    fireEvent.click(sampleBtn);

    // Should now be in staged review mode
    expect(screen.getByText('Destination: Brand New Page')).toBeInTheDocument();
    expect(screen.getByText(/Generated Elements/i)).toBeInTheDocument();
    expect(screen.getByText('Skritt the Plague-Biter')).toBeInTheDocument();
    expect(screen.getByText('Toxic Siphon Trap')).toBeInTheDocument();

    // Commit creation
    const createBtn = screen.getByRole('button', { name: /Create Page & Add/i });
    fireEvent.click(createBtn);

    const updatedState = useScenarioStore.getState();
    // A brand new page should have been created in the scenario
    expect(updatedState.pages.length).toBe(initialPageCount + 1);

    const newPage = updatedState.pages[updatedState.pages.length - 1];
    expect(updatedState.activePageId).toBe(newPage.id);

    // Elements should be in the store and placed on the new page
    const placements = updatedState.placements[newPage.id];
    expect(placements.length).toBeGreaterThanOrEqual(4);

    expect(handleClose).toHaveBeenCalled();
  });
});
