import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityCard } from './EntityCard';
import { Entity } from '@/domain/entities';
import { Placement } from '@/store/scenarioStore';

describe('EntityCard bullet list rendering', () => {
  const mockPlacement: Placement = {
    id: 'plc-1',
    pageId: 'page-1',
    entityId: 'ent-1',
    columnIndex: 0,
    columnSpan: 1,
    displayOrder: 0,
    styleOverrides: {},
  };

  it('renders enemy actions with * as a bullet list', () => {
    const enemyEntity: Entity = {
      id: 'ent-1',
      scenarioId: 'scen-1',
      entityType: 'enemy',
      name: 'Bog Hag',
      attributes: {
        creatureType: 'Monstrosity',
        challengeRating: '3',
        hitPoints: 52,
        armorClass: 14,
        speed: '30 ft',
        actions: `* Claw: +5 to hit, 2d6+3 slashing
* Illusory Disguise: casts disguise self at will
* Nightmare Touch: DC 13 Wis save or frightened`,
        tactics: `1. Ambush from swamp water
2. Isolate the healer
3. Flee into mist if below 15 HP`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { container } = render(
      <EntityCard
        placement={mockPlacement}
        entity={enemyEntity}
        pageSkin="parchment"
      />
    );

    // Verify actions bullet list
    expect(screen.getByText('Claw: +5 to hit, 2d6+3 slashing')).toBeInTheDocument();
    expect(screen.getByText('Illusory Disguise: casts disguise self at will')).toBeInTheDocument();
    expect(screen.getByText('Nightmare Touch: DC 13 Wis save or frightened')).toBeInTheDocument();

    // Verify tactics bullet list (from 1. 2. 3.)
    expect(screen.getByText('Ambush from swamp water')).toBeInTheDocument();
    expect(screen.getByText('Isolate the healer')).toBeInTheDocument();
    expect(screen.getByText('Flee into mist if below 15 HP')).toBeInTheDocument();

    // Verify bullet items (li elements)
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(6);
  });

  it('renders NPC lore with numbered list 1. 2. 3. as bullet list', () => {
    const npcEntity: Entity = {
      id: 'ent-2',
      scenarioId: 'scen-1',
      entityType: 'npc',
      name: 'Old Tom',
      attributes: {
        role: 'Lighthouse Keeper',
        demeanor: 'Gruff and paranoid',
        lore: `1. Knows the reefs better than anyone alive
2. Lost his left eye to a sea siren
3. Hides a pouch of smuggled pearls under the floorboards`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { container } = render(
      <EntityCard
        placement={mockPlacement}
        entity={npcEntity}
        pageSkin="parchment"
      />
    );

    expect(screen.getByText('Knows the reefs better than anyone alive')).toBeInTheDocument();
    expect(screen.getByText('Lost his left eye to a sea siren')).toBeInTheDocument();
    expect(screen.getByText('Hides a pouch of smuggled pearls under the floorboards')).toBeInTheDocument();

    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(3);
  });

  it('renders generic_list with context and allows toggling bullet and numbers', async () => {
    const genericListEntity: Entity = {
      id: 'ent-3',
      scenarioId: 'scen-1',
      entityType: 'generic_list',
      name: 'Catacomb Clues',
      attributes: {
        context: 'Important clues and notes found in the catacomb crypts.',
        listStyle: 'bullet',
        items: [
          'The tomb of the grand inquisitor is sealed with a silver glyph',
          'Skeletons awaken when unholy incense is burned',
          'A rusted iron lever opens the north iron gate',
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { container, rerender } = render(
      <EntityCard
        placement={mockPlacement}
        entity={genericListEntity}
        pageSkin="parchment"
      />
    );

    // Verify context is displayed
    expect(screen.getByText('Important clues and notes found in the catacomb crypts.')).toBeInTheDocument();

    // Verify initial bullet list items
    expect(screen.getByText('The tomb of the grand inquisitor is sealed with a silver glyph')).toBeInTheDocument();
    expect(screen.getByText('Skeletons awaken when unholy incense is burned')).toBeInTheDocument();
    expect(screen.getByText('A rusted iron lever opens the north iron gate')).toBeInTheDocument();

    // In bullet mode, marker is bullet dot •
    let markers = container.querySelectorAll('span[aria-hidden="true"]');
    expect(markers[0].textContent).toBe('•');

    // Switch to numbered mode
    const updatedEntity: Entity = {
      ...genericListEntity,
      attributes: {
        ...genericListEntity.attributes,
        listStyle: 'numbered',
      },
    };

    rerender(
      <EntityCard
        placement={mockPlacement}
        entity={updatedEntity}
        pageSkin="parchment"
      />
    );

    // In numbered mode, markers are 1., 2., 3.
    markers = container.querySelectorAll('span[aria-hidden="true"]');
    expect(markers[0].textContent).toBe('1.');
    expect(markers[1].textContent).toBe('2.');
    expect(markers[2].textContent).toBe('3.');
  });
});

describe('EntityCard click activation and icon visibility', () => {
  const mockPlacement: Placement = {
    id: 'plc-card-1',
    pageId: 'page-1',
    entityId: 'ent-npc-1',
    columnIndex: 0,
    columnSpan: 1,
    displayOrder: 0,
    styleOverrides: {},
  };

  const sampleNpc: Entity = {
    id: 'ent-npc-1',
    scenarioId: 'scen-1',
    entityType: 'npc',
    name: 'Brother Aldous',
    attributes: {
      role: 'Monk Archivist',
      demeanor: 'Humble and soft-spoken',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('shows only checkbox and card title by default (when inactive)', () => {
    render(
      <EntityCard
        placement={mockPlacement}
        entity={sampleNpc}
        pageSkin="parchment"
        isActive={false}
      />
    );

    // Title and checkbox are visible
    expect(screen.getByText('Brother Aldous')).toBeInTheDocument();
    expect(screen.getByTitle(/select for ai batch/i)).toBeInTheDocument();

    // Action buttons are NOT rendered
    expect(screen.queryByTitle('Move or Clone to another page')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Edit element attributes and details')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Remove from page')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Drag to rearrange order on page')).not.toBeInTheDocument();
  });

  it('shows action icons and calls onActivate when clicked', () => {
    const onActivate = vi.fn();
    const { rerender } = render(
      <EntityCard
        placement={mockPlacement}
        entity={sampleNpc}
        pageSkin="parchment"
        isActive={false}
        onActivate={onActivate}
      />
    );

    // Click card container
    fireEvent.click(screen.getByText('Brother Aldous'));
    expect(onActivate).toHaveBeenCalledTimes(1);

    // When card becomes active
    rerender(
      <EntityCard
        placement={mockPlacement}
        entity={sampleNpc}
        pageSkin="parchment"
        isActive={true}
        onActivate={onActivate}
      />
    );

    // Action buttons and controls are now rendered
    expect(screen.getByTitle('Move or Clone to another page')).toBeInTheDocument();
    expect(screen.getByTitle('Edit element attributes and details')).toBeInTheDocument();
    expect(screen.getByTitle('Remove from page')).toBeInTheDocument();
  });
});

