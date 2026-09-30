import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityCard } from './EntityCard';
import { Entity } from '@/domain/entities';
import { Placement } from '@/store/scenarioStore';

const mockPlacement: Placement = {
  id: 'plc-1',
  pageId: 'page-1',
  entityId: 'ent-1',
  columnIndex: 0,
  columnSpan: 1,
  displayOrder: 0,
  styleOverrides: {},
};

describe('EntityCard bullet list rendering', () => {

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

    // Verify that neither "Bullet List" nor "Numbered List" text is rendered (print or WYSIWYG)
    expect(screen.queryByText(/bullet list/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/numbered list/i)).not.toBeInTheDocument();

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

    // Still neither "Bullet List" nor "Numbered List" text is rendered
    expect(screen.queryByText(/bullet list/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/numbered list/i)).not.toBeInTheDocument();
  });
});

describe('EntityCard click activation and icon visibility', () => {

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

describe('EntityCard trap rendering', () => {
  it('renders trap with detection clue and disarm text fields', () => {
    const trapEntity: Entity = {
      id: 'trap-1',
      scenarioId: 'scen-1',
      entityType: 'trap',
      name: 'Swinging Scythe Trap',
      attributes: {
        trigger: 'Tripping a fine wire at ankle height',
        detectionClue: 'Small holes drilled into the opposing walls with fresh oil stains below',
        disarm: 'Drive an iron piton into the ceiling slot to block the blade pendulum',
        effect: '2d8 slashing damage',
        resetConditions: 'Manual reset via crank behind false brick',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <EntityCard
        placement={mockPlacement}
        entity={trapEntity}
        pageSkin="parchment"
      />
    );

    expect(screen.getByText('Swinging Scythe Trap')).toBeInTheDocument();
    expect(screen.getByText('Tripping a fine wire at ankle height')).toBeInTheDocument();
    expect(screen.getByText('Detection Clue:')).toBeInTheDocument();
    expect(screen.getByText('Small holes drilled into the opposing walls with fresh oil stains below')).toBeInTheDocument();
    expect(screen.getByText('Disarm:')).toBeInTheDocument();
    expect(screen.getByText('Drive an iron piton into the ceiling slot to block the blade pendulum')).toBeInTheDocument();
    expect(screen.getByText('2d8 slashing damage')).toBeInTheDocument();
  });

  it('renders legacy trap DC badges when detectionClue and disarm are absent', () => {
    const legacyTrapEntity: Entity = {
      id: 'trap-legacy',
      scenarioId: 'scen-1',
      entityType: 'trap',
      name: 'Legacy Pit Trap',
      attributes: {
        trigger: 'Weight exceeding 50 lbs on false floor',
        detectionDc: 15,
        disarmDc: 14,
        effect: '10ft drop onto wooden spikes: 2d6 piercing damage',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <EntityCard
        placement={mockPlacement}
        entity={legacyTrapEntity}
        pageSkin="parchment"
      />
    );

    expect(screen.getByText('DC 15 Detection')).toBeInTheDocument();
    expect(screen.getByText('DC 14 Disarm')).toBeInTheDocument();
  });
});

describe('EntityCard rumor list rendering', () => {
  it('renders rumor_list with proper veracity styling and does NOT render stray 0 or o when sourceDc is 0, "0", or "o"', () => {
    const rumorEntity: Entity = {
      id: 'rumor-1',
      scenarioId: 'scen-1',
      entityType: 'rumor_list',
      name: 'Rygter om Kong Grimulf',
      attributes: {
        diceFormula: '1d6',
        entries: [
          {
            roll: 1,
            statement: 'Kongen sover med et forbandet sværd under sin seng.',
            veracity: 'True',
            sourceDc: 0, // Number 0 must NOT render into the DOM
          },
          {
            roll: 2,
            statement: 'Han planlægger at forgive sin egen arving.',
            veracity: 'false', // Lowercase "false" must be recognized as deceptive
            sourceDc: '0', // String "0" must NOT render as Source: 0
          },
          {
            roll: 3,
            statement: 'En mystisk kult opererer i hans hemmelige kælder.',
            veracity: 'False/Deceptive',
            sourceDc: 'o', // String "o" must NOT render
          },
          {
            roll: 4,
            statement: 'Dronningen kender til hans hemmelighed.',
            veracity: 'Partially True',
            sourceDc: 'DC 12 Insight', // Valid source DC must render
          },
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { container } = render(
      <EntityCard
        placement={mockPlacement}
        entity={rumorEntity}
        pageSkin="parchment"
      />
    );

    // Verify rumors render statements
    expect(screen.getByText('Rygter om Kong Grimulf')).toBeInTheDocument();
    expect(screen.getByText('Kongen sover med et forbandet sværd under sin seng.')).toBeInTheDocument();
    expect(screen.getByText('Han planlægger at forgive sin egen arving.')).toBeInTheDocument();
    expect(screen.getByText('Source: DC 12 Insight')).toBeInTheDocument();

    // Verify veracity badge classes (case-insensitive check)
    const falseBadges = screen.getAllByText(/false/i);
    expect(falseBadges.length).toBe(2);
    falseBadges.forEach((badge) => {
      expect(badge.className).toContain('text-red');
    });

    // Verify that NO stray "0" or "o" text node was rendered next to badges
    // Query all elements with text "0" or "Source: 0" or "Source: o"
    expect(screen.queryByText('Source: 0')).not.toBeInTheDocument();
    expect(screen.queryByText('Source: o')).not.toBeInTheDocument();

    // In the entire card container, check for any bare text node that is just '0' or 'o'
    const flexRows = container.querySelectorAll('.flex.items-center.gap-2.mt-1');
    flexRows.forEach((row, idx) => {
      // If it's entry 1, 2, or 3, there should be NO second child with '0' or 'o'
      if (idx < 3) {
        expect(row.textContent?.trim()).not.toMatch(/(True|False)\s+[0o]/i);
        expect(row.textContent?.trim()).not.toContain('Source:');
      }
    });
  });
});

describe('EntityCard event list rendering (Random Events & Progress Clocks)', () => {
  it('renders random event table with dice formula, trigger, and entries', () => {
    const randomEventEntity: Entity = {
      id: 'event-1',
      scenarioId: 'scen-1',
      entityType: 'random_event_list',
      name: 'Forest Encounters',
      attributes: {
        eventListType: 'random_event',
        diceFormula: '1d6',
        frequencyTrigger: 'Every 2 hours',
        entries: [
          { roll: 1, title: 'Goblin Ambush', description: 'Goblins leap from trees.' },
          { roll: 2, title: 'Sudden Fog', description: 'Dense mist obscures vision.' },
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <EntityCard
        placement={mockPlacement}
        entity={randomEventEntity}
        pageSkin="parchment"
        isActive={true}
      />
    );

    expect(screen.getByText('Forest Encounters')).toBeInTheDocument();
    expect(screen.getByText('Roll: 1d6')).toBeInTheDocument();
    expect(screen.getByText('Every 2 hours')).toBeInTheDocument();
    expect(screen.getByText('Goblin Ambush')).toBeInTheDocument();
    expect(screen.getByText('Goblins leap from trees.')).toBeInTheDocument();
    expect(screen.getByText('[1]')).toBeInTheDocument();
  });

  it('renders progress clock with segmented clock, progress count, outcome, and stages', () => {
    const clockEntity: Entity = {
      id: 'clock-1',
      scenarioId: 'scen-1',
      entityType: 'random_event_list',
      name: 'Castle Alarm Clock',
      attributes: {
        eventListType: 'progress_clock',
        segments: 4,
        currentProgress: 1,
        frequencyTrigger: 'On failed stealth',
        outcome: 'The portcullis drops and archers appear.',
        entries: [
          { roll: 1, title: 'Suspicion', description: 'A guard pauses.' },
          { roll: 2, title: 'Investigation', description: 'Lanterns raised.' },
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <EntityCard
        placement={mockPlacement}
        entity={clockEntity}
        pageSkin="parchment"
        isActive={true}
      />
    );

    expect(screen.getByText('Castle Alarm Clock')).toBeInTheDocument();
    expect(screen.getByText('Progress Clock (1/4)')).toBeInTheDocument();
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    expect(screen.getByText('On failed stealth')).toBeInTheDocument();
    expect(screen.getByText('When Filled:')).toBeInTheDocument();
    expect(screen.getByText('The portcullis drops and archers appear.')).toBeInTheDocument();
    expect(screen.getByText('Suspicion')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('advances progress clock when advance button (+) is clicked', () => {
    const clockEntity: Entity = {
      id: 'clock-2',
      scenarioId: 'scen-1',
      entityType: 'random_event_list',
      name: 'Tension Clock',
      attributes: {
        eventListType: 'progress_clock',
        segments: 4,
        currentProgress: 2,
        outcome: 'Dungeon collapses',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <EntityCard
        placement={mockPlacement}
        entity={clockEntity}
        pageSkin="parchment"
        isActive={false}
      />
    );

    const plusBtn = screen.getByTitle('Advance clock by 1 tick');
    expect(plusBtn).toBeInTheDocument();
    fireEvent.click(plusBtn);
  });
});

describe('EntityCard Area/Room contents rendering', () => {
  it('renders single content item inline without a bullet list', () => {
    const areaEntity: Entity = {
      id: 'area-1',
      scenarioId: 'scen-1',
      entityType: 'area',
      name: 'Guard Post',
      attributes: {
        mapKey: '3A',
        dimensionsLighting: '20ft x 20ft, torchlit',
        sensoryBox: 'Smell of stale ale and pipe smoke.',
        contents: ['Rusted iron weapons rack with three spears'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { container } = render(
      <EntityCard
        placement={mockPlacement}
        entity={areaEntity}
        pageSkin="parchment"
      />
    );

    expect(screen.getByText('3A')).toBeInTheDocument();
    expect(screen.getByText('Guard Post')).toBeInTheDocument();
    expect(screen.getByText('Contents:')).toBeInTheDocument();
    expect(screen.getByText('Rusted iron weapons rack with three spears')).toBeInTheDocument();

    // Verify it is NOT wrapped in a bullet list (no <li>)
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(0);
  });

  it('renders multiple content items as a bullet list', () => {
    const areaEntity: Entity = {
      id: 'area-2',
      scenarioId: 'scen-1',
      entityType: 'area',
      name: 'The Torture Chamber',
      attributes: {
        mapKey: '4B',
        dimensionsLighting: '40ft x 50ft, dark with dim braziers',
        sensoryBox: 'The copper reek of blood and cold iron.',
        contents: [
          'Iron maiden with dried stains',
          'Rack with frayed leather straps',
          'Locked wooden coffer on the table',
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { container } = render(
      <EntityCard
        placement={mockPlacement}
        entity={areaEntity}
        pageSkin="parchment"
      />
    );

    expect(screen.getByText('4B')).toBeInTheDocument();
    expect(screen.getByText('The Torture Chamber')).toBeInTheDocument();
    expect(screen.getByText('Contents:')).toBeInTheDocument();
    expect(screen.getByText('Iron maiden with dried stains')).toBeInTheDocument();
    expect(screen.getByText('Rack with frayed leather straps')).toBeInTheDocument();
    expect(screen.getByText('Locked wooden coffer on the table')).toBeInTheDocument();

    // Verify it renders 3 bullet list items
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(3);
  });

  it('renders multi-line string contents as a bullet list', () => {
    const areaEntity: Entity = {
      id: 'area-3',
      scenarioId: 'scen-1',
      entityType: 'area',
      name: 'Alchemist Lab',
      attributes: {
        sensoryBox: 'Pungent odor of sulfur and burning chemicals.',
        contents: `• Glass alembics bubbling with green bile
• Lead cauldron over cold embers
• Crumbling journal of notes`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { container } = render(
      <EntityCard
        placement={mockPlacement}
        entity={areaEntity}
        pageSkin="parchment"
      />
    );

    expect(screen.getByText('Alchemist Lab')).toBeInTheDocument();
    expect(screen.getByText('Contents:')).toBeInTheDocument();
    expect(screen.getByText('Glass alembics bubbling with green bile')).toBeInTheDocument();
    expect(screen.getByText('Lead cauldron over cold embers')).toBeInTheDocument();
    expect(screen.getByText('Crumbling journal of notes')).toBeInTheDocument();

    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(3);
  });
});



