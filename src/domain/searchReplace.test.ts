import { describe, it, expect } from 'vitest';
import {
  findMatches,
  applyReplacements,
  SearchOptions,
  SearchStateContext,
} from './searchReplace';
import { Page, Scenario, Placement } from '../store/scenarioStore';
import { Entity, createDefaultEntity } from './entities';

describe('Search and Replace Domain Module', () => {
  const mockScenario: Scenario = {
    id: 'scen-1',
    title: 'The Sunken Temple of Doom',
    ruleset: 'D&D 5e',
    theme: 'Dark Swamp',
    targetPartyLevel: 4,
    defaultThemeSkin: 'parchment',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const page1: Page = {
    id: 'page-1',
    scenarioId: 'scen-1',
    pageNumber: 1,
    title: 'Temple Entrance',
    pageSize: 'A4',
    columnCount: 2,
    themeSkin: 'parchment',
  };

  const page2: Page = {
    id: 'page-2',
    scenarioId: 'scen-1',
    pageNumber: 2,
    title: 'Inner Sanctum of the Temple',
    pageSize: 'A4',
    columnCount: 2,
    themeSkin: 'parchment',
  };

  const entityNpc: Entity = {
    id: 'ent-npc-1',
    scenarioId: 'scen-1',
    entityType: 'npc',
    name: 'Temple Priest Althea',
    attributes: {
      role: 'High Priest',
      demeanor: 'Calm and devoted to the Temple gods.',
      lore: 'Guardian of the sacred temple relics.',
      customFields: {},
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const entityLocation: Entity = {
    id: 'ent-loc-1',
    scenarioId: 'scen-1',
    entityType: 'location',
    name: 'Flooded Chamber',
    attributes: {
      environmentType: 'Ruined Temple Crypt',
      sensoryDetails: {
        sight: 'Ancient temple carvings submerged in dark water.',
        sound: 'Dripping water echoing.',
        smell: 'Stagnant moss.',
      },
      pointsOfInterest: ['Submerged altar', 'Temple archway with runes'],
      hazards: 'Slippery temple floor',
      connectedLocations: [],
      customFields: {},
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const entityRumor: Entity = {
    id: 'ent-rumor-1',
    scenarioId: 'scen-1',
    entityType: 'rumor_list',
    name: 'Local Gossip',
    attributes: {
      diceFormula: '1d6',
      entries: [
        {
          roll: 1,
          statement: 'The temple was abandoned a century ago.',
          veracity: 'True',
          sourceDc: 'DC 10 History',
        },
        {
          roll: 2,
          statement: 'No one who enters the temple ever returns.',
          veracity: 'Partially True',
          sourceDc: 'DC 12 Lore',
        },
      ],
      customFields: {},
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const placements: Record<string, Placement[]> = {
    'page-1': [
      {
        id: 'plc-1',
        pageId: 'page-1',
        entityId: 'ent-npc-1',
        columnIndex: 0,
        columnSpan: 1,
        displayOrder: 0,
        styleOverrides: {},
      },
      {
        id: 'plc-2',
        pageId: 'page-1',
        entityId: 'ent-rumor-1',
        columnIndex: 1,
        columnSpan: 1,
        displayOrder: 1,
        styleOverrides: {},
      },
    ],
    'page-2': [
      {
        id: 'plc-3',
        pageId: 'page-2',
        entityId: 'ent-loc-1',
        columnIndex: 0,
        columnSpan: 2,
        displayOrder: 0,
        styleOverrides: {},
      },
    ],
  };

  const mockContext: SearchStateContext = {
    currentScenario: mockScenario,
    pages: [page1, page2],
    entities: {
      [entityNpc.id]: entityNpc,
      [entityLocation.id]: entityLocation,
      [entityRumor.id]: entityRumor,
    },
    placements,
  };

  describe('findMatches', () => {
    it('returns empty array when query is empty or blank', () => {
      const matches = findMatches(mockContext, { query: '' });
      expect(matches).toEqual([]);
      const whitespaceMatches = findMatches(mockContext, { query: '   ' });
      expect(whitespaceMatches).toEqual([]);
    });

    it('finds matches across all pages by default (case-insensitive)', () => {
      // Query "temple" matches scenario title, page 1 title, page 2 title, npc name, npc demeanor, npc lore, loc environmentType, loc sensoryDetails, loc pointsOfInterest, loc hazards, rumor statement 1, rumor statement 2
      const matches = findMatches(mockContext, {
        query: 'temple',
        replacement: 'shrine',
      });

      expect(matches.length).toBeGreaterThan(5);

      // Verify scenario title match
      const scenarioMatch = matches.find((m) => m.targetType === 'scenario_title');
      expect(scenarioMatch).toBeDefined();
      expect(scenarioMatch?.originalValue).toBe('The Sunken Temple of Doom');
      expect(scenarioMatch?.replacedValue).toBe('The Sunken shrine of Doom');

      // Verify page titles
      const pageMatches = matches.filter((m) => m.targetType === 'page_title');
      expect(pageMatches.length).toBe(2);
      expect(pageMatches.map((m) => m.targetId)).toEqual(['page-1', 'page-2']);

      // Verify entity matches on page 1 (NPC and Rumor)
      const npcMatches = matches.filter((m) => m.entityId === 'ent-npc-1');
      expect(npcMatches.length).toBe(3); // name, demeanor, lore

      // Verify nested sensoryDetails and array pointsOfInterest in location on page 2
      const locSightMatch = matches.find(
        (m) => m.entityId === 'ent-loc-1' && m.fieldPath === 'attributes.sensoryDetails.sight'
      );
      expect(locSightMatch).toBeDefined();

      const locPoiMatch = matches.find(
        (m) => m.entityId === 'ent-loc-1' && m.fieldPath === 'attributes.pointsOfInterest.1'
      );
      expect(locPoiMatch).toBeDefined();
    });

    it('respects scope: specific page only searches that page and its placed entities', () => {
      const page2Matches = findMatches(mockContext, {
        query: 'temple',
        scope: 'page-2',
      });

      // Should only contain page-2 title and ent-loc-1 matches, NOT page-1 or ent-npc-1
      const pageIds = new Set(page2Matches.map((m) => m.pageId));
      expect(Array.from(pageIds)).toEqual(['page-2']);

      const entityIds = new Set(page2Matches.map((m) => m.entityId).filter(Boolean));
      expect(Array.from(entityIds)).toEqual(['ent-loc-1']);
    });

    it('respects matchCase option', () => {
      const caseInsensitive = findMatches(mockContext, {
        query: 'temple',
        matchCase: false,
      });

      const caseSensitive = findMatches(mockContext, {
        query: 'temple',
        matchCase: true,
      });

      // Lowercase "temple" is in "temple relics", "temple carvings", "temple floor", etc.
      // Uppercase "Temple" is in "Temple Entrance", "Temple Priest", etc.
      expect(caseSensitive.length).toBeLessThan(caseInsensitive.length);
      caseSensitive.forEach((m) => {
        expect(m.matchedText).toBe('temple');
      });
    });

    it('respects matchWholeWord option', () => {
      const wordContext: SearchStateContext = {
        ...mockContext,
        entities: {
          'ent-npc-1': {
            ...entityNpc,
            attributes: {
              ...entityNpc.attributes,
              lore: 'The cat was catching catfish in the dark.',
            },
          },
        },
      };

      const partialMatches = findMatches(wordContext, {
        query: 'cat',
        matchWholeWord: false,
      });
      const catMatches = partialMatches.filter((m) => m.fieldPath === 'attributes.lore');
      // "cat", "catching", "catfish" -> 3 matches
      expect(catMatches.length).toBe(3);

      const wholeWordMatches = findMatches(wordContext, {
        query: 'cat',
        matchWholeWord: true,
      });
      const catWholeWord = wholeWordMatches.filter((m) => m.fieldPath === 'attributes.lore');
      // Only "cat" -> 1 match
      expect(catWholeWord.length).toBe(1);
      expect(catWholeWord[0].matchedText).toBe('cat');
    });

    it('supports regular expressions when useRegex is true', () => {
      const matches = findMatches(mockContext, {
        query: 'DC \\d+',
        useRegex: true,
      });

      // Matches 'DC 10' and 'DC 12' in ent-rumor-1
      expect(matches.length).toBe(2);
      expect(matches.map((m) => m.matchedText)).toEqual(['DC 10', 'DC 12']);
    });

    it('handles special characters safely without crashing when useRegex is false', () => {
      const specialContext: SearchStateContext = {
        ...mockContext,
        entities: {
          'ent-npc-1': {
            ...entityNpc,
            attributes: {
              ...entityNpc.attributes,
              lore: 'Fires bolt: [1d10 + 2] (poison) damage.',
            },
          },
        },
      };

      const matches = findMatches(specialContext, {
        query: '[1d10 + 2]',
        useRegex: false,
      });

      expect(matches.length).toBe(1);
      expect(matches[0].matchedText).toBe('[1d10 + 2]');
    });
  });

  describe('applyReplacements', () => {
    it('replaces all matches correctly across scenario, pages, and entities', () => {
      const matches = findMatches(mockContext, {
        query: 'Temple',
        replacement: 'Sanctuary',
        matchCase: false,
      });

      const result = applyReplacements(mockContext, matches);

      expect(result.replacementCount).toBe(matches.length);

      // Verify Scenario Title was replaced
      expect(result.updatedScenario?.title).toContain('Sanctuary');
      expect(result.updatedScenario?.title).not.toContain('Temple');

      // Verify Page titles
      const updatedPage1 = result.updatedPages.find((p) => p.id === 'page-1');
      expect(updatedPage1?.title).toBe('Sanctuary Entrance');

      // Verify Entity attributes
      const updatedNpc = result.updatedEntities['ent-npc-1'];
      expect(updatedNpc.name).toBe('Sanctuary Priest Althea');
      expect(updatedNpc.attributes.demeanor).toContain('Sanctuary');
    });

    it('replaces only selected match IDs when provided', () => {
      const matches = findMatches(mockContext, {
        query: 'Temple',
        replacement: 'Sanctuary',
        matchCase: false,
      });

      // Select only the NPC matches
      const npcMatches = matches.filter((m) => m.entityId === 'ent-npc-1');
      const npcMatchIds = new Set(npcMatches.map((m) => m.id));
      const selected = matches.filter((m) => npcMatchIds.has(m.id));

      const result = applyReplacements(mockContext, selected);

      expect(result.replacementCount).toBe(selected.length);

      // Scenario title should remain UNCHANGED
      expect(result.updatedScenario?.title).toBe('The Sunken Temple of Doom');

      // Page 1 title should remain UNCHANGED
      const updatedPage1 = result.updatedPages.find((p) => p.id === 'page-1');
      expect(updatedPage1?.title).toBe('Temple Entrance');

      // NPC should be UPDATED
      const updatedNpc = result.updatedEntities['ent-npc-1'];
      expect(updatedNpc.name).toBe('Sanctuary Priest Althea');
    });

    it('correctly handles multiple occurrences in the same string without index drift', () => {
      const multiContext: SearchStateContext = {
        ...mockContext,
        entities: {
          'ent-npc-1': {
            ...entityNpc,
            attributes: {
              ...entityNpc.attributes,
              lore: 'The temple was grand, but another temple was hidden inside the temple.',
            },
          },
        },
      };

      const matches = findMatches(multiContext, {
        query: 'temple',
        replacement: 'cathedral',
        matchCase: false,
      });

      const loreMatches = matches.filter((m) => m.fieldPath === 'attributes.lore');
      expect(loreMatches.length).toBe(3);

      const result = applyReplacements(multiContext, loreMatches);
      const updatedNpc = result.updatedEntities['ent-npc-1'];

      expect(updatedNpc.attributes.lore).toBe(
        'The cathedral was grand, but another cathedral was hidden inside the cathedral.'
      );
    });

    it('can replace with empty string (deletion)', () => {
      const deleteContext: SearchStateContext = {
        ...mockContext,
        entities: {
          'ent-npc-1': {
            ...entityNpc,
            name: 'Old Elder Bob',
          },
        },
      };

      const matches = findMatches(deleteContext, {
        query: 'Old ',
        replacement: '',
      });

      const result = applyReplacements(deleteContext, matches);
      expect(result.updatedEntities['ent-npc-1'].name).toBe('Elder Bob');
    });
  });
});
