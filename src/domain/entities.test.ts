import { describe, it, expect } from 'vitest';
import {
  EntitySchema,
  createDefaultEntity,
  NpcAttributesSchema,
  TrapAttributesSchema,
  AreaAttributesSchema,
  LocationAttributesSchema,
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

  it('validates a canonical Trap entity with triggers and detection clue / disarm', () => {
    const rawTrap = {
      id: 'trap-1',
      scenarioId: 'scen-1',
      entityType: 'trap',
      name: 'Tripwire Crossbow',
      attributes: {
        trigger: 'Taut wire across corridor',
        detectionClue: 'Faint glint of copper wire across the flagstones',
        disarm: 'Carefully snip the wire while holding tension on the counterweight',
        detectionDc: 13,
        disarmDc: 12,
        effect: 'Fires poisoned iron bolt dealing 1d10 piercing damage',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const parsed = EntitySchema.parse(rawTrap);
    expect(parsed.entityType).toBe('trap');
    expect((parsed.attributes as any).detectionClue).toBe('Faint glint of copper wire across the flagstones');
    expect((parsed.attributes as any).disarm).toBe('Carefully snip the wire while holding tension on the counterweight');
    expect((parsed.attributes as any).detectionDc).toBe(13);
  });

  it('generates a default valid entity for any entity type', () => {
    const defaultNpc = createDefaultEntity('scen-1', 'npc');
    expect(defaultNpc.entityType).toBe('npc');
    expect(defaultNpc.name).toBe('New NPC');
    expect(EntitySchema.safeParse(defaultNpc).success).toBe(true);
  });

  it('generates and validates both versions of random_event_list: random event and progress clock', () => {
    // 1. Random Event Table version
    const randomEventEntity = createDefaultEntity('scen-1', 'random_event_list');
    expect(randomEventEntity.entityType).toBe('random_event_list');
    expect(randomEventEntity.name).toBe('New Wandering Encounters');
    expect(randomEventEntity.attributes.eventListType).toBe('random_event');
    expect(randomEventEntity.attributes.diceFormula).toBe('1d6');
    expect(randomEventEntity.attributes.entries.length).toBeGreaterThan(0);
    expect(EntitySchema.safeParse(randomEventEntity).success).toBe(true);

    // 2. Progress Clock version
    const clockEntity = createDefaultEntity('scen-1', 'random_event_list', undefined, 'progress_clock');
    expect(clockEntity.entityType).toBe('random_event_list');
    expect(clockEntity.name).toBe('New Progress Clock');
    expect(clockEntity.attributes.eventListType).toBe('progress_clock');
    expect(clockEntity.attributes.segments).toBe(4);
    expect(clockEntity.attributes.currentProgress).toBe(0);
    expect(clockEntity.attributes.outcome).toBeTruthy();
    expect(clockEntity.attributes.entries.length).toBe(4);
    expect(EntitySchema.safeParse(clockEntity).success).toBe(true);
  });

  it('validates and normalizes Area entity contents attribute from array or string', () => {
    // 1. Array of contents
    const areaWithArray = AreaAttributesSchema.parse({
      mapKey: '1A',
      contents: ['Iron grate', 'Stone pedestal'],
    });
    expect(areaWithArray.contents).toEqual(['Iron grate', 'Stone pedestal']);

    // 2. Multiline string with bullets
    const areaWithString = AreaAttributesSchema.parse({
      mapKey: '1B',
      contents: '• First treasure coffer\n• Second rusty cage',
    });
    expect(areaWithString.contents).toEqual(['First treasure coffer', 'Second rusty cage']);

    // 3. Single string
    const areaWithSingle = AreaAttributesSchema.parse({
      mapKey: '1C',
      contents: 'A single cracked pedestal',
    });
    expect(areaWithSingle.contents).toEqual(['A single cracked pedestal']);

    // 4. Default empty contents
    const areaDefault = AreaAttributesSchema.parse({});
    expect(areaDefault.contents).toEqual([]);
  });

  it('validates and normalizes Location entity attributes with string and array/object formats', () => {
    // 1. Strings with semicolons/commas (like AI clipboard responses)
    const locFromString = LocationAttributesSchema.parse({
      environmentType: 'Inverted Ruined Chapel Wedged in a Chasm',
      sensoryDetails: 'Sight: Inverted chapel. Sound: Roar of cataracts. Smell: River silt.',
      pointsOfInterest: 'The Inverted Belfry: Refuge ledge; Precarious Bone-Span: 40-foot sway bridge',
      hazards: 'Structural Instability: Severe impacts; Slick Inverted Masonry: +1t to Agility',
      connectedLocations: 'Surface Sinkhole Rim, The Leviathan Rib-Walks',
    });

    expect(locFromString.environmentType).toBe('Inverted Ruined Chapel Wedged in a Chasm');
    expect(locFromString.sensoryDetails).toBe('Sight: Inverted chapel. Sound: Roar of cataracts. Smell: River silt.');
    expect(locFromString.pointsOfInterest).toEqual([
      'The Inverted Belfry: Refuge ledge',
      'Precarious Bone-Span: 40-foot sway bridge',
    ]);
    expect(locFromString.hazards).toBe('Structural Instability: Severe impacts; Slick Inverted Masonry: +1t to Agility');
    expect(locFromString.connectedLocations).toEqual([
      'Surface Sinkhole Rim',
      'The Leviathan Rib-Walks',
    ]);

    // 2. Structured object & array format
    const locFromStructured = LocationAttributesSchema.parse({
      environmentType: 'Wilderness',
      sensoryDetails: {
        sight: 'Dim light filtering through mist',
        sound: 'Crickets chirping',
        smell: 'Damp pine needles',
      },
      pointsOfInterest: ['Ancient stone altar', 'Hidden cave behind waterfall'],
      hazards: ['Unstable footing', 'Poisonous nettles'],
      connectedLocations: ['Forest Clearing', 'Old Watchtower'],
    });

    expect(locFromStructured.sensoryDetails).toEqual({
      sight: 'Dim light filtering through mist',
      sound: 'Crickets chirping',
      smell: 'Damp pine needles',
    });
    expect(locFromStructured.pointsOfInterest).toEqual([
      'Ancient stone altar',
      'Hidden cave behind waterfall',
    ]);
    expect(locFromStructured.hazards).toBe('Unstable footing; Poisonous nettles');
    expect(locFromStructured.connectedLocations).toEqual([
      'Forest Clearing',
      'Old Watchtower',
    ]);
  });
});
