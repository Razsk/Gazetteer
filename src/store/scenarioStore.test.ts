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
});
