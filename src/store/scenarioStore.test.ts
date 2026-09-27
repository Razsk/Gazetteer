import { describe, it, expect, beforeEach } from 'vitest';
import { useScenarioStore } from './scenarioStore';
import { createDefaultEntity } from '../domain/entities';

describe('Scenario & Reactive Placement Store (Seam 2)', () => {
  beforeEach(() => {
    useScenarioStore.getState().resetStore();
  });

  it('initializes with a default scenario and initial page', () => {
    const state = useScenarioStore.getState();
    expect(state.currentScenario).not.toBeNull();
    expect(state.pages.length).toBeGreaterThan(0);
    expect(state.pages[0].pageNumber).toBe(1);
  });

  it('places an entity on a page and retrieves its placement', () => {
    const store = useScenarioStore.getState();
    const pageId = store.pages[0].id;
    const npc = createDefaultEntity(store.currentScenario!.id, 'npc', 'Gareth the Bold');

    store.addEntity(npc);
    store.addPlacement(pageId, npc.id, 0, 1);

    const updated = useScenarioStore.getState();
    expect(updated.entities[npc.id]).toBeDefined();
    expect(updated.placements[pageId]).toHaveLength(1);
    expect(updated.placements[pageId][0].entityId).toBe(npc.id);
  });

  it('updates an entity and instantly reflects across multiple placements on different pages', () => {
    const store = useScenarioStore.getState();
    const page1Id = store.pages[0].id;
    const page2 = store.createPage();
    const page2Id = page2.id;

    const trap = createDefaultEntity(store.currentScenario!.id, 'trap', 'Pit Trap');
    store.addEntity(trap);

    // Place same canonical trap on page 1 and page 2
    store.addPlacement(page1Id, trap.id, 0, 1);
    store.addPlacement(page2Id, trap.id, 1, 1);

    // Mutate entity attributes (e.g. from an edit on page 2)
    store.updateEntity(trap.id, {
      name: 'Deep Spiked Pit Trap',
      attributes: { ...trap.attributes, detectionDc: 16 },
    });

    const refreshed = useScenarioStore.getState();
    // Both page placements reference the same entity ID and see the updated name and DC
    expect(refreshed.entities[trap.id].name).toBe('Deep Spiked Pit Trap');
    expect(refreshed.entities[trap.id].attributes.detectionDc).toBe(16);
    expect(refreshed.placements[page1Id][0].entityId).toBe(trap.id);
    expect(refreshed.placements[page2Id][0].entityId).toBe(trap.id);
  });

  it('can detach/fork a placement into an independent clone entity', () => {
    const store = useScenarioStore.getState();
    const page1Id = store.pages[0].id;
    const item = createDefaultEntity(store.currentScenario!.id, 'item', 'Health Potion');
    store.addEntity(item);
    const placement = store.addPlacement(page1Id, item.id, 0, 1);

    const forkedEntityId = store.forkPlacement(page1Id, placement.id);
    const updated = useScenarioStore.getState();

    expect(forkedEntityId).not.toBe(item.id);
    expect(updated.entities[forkedEntityId]).toBeDefined();
    expect(updated.entities[forkedEntityId].name).toBe('Health Potion (Copy)');
    expect(updated.placements[page1Id][0].entityId).toBe(forkedEntityId);
  });

  it('clones a placement as a synchronized instance sharing the same entityId (does not fork)', () => {
    const store = useScenarioStore.getState();
    const page1Id = store.pages[0].id;
    const page2 = store.createPage();
    const page2Id = page2.id;

    const npc = createDefaultEntity(store.currentScenario!.id, 'npc', 'Archmage Valen');
    store.addEntity(npc);
    const p1 = store.addPlacement(page1Id, npc.id, 0, 1);

    // Clone on same page
    const p1Clone = store.clonePlacement(page1Id, p1.id);
    expect(p1Clone).not.toBeNull();
    expect(p1Clone!.entityId).toBe(npc.id);
    expect(p1Clone!.id).not.toBe(p1.id);

    // Clone to another page
    const p2Clone = store.clonePlacement(page1Id, p1.id, page2Id);
    expect(p2Clone).not.toBeNull();
    expect(p2Clone!.entityId).toBe(npc.id);
    expect(p2Clone!.pageId).toBe(page2Id);

    // Verify entity count in store: STILL only 1 canonical entity (no fork!)
    const state = useScenarioStore.getState();
    expect(Object.keys(state.entities)).toHaveLength(1);
    expect(state.entities[npc.id].name).toBe('Archmage Valen');

    // Update entity attributes: All 3 placements stay in sync
    store.updateEntity(npc.id, {
      name: 'Archmage Valen (Empowered)',
      attributes: { ...npc.attributes, hitPoints: 95 },
    });

    const refreshed = useScenarioStore.getState();
    expect(refreshed.entities[npc.id].name).toBe('Archmage Valen (Empowered)');
    expect(refreshed.entities[p1.entityId].name).toBe('Archmage Valen (Empowered)');
    expect(refreshed.entities[p1Clone!.entityId].name).toBe('Archmage Valen (Empowered)');
    expect(refreshed.entities[p2Clone!.entityId].name).toBe('Archmage Valen (Empowered)');
  });

  it('moves a placement directly to another page', () => {
    const store = useScenarioStore.getState();
    const page1Id = store.pages[0].id;
    const page2 = store.createPage();
    const page2Id = page2.id;

    const npc = createDefaultEntity(store.currentScenario!.id, 'npc', 'Merrick the Guide');
    store.addEntity(npc);
    const placement = store.addPlacement(page1Id, npc.id, 0, 1);

    expect(useScenarioStore.getState().placements[page1Id]).toHaveLength(1);
    expect(useScenarioStore.getState().placements[page2Id]).toHaveLength(0);

    const success = store.movePlacement(page1Id, page2Id, placement.id);
    expect(success).toBe(true);

    const updated = useScenarioStore.getState();
    expect(updated.placements[page1Id]).toHaveLength(0);
    expect(updated.placements[page2Id]).toHaveLength(1);
    expect(updated.placements[page2Id][0].id).toBe(placement.id);
    expect(updated.placements[page2Id][0].pageId).toBe(page2Id);
    expect(updated.placements[page2Id][0].entityId).toBe(npc.id);
  });

  it('renames and reorders pages with correct sequential page numbers', () => {
    const store = useScenarioStore.getState();
    const page1 = store.pages[0];
    const page2 = store.createPage();
    const page3 = store.createPage();

    // Renaming
    store.updatePage(page1.id, { title: 'Dungeon Entrance' });
    expect(useScenarioStore.getState().pages[0].title).toBe('Dungeon Entrance');

    // Reordering: move page 3 up to middle
    store.movePage(page3.id, 'up');
    let pages = useScenarioStore.getState().pages;
    expect(pages[0].id).toBe(page1.id);
    expect(pages[1].id).toBe(page3.id);
    expect(pages[2].id).toBe(page2.id);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[1].pageNumber).toBe(2);
    expect(pages[2].pageNumber).toBe(3);

    // Move page 1 down
    store.movePage(page1.id, 'down');
    pages = useScenarioStore.getState().pages;
    expect(pages[0].id).toBe(page3.id);
    expect(pages[1].id).toBe(page1.id);
    expect(pages[2].id).toBe(page2.id);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[1].pageNumber).toBe(2);
    expect(pages[2].pageNumber).toBe(3);
  });

  it('exports and loads scenario data faithfully', () => {
    const store = useScenarioStore.getState();
    const pageId = store.pages[0].id;
    const enemy = createDefaultEntity(store.currentScenario!.id, 'enemy', 'Bog Hag');
    store.addEntity(enemy);
    store.addPlacement(pageId, enemy.id, 0, 1);
    store.setScenarioMetadata({ title: 'Curse of the Sunken Marsh' });

    const exported = store.exportScenario();
    expect(exported.version).toBe(1);
    expect(exported.scenario.title).toBe('Curse of the Sunken Marsh');
    expect(exported.entities[enemy.id]).toBeDefined();
    expect(exported.placements[pageId]).toHaveLength(1);

    // Reset store
    store.resetStore();
    expect(useScenarioStore.getState().currentScenario?.title).not.toBe('Curse of the Sunken Marsh');

    // Load exported scenario
    const loaded = store.loadScenario(exported);
    expect(loaded).toBe(true);

    const restored = useScenarioStore.getState();
    expect(restored.currentScenario?.title).toBe('Curse of the Sunken Marsh');
    expect(restored.entities[enemy.id].name).toBe('Bog Hag');
    expect(restored.placements[pageId]).toHaveLength(1);
  });

  it('reorders placements via reorderPlacements and movePlacementOrder', () => {
    const store = useScenarioStore.getState();
    const pageId = store.pages[0].id;

    const npc1 = createDefaultEntity(store.currentScenario!.id, 'npc', 'Guard 1');
    const npc2 = createDefaultEntity(store.currentScenario!.id, 'npc', 'Guard 2');
    const npc3 = createDefaultEntity(store.currentScenario!.id, 'npc', 'Guard 3');

    store.addEntity(npc1);
    store.addEntity(npc2);
    store.addEntity(npc3);

    const p1 = store.addPlacement(pageId, npc1.id);
    const p2 = store.addPlacement(pageId, npc2.id);
    const p3 = store.addPlacement(pageId, npc3.id);

    // Initial order: p1, p2, p3
    let list = useScenarioStore.getState().placements[pageId];
    expect(list.map((p) => p.id)).toEqual([p1.id, p2.id, p3.id]);

    // Move p3 up
    store.movePlacementOrder(pageId, p3.id, 'up');
    list = useScenarioStore.getState().placements[pageId];
    expect(list.map((p) => p.id)).toEqual([p1.id, p3.id, p2.id]);
    expect(list[0].displayOrder).toBe(0);
    expect(list[1].displayOrder).toBe(1);
    expect(list[2].displayOrder).toBe(2);

    // Move p1 down
    store.movePlacementOrder(pageId, p1.id, 'down');
    list = useScenarioStore.getState().placements[pageId];
    expect(list.map((p) => p.id)).toEqual([p3.id, p1.id, p2.id]);

    // Arbitrary reorder (e.g. from dnd-kit arrayMove)
    store.reorderPlacements(pageId, [p2, p1, p3]);
    list = useScenarioStore.getState().placements[pageId];
    expect(list.map((p) => p.id)).toEqual([p2.id, p1.id, p3.id]);
    expect(list[0].displayOrder).toBe(0);
    expect(list[1].displayOrder).toBe(1);
    expect(list[2].displayOrder).toBe(2);
  });

  it('creates a new blank scenario with custom settings', () => {
    const store = useScenarioStore.getState();
    store.createNewScenario({
      title: 'Tomb of the Iron Lich',
      ruleset: 'Shadowdark',
      theme: 'Grimdark Dungeon',
      targetPartyLevel: 5,
      defaultThemeSkin: 'gothic',
      pageSize: 'A4',
      columnCount: 2,
      initialPageTitle: 'Tomb Entrance',
      seedSampleContent: false,
    });

    const state = useScenarioStore.getState();
    expect(state.currentScenario?.title).toBe('Tomb of the Iron Lich');
    expect(state.currentScenario?.ruleset).toBe('Shadowdark');
    expect(state.currentScenario?.theme).toBe('Grimdark Dungeon');
    expect(state.currentScenario?.targetPartyLevel).toBe(5);
    expect(state.currentScenario?.defaultThemeSkin).toBe('gothic');
    expect(state.pages).toHaveLength(1);
    expect(state.pages[0].title).toBe('Tomb Entrance');
    expect(state.pages[0].themeSkin).toBe('gothic');
    expect(Object.keys(state.entities)).toHaveLength(0);
    expect(state.placements[state.pages[0].id]).toHaveLength(0);
    expect(state.activePageId).toBe(state.pages[0].id);
  });

  it('creates a new scenario with sample starter content', () => {
    const store = useScenarioStore.getState();
    store.createNewScenario({
      title: 'The Sunken Temple',
      ruleset: 'D&D 5e',
      theme: 'Sunken Ruins',
      targetPartyLevel: 3,
      defaultThemeSkin: 'parchment',
      seedSampleContent: true,
    });

    const state = useScenarioStore.getState();
    expect(state.currentScenario?.title).toBe('The Sunken Temple');
    expect(state.pages).toHaveLength(1);
    expect(Object.keys(state.entities)).toHaveLength(4);
    expect(state.placements[state.pages[0].id]).toHaveLength(4);
  });

  it('supports flowMode configuration and column management on pages', () => {
    const store = useScenarioStore.getState();
    const page = store.pages[0];
    expect(page.flowMode).toBe('balanced');

    // Update flow mode to alternating
    store.updatePage(page.id, { flowMode: 'alternating' });
    expect(useScenarioStore.getState().pages[0].flowMode).toBe('alternating');

    // Update flow mode to manual
    store.updatePage(page.id, { flowMode: 'manual' });
    expect(useScenarioStore.getState().pages[0].flowMode).toBe('manual');

    // Add placement and change its column index
    const npc = createDefaultEntity(store.currentScenario!.id, 'npc', 'Scout');
    store.addEntity(npc);
    const placement = store.addPlacement(page.id, npc.id, 0, 1);
    expect(placement.columnIndex).toBe(0);

    store.updatePlacement(page.id, placement.id, { columnIndex: 1 });
    expect(useScenarioStore.getState().placements[page.id][0].columnIndex).toBe(1);

    // Export and reload verifies flowMode persistence
    const exported = store.exportScenario();
    expect(exported.pages[0].flowMode).toBe('manual');

    store.resetStore();
    store.loadScenario(exported);
    expect(useScenarioStore.getState().pages[0].flowMode).toBe('manual');
  });

  it('creates a new page and populates it with newly generated elements and balanced placements', () => {
    const store = useScenarioStore.getState();
    const initialPagesCount = store.pages.length;

    const { page, createdEntities } = store.createPageWithElements(
      {
        title: 'Sunken Catacombs',
        columnCount: 2,
        themeSkin: 'gothic',
      },
      [
        {
          name: 'The Flooded Vault',
          entityType: 'area',
          columnSpan: 2,
          attributes: { mapKey: '2A', dimensionsLighting: 'Dark and flooded' },
        },
        {
          name: 'Warlock Lord',
          entityType: 'enemy',
          columnSpan: 1,
          attributes: { hitPoints: 50, armorClass: 15 },
        },
        {
          name: 'Necrotic Rune Trap',
          entityType: 'trap',
          columnSpan: 1,
          attributes: { detectionDc: 15, disarmDc: 14 },
        },
        {
          name: 'Cursed Relic',
          entityType: 'treasure',
          columnSpan: 1,
          attributes: { value: '500 gp', rarity: 'Rare' },
        },
      ]
    );

    const updated = useScenarioStore.getState();

    // Verify new page
    expect(updated.pages).toHaveLength(initialPagesCount + 1);
    expect(page.title).toBe('Sunken Catacombs');
    expect(page.columnCount).toBe(2);
    expect(page.themeSkin).toBe('gothic');
    expect(updated.activePageId).toBe(page.id);

    // Verify created entities
    expect(createdEntities).toHaveLength(4);
    createdEntities.forEach((ent) => {
      expect(updated.entities[ent.id]).toBeDefined();
      expect(updated.entities[ent.id].name).toBe(ent.name);
    });

    // Verify placements on the new page
    const placements = updated.placements[page.id];
    expect(placements).toHaveLength(4);

    // Area (columnSpan: 2) placed on col 0
    expect(placements[0].columnSpan).toBe(2);
    expect(placements[0].columnIndex).toBe(0);

    // Next 1-column elements distributed across col 0 and col 1
    expect(placements[1].columnSpan).toBe(1);
    expect(placements[1].columnIndex).toBe(0);

    expect(placements[2].columnSpan).toBe(1);
    expect(placements[2].columnIndex).toBe(1);

    expect(placements[3].columnSpan).toBe(1);
    expect(placements[3].columnIndex).toBe(0);
  });

  it('performs search and replace across all pages and mutates state reactively', () => {
    const store = useScenarioStore.getState();
    const page1Id = store.pages[0].id;
    const page2 = store.createPage({ title: 'Goblin Cave Page' });
    const page2Id = page2.id;

    const npc = createDefaultEntity(store.currentScenario!.id, 'npc', 'Goblin Shaman');
    npc.attributes = {
      ...npc.attributes,
      lore: 'The goblin reveres the ancient crystal.',
    };
    store.addEntity(npc);
    store.addPlacement(page1Id, npc.id, 0, 1);

    const enemy = createDefaultEntity(store.currentScenario!.id, 'enemy', 'Goblin Warrior');
    enemy.attributes = {
      ...enemy.attributes,
      tactics: 'Goblin tactics rely on swarming.',
    };
    store.addEntity(enemy);
    store.addPlacement(page2Id, enemy.id, 0, 1);

    // Run search and replace for 'goblin' -> 'orc' across all pages
    const result = useScenarioStore.getState().searchAndReplace({
      query: 'goblin',
      replacement: 'orc',
      matchCase: false,
    });

    expect(result.replacementCount).toBeGreaterThanOrEqual(4);
    expect(result.pagesUpdatedCount).toBeGreaterThanOrEqual(1);
    expect(result.entitiesUpdatedCount).toBe(2);

    const refreshed = useScenarioStore.getState();
    expect(refreshed.entities[npc.id].name).toBe('orc Shaman');
    expect(refreshed.entities[npc.id].attributes.lore).toContain('orc reveres');
    expect(refreshed.entities[enemy.id].name).toBe('orc Warrior');
    expect(refreshed.entities[enemy.id].attributes.tactics).toContain('orc tactics');
    expect(refreshed.pages.find((p) => p.id === page2Id)?.title).toBe('orc Cave Page');
  });
});



