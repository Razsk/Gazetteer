import { describe, it, expect } from 'vitest';
import {
  EntitySchema,
  createDefaultEntity,
  NpcAttributesSchema,
  TrapAttributesSchema
} from './entities';

describe('Entity Domain Schema (Seam 1)', () => {
  it('validates a canonical NPC entity with required attributes', () => {
    const rawNpc = {
      id: 'npc-1',
      scenarioId: 'scen-1',
      entityType: 'npc',
      name: 'Kaelen the Herbalist',
      attributes: {
        role: 'Informant',
        demeanor: 'Nervous and guarded',
        lore: 'Searches for rare marsh herbs.',
        hitPoints: 12,
        armorClass: 11,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const parsed = EntitySchema.parse(rawNpc);
    expect(parsed.entityType).toBe('npc');
    expect(parsed.name).toBe('Kaelen the Herbalist');
  });

  it('validates a canonical Trap entity with triggers and DCs', () => {
    const rawTrap = {
      id: 'trap-1',
      scenarioId: 'scen-1',
      entityType: 'trap',
      name: 'Tripwire Crossbow',
      attributes: {
        trigger: 'Taut wire across corridor',
        detectionDc: 13,
        disarmDc: 12,
        effect: 'Fires poisoned iron bolt dealing 1d10 piercing damage',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const parsed = EntitySchema.parse(rawTrap);
    expect(parsed.entityType).toBe('trap');
    expect((parsed.attributes as any).detectionDc).toBe(13);
  });

  it('generates a default valid entity for any entity type', () => {
    const defaultNpc = createDefaultEntity('scen-1', 'npc');
    expect(defaultNpc.entityType).toBe('npc');
    expect(defaultNpc.name).toBe('New NPC');
    expect(EntitySchema.safeParse(defaultNpc).success).toBe(true);
  });
});
