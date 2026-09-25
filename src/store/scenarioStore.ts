import { create } from 'zustand';
import { Entity, createDefaultEntity, EntityType } from '../domain/entities';

export interface Page {
  id: string;
  scenarioId: string;
  pageNumber: number;
  title?: string;
  pageSize: 'A4' | 'Letter';
  columnCount: 1 | 2;
  themeSkin: 'parchment' | 'cyberpunk' | 'gothic' | 'minimalist';
}

export interface Placement {
  id: string;
  pageId: string;
  entityId: string;
  columnIndex: number; // 0 = Col 1 / Full, 1 = Col 2
  columnSpan: 1 | 2;   // 1 col or spans both columns
  displayOrder: number;
  styleOverrides: {
    themeSkin?: 'parchment' | 'cyberpunk' | 'gothic' | 'minimalist';
    isCollapsed?: boolean;
    customTint?: string;
  };
}

export interface Scenario {
  id: string;
  title: string;
  ruleset: string;
  theme: string;
  targetPartyLevel: number;
  defaultThemeSkin: 'parchment' | 'cyberpunk' | 'gothic' | 'minimalist';
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioFileFormat {
  version: 1;
  scenario: Scenario;
  pages: Page[];
  entities: Record<string, Entity>;
  placements: Record<string, Placement[]>;
  exportedAt?: string;
}

export interface ScenarioStoreState {
  currentScenario: Scenario | null;
  pages: Page[];
  entities: Record<string, Entity>;
  placements: Record<string, Placement[]>; // pageId -> Placement[]
  selectedEntityIds: string[];
  activePageId: string | null;

  // Actions
  resetStore: () => void;
  createPage: () => Page;
  updatePage: (pageId: string, updates: Partial<Page>) => void;
  deletePage: (pageId: string) => void;
  movePage: (pageId: string, direction: 'up' | 'down') => void;
  reorderPages: (newPages: Page[]) => void;
  setActivePage: (pageId: string) => void;
  setScenarioMetadata: (meta: Partial<Scenario>) => void;

  addEntity: (entity: Entity) => void;
  updateEntity: (entityId: string, updates: Partial<Entity>) => void;
  deleteEntity: (entityId: string) => void;

  addPlacement: (pageId: string, entityId: string, columnIndex?: number, columnSpan?: 1 | 2) => Placement;
  updatePlacement: (pageId: string, placementId: string, updates: Partial<Placement>) => void;
  removePlacement: (pageId: string, placementId: string) => void;
  reorderPlacements: (pageId: string, newPlacements: Placement[]) => void;
  movePlacementOrder: (pageId: string, placementId: string, direction: 'up' | 'down') => void;
  movePlacement: (sourcePageId: string, targetPageId: string, placementId: string) => boolean;
  forkPlacement: (pageId: string, placementId: string) => string;

  toggleEntitySelection: (entityId: string) => void;
  clearSelection: () => void;
  selectAllOnPage: (pageId: string) => void;
  selectAllEntities: () => void;

  exportScenario: () => ScenarioFileFormat;
  loadScenario: (data: unknown) => boolean;
}

const initialScenarioId = 'scen-default';
const initialPageId = 'page-1';

const defaultScenario: Scenario = {
  id: initialScenarioId,
  title: 'Whispers of the Sunken Crypt',
  ruleset: 'D&D 5e',
  theme: 'Grimdark Swamp',
  targetPartyLevel: 4,
  defaultThemeSkin: 'parchment',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultInitialPage: Page = {
  id: initialPageId,
  scenarioId: initialScenarioId,
  pageNumber: 1,
  title: 'Entry & Outer Grounds',
  pageSize: 'A4',
  columnCount: 2,
  themeSkin: 'parchment',
};

export const useScenarioStore = create<ScenarioStoreState>((set, get) => ({
  currentScenario: defaultScenario,
  pages: [defaultInitialPage],
  entities: {},
  placements: { [initialPageId]: [] },
  selectedEntityIds: [],
  activePageId: initialPageId,

  resetStore: () => {
    set({
      currentScenario: { ...defaultScenario, id: `scen-${Date.now()}` },
      pages: [{ ...defaultInitialPage, id: `page-${Date.now()}` }],
      entities: {},
      placements: {},
      selectedEntityIds: [],
      activePageId: null,
    });
  },

  createPage: () => {
    const pages = get().pages;
    const newPage: Page = {
      id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scenarioId: get().currentScenario?.id || 'scen-default',
      pageNumber: pages.length + 1,
      title: `Page ${pages.length + 1}`,
      pageSize: 'A4',
      columnCount: 2,
      themeSkin: get().currentScenario?.defaultThemeSkin || 'parchment',
    };
    set((state) => ({
      pages: [...state.pages, newPage],
      placements: { ...state.placements, [newPage.id]: [] },
      activePageId: newPage.id,
    }));
    return newPage;
  },

  updatePage: (pageId: string, updates: Partial<Page>) => {
    set((state) => ({
      pages: state.pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p)),
    }));
  },

  deletePage: (pageId: string) => {
    set((state) => {
      const remainingPages = state.pages.filter((p) => p.id !== pageId);
      const renumbered = remainingPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
      const newPlacements = { ...state.placements };
      delete newPlacements[pageId];
      return {
        pages: renumbered,
        placements: newPlacements,
        activePageId: state.activePageId === pageId ? (renumbered[0]?.id || null) : state.activePageId,
      };
    });
  },

  movePage: (pageId: string, direction: 'up' | 'down') => {
    set((state) => {
      const index = state.pages.findIndex((p) => p.id === pageId);
      if (index === -1) return state;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= state.pages.length) return state;

      const newPages = [...state.pages];
      const [moved] = newPages.splice(index, 1);
      newPages.splice(targetIndex, 0, moved);

      const renumbered = newPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
      return { pages: renumbered };
    });
  },

  reorderPages: (newPages: Page[]) => {
    set({
      pages: newPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 })),
    });
  },

  setActivePage: (pageId: string) => set({ activePageId: pageId }),

  setScenarioMetadata: (meta: Partial<Scenario>) => {
    set((state) => ({
      currentScenario: state.currentScenario ? { ...state.currentScenario, ...meta, updatedAt: new Date().toISOString() } : null,
    }));
  },

  addEntity: (entity: Entity) => {
    set((state) => ({
      entities: { ...state.entities, [entity.id]: entity },
    }));
  },

  updateEntity: (entityId: string, updates: Partial<Entity>) => {
    set((state) => {
      const existing = state.entities[entityId];
      if (!existing) return state;
      const updated: Entity = {
        ...existing,
        ...updates,
        attributes: updates.attributes ? { ...existing.attributes, ...updates.attributes } : existing.attributes,
        updatedAt: new Date().toISOString(),
      };
      return {
        entities: { ...state.entities, [entityId]: updated },
      };
    });
  },

  deleteEntity: (entityId: string) => {
    set((state) => {
      const newEntities = { ...state.entities };
      delete newEntities[entityId];

      const newPlacements: Record<string, Placement[]> = {};
      for (const [pId, plist] of Object.entries(state.placements)) {
        newPlacements[pId] = plist.filter((pl) => pl.entityId !== entityId);
      }

      return {
        entities: newEntities,
        placements: newPlacements,
        selectedEntityIds: state.selectedEntityIds.filter((id) => id !== entityId),
      };
    });
  },

  addPlacement: (pageId: string, entityId: string, columnIndex = 0, columnSpan: 1 | 2 = 1) => {
    const currentList = get().placements[pageId] || [];
    const newPlacement: Placement = {
      id: `plc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pageId,
      entityId,
      columnIndex,
      columnSpan,
      displayOrder: currentList.length,
      styleOverrides: {},
    };

    set((state) => ({
      placements: {
        ...state.placements,
        [pageId]: [...(state.placements[pageId] || []), newPlacement],
      },
    }));

    return newPlacement;
  },

  updatePlacement: (pageId: string, placementId: string, updates: Partial<Placement>) => {
    set((state) => {
      const list = state.placements[pageId] || [];
      const updatedList = list.map((pl) => (pl.id === placementId ? { ...pl, ...updates } : pl));
      return {
        placements: { ...state.placements, [pageId]: updatedList },
      };
    });
  },

  removePlacement: (pageId: string, placementId: string) => {
    set((state) => {
      const list = state.placements[pageId] || [];
      return {
        placements: {
          ...state.placements,
          [pageId]: list.filter((pl) => pl.id !== placementId),
        },
      };
    });
  },

  reorderPlacements: (pageId: string, newPlacements: Placement[]) => {
    set((state) => ({
      placements: {
        ...state.placements,
        [pageId]: newPlacements.map((pl, idx) => ({ ...pl, displayOrder: idx })),
      },
    }));
  },

  movePlacementOrder: (pageId: string, placementId: string, direction: 'up' | 'down') => {
    const list = [...(get().placements[pageId] || [])].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = list.findIndex((p) => p.id === placementId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const updated = [...list];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    get().reorderPlacements(pageId, updated);
  },

  movePlacement: (sourcePageId: string, targetPageId: string, placementId: string) => {
    if (sourcePageId === targetPageId) return false;
    const state = get();
    const sourceList = state.placements[sourcePageId] || [];
    const placement = sourceList.find((p) => p.id === placementId);
    if (!placement) return false;

    const targetPageExists = state.pages.some((p) => p.id === targetPageId);
    if (!targetPageExists) return false;

    const targetList = state.placements[targetPageId] || [];
    const updatedPlacement: Placement = {
      ...placement,
      pageId: targetPageId,
      displayOrder: targetList.length,
    };

    set((s) => ({
      placements: {
        ...s.placements,
        [sourcePageId]: (s.placements[sourcePageId] || [])
          .filter((p) => p.id !== placementId)
          .map((p, idx) => ({ ...p, displayOrder: idx })),
        [targetPageId]: [...(s.placements[targetPageId] || []), updatedPlacement],
      },
    }));
    return true;
  },

  forkPlacement: (pageId: string, placementId: string) => {
    const state = get();
    const placement = (state.placements[pageId] || []).find((p) => p.id === placementId);
    if (!placement) return '';

    const originalEntity = state.entities[placement.entityId];
    if (!originalEntity) return '';

    const forkedId = `ent-fork-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const forkedEntity: Entity = {
      ...originalEntity,
      id: forkedId,
      name: `${originalEntity.name} (Copy)`,
      attributes: JSON.parse(JSON.stringify(originalEntity.attributes)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add forked entity and repoint placement to it
    state.addEntity(forkedEntity);
    state.updatePlacement(pageId, placementId, { entityId: forkedId });

    return forkedId;
  },

  toggleEntitySelection: (entityId: string) => {
    set((state) => {
      const exists = state.selectedEntityIds.includes(entityId);
      return {
        selectedEntityIds: exists
          ? state.selectedEntityIds.filter((id) => id !== entityId)
          : [...state.selectedEntityIds, entityId],
      };
    });
  },

  clearSelection: () => set({ selectedEntityIds: [] }),

  selectAllOnPage: (pageId: string) => {
    const placements = get().placements[pageId] || [];
    const ids = Array.from(new Set(placements.map((p) => p.entityId)));
    set({ selectedEntityIds: ids });
  },

  selectAllEntities: () => {
    const allIds = Object.keys(get().entities);
    set({ selectedEntityIds: allIds });
  },

  exportScenario: () => {
    const state = get();
    return {
      version: 1,
      scenario: state.currentScenario || defaultScenario,
      pages: state.pages,
      entities: state.entities,
      placements: state.placements,
      exportedAt: new Date().toISOString(),
    };
  },

  loadScenario: (data: unknown) => {
    if (!data || typeof data !== 'object') return false;
    const file = data as Partial<ScenarioFileFormat>;
    if (!file.scenario || !file.scenario.id || !file.scenario.title) return false;
    if (!Array.isArray(file.pages) || file.pages.length === 0) return false;
    if (!file.entities || typeof file.entities !== 'object') return false;
    if (!file.placements || typeof file.placements !== 'object') return false;

    set({
      currentScenario: file.scenario,
      pages: file.pages,
      entities: file.entities,
      placements: file.placements,
      selectedEntityIds: [],
      activePageId: file.pages[0]?.id || null,
    });
    return true;
  },
}));
