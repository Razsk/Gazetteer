import { z } from 'zod';

export const EntityTypeEnum = z.enum([
  'npc',
  'enemy',
  'location',
  'item',
  'trap',
  'treasure',
  'region',
  'adventure_site',
  'area',
  'random_event_list',
  'rumor_list',
  'image',
  'generic_list',
]);

export type EntityType = z.infer<typeof EntityTypeEnum>;

// Extensible custom fields map for arbitrary system-specific homebrew
const CustomFieldsSchema = z.record(z.string(), z.any()).default({});

// 1. NPC Attributes
export const NpcAttributesSchema = z.object({
  role: z.string().default('Citizen'),
  demeanor: z.string().default(''),
  lore: z.string().default(''),
  motivation: z.string().default(''),
  statBlock: z.string().optional(),
  hitPoints: z.number().int().optional(),
  armorClass: z.number().int().optional(),
  customFields: CustomFieldsSchema,
});
export type NpcAttributes = z.infer<typeof NpcAttributesSchema>;

// 2. Enemy Attributes
export const EnemyAttributesSchema = z.object({
  creatureType: z.string().default('Monster'),
  challengeRating: z.string().default('1'),
  hitPoints: z.number().int().default(10),
  armorClass: z.number().int().default(10),
  speed: z.string().default('30 ft'),
  actions: z.string().default(''),
  tactics: z.string().default(''),
  lore: z.string().default(''),
  customFields: CustomFieldsSchema,
});
export type EnemyAttributes = z.infer<typeof EnemyAttributesSchema>;

// 3. Location Attributes
export const LocationAttributesSchema = z.object({
  environmentType: z.string().default('Wilderness'),
  sensoryDetails: z.object({
    sight: z.string().default(''),
    sound: z.string().default(''),
    smell: z.string().default(''),
  }).default({ sight: '', sound: '', smell: '' }),
  pointsOfInterest: z.array(z.string()).default([]),
  hazards: z.string().default(''),
  connectedLocations: z.array(z.string()).default([]),
  customFields: CustomFieldsSchema,
});
export type LocationAttributes = z.infer<typeof LocationAttributesSchema>;

// 4. Item Attributes
export const ItemAttributesSchema = z.object({
  rarity: z.string().default('Common'),
  value: z.string().default('10 gp'),
  physicalDescription: z.string().default(''),
  mechanicalProperties: z.string().default(''),
  lore: z.string().default(''),
  customFields: CustomFieldsSchema,
});
export type ItemAttributes = z.infer<typeof ItemAttributesSchema>;

// 5. Trap Attributes
export const TrapAttributesSchema = z.object({
  trigger: z.string().default('Pressure plate'),
  detectionClue: z.string().default(''),
  disarm: z.string().default(''),
  detectionDc: z.number().int().optional(),
  disarmDc: z.number().int().optional(),
  effect: z.string().default(''),
  resetConditions: z.string().default('Manual'),
  customFields: CustomFieldsSchema,
});
export type TrapAttributes = z.infer<typeof TrapAttributesSchema>;

// 6. Treasure Attributes
export const TreasureAttributesSchema = z.object({
  value: z.string().default('50 gp'),
  rarity: z.string().default('Uncommon'),
  contents: z.string().default(''),
  hiddenCondition: z.string().default(''),
  customFields: CustomFieldsSchema,
});
export type TreasureAttributes = z.infer<typeof TreasureAttributesSchema>;

// 7. Region Attributes
export const RegionAttributesSchema = z.object({
  climateTerrain: z.string().default(''),
  factionsPolitics: z.string().default(''),
  travelMechanics: z.string().default(''),
  loreHistory: z.string().default(''),
  linkedSites: z.array(z.string()).default([]),
  customFields: CustomFieldsSchema,
});
export type RegionAttributes = z.infer<typeof RegionAttributesSchema>;

// 8. Adventure Site Attributes
export const AdventureSiteAttributesSchema = z.object({
  siteType: z.string().default('Dungeon'),
  entranceAccess: z.string().default(''),
  alertState: z.enum(['passive', 'on_alert', 'locked_down', 'evacuated']).default('passive'),
  environmentalHazards: z.string().default(''),
  linkedAreas: z.array(z.string()).default([]),
  customFields: CustomFieldsSchema,
});
export type AdventureSiteAttributes = z.infer<typeof AdventureSiteAttributesSchema>;

// 9. Area Attributes
export const AreaAttributesSchema = z.object({
  mapKey: z.string().default('1'),
  dimensionsLighting: z.string().default(''),
  sensoryBox: z.string().default(''),
  contents: z
    .union([z.array(z.string()), z.string()])
    .transform((val) => {
      if (Array.isArray(val)) {
        return val.map((s) => String(s).trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
      }
      if (typeof val === 'string') {
        const split = val
          .split(/\r?\n/)
          .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
          .filter(Boolean);
        return split.length > 0 ? split : (val.trim() ? [val.trim()] : []);
      }
      return [];
    })
    .default([]),
  exitsConnections: z.string().default(''),
  customFields: CustomFieldsSchema,
});
export type AreaAttributes = z.infer<typeof AreaAttributesSchema>;

// 10. Random Event List Attributes
export const RandomEventListAttributesSchema = z.object({
  eventListType: z.enum(['random_event', 'progress_clock']).default('random_event'),
  diceFormula: z.string().default('1d6'),
  frequencyTrigger: z.string().default('Every 2 hours'),
  segments: z.number().int().min(2).default(4),
  currentProgress: z.number().int().min(0).default(0),
  clockType: z.string().default('Escalation'),
  outcome: z.string().default(''),
  entries: z.array(
    z.object({
      roll: z.union([z.number(), z.array(z.number())]).default(1),
      title: z.string().default(''),
      description: z.string().default(''),
      linkedEntities: z.array(z.string()).optional(),
    })
  ).default([]),
  customFields: CustomFieldsSchema,
});
export type RandomEventListAttributes = z.infer<typeof RandomEventListAttributesSchema>;

// 11. Rumor List Attributes
export const RumorListAttributesSchema = z.object({
  diceFormula: z.string().default('1d6'),
  entries: z.array(
    z.object({
      roll: z.number(),
      statement: z.string(),
      veracity: z.enum(['True', 'Partially True', 'False/Deceptive']).default('True'),
      sourceDc: z.string().default(''),
      targetLink: z.string().optional(),
    })
  ).default([]),
  customFields: CustomFieldsSchema,
});
export type RumorListAttributes = z.infer<typeof RumorListAttributesSchema>;

// 12. Image Attributes
export const ImageAttributesSchema = z.object({
  prompt: z.string().default(''),
  negativePrompt: z.string().optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:2', '21:9']).default('1:1'),
  stylePreset: z.enum(['oil_painting', 'parchment_sketch', 'isometric_map', 'dark_fantasy', 'watercolor']).default('parchment_sketch'),
  assetUrl: z.string().nullable().default(null),
  thumbnailUrl: z.string().nullable().default(null),
  generationStatus: z.enum(['draft', 'queued', 'rendering', 'ready', 'failed']).default('draft'),
  caption: z.string().optional(),
  frameStyle: z.enum(['borderless', 'ornate_parchment', 'vignette', 'clean_cut']).default('ornate_parchment'),
  fitMode: z.enum(['cover', 'contain']).default('cover'),
  customFields: CustomFieldsSchema,
});
export type ImageAttributes = z.infer<typeof ImageAttributesSchema>;

// 13. Generic List Attributes
export const GenericListAttributesSchema = z.object({
  context: z.string().default(''),
  listStyle: z.enum(['bullet', 'numbered']).default('bullet'),
  items: z.array(z.string()).default([
    'First item',
    'Second item',
    'Third item',
  ]),
  customFields: CustomFieldsSchema,
});
export type GenericListAttributes = z.infer<typeof GenericListAttributesSchema>;

// Discriminated Union of Entity Attributes
export const EntityAttributesSchema = z.union([
  NpcAttributesSchema,
  EnemyAttributesSchema,
  LocationAttributesSchema,
  ItemAttributesSchema,
  TrapAttributesSchema,
  TreasureAttributesSchema,
  RegionAttributesSchema,
  AdventureSiteAttributesSchema,
  AreaAttributesSchema,
  RandomEventListAttributesSchema,
  RumorListAttributesSchema,
  ImageAttributesSchema,
  GenericListAttributesSchema,
]);

// Top-Level Canonical Entity Schema
export const EntitySchema = z.object({
  id: z.string().uuid().or(z.string()),
  scenarioId: z.string().uuid().or(z.string()),
  entityType: EntityTypeEnum,
  name: z.string().min(1),
  attributes: z.record(z.string(), z.any()),
  createdAt: z.string().datetime().or(z.string()),
  updatedAt: z.string().datetime().or(z.string()),
});

export type Entity = z.infer<typeof EntitySchema>;

export function createDefaultAttributes(type: EntityType, subtype?: string): Record<string, any> {
  switch (type) {
    case 'npc':
      return NpcAttributesSchema.parse({});
    case 'enemy':
      return EnemyAttributesSchema.parse({});
    case 'location':
      return LocationAttributesSchema.parse({});
    case 'item':
      return ItemAttributesSchema.parse({});
    case 'trap':
      return TrapAttributesSchema.parse({});
    case 'treasure':
      return TreasureAttributesSchema.parse({});
    case 'region':
      return RegionAttributesSchema.parse({});
    case 'adventure_site':
      return AdventureSiteAttributesSchema.parse({});
    case 'area':
      return AreaAttributesSchema.parse({});
    case 'random_event_list':
      if (subtype === 'progress_clock') {
        return RandomEventListAttributesSchema.parse({
          eventListType: 'progress_clock',
          segments: 4,
          currentProgress: 0,
          frequencyTrigger: 'On failed stealth or noisy action',
          outcome: 'Castle alarm triggers and guards seal all exits',
          entries: [
            { roll: 1, title: 'Suspicion', description: 'Nearby guards hear an unusual noise and pause.' },
            { roll: 2, title: 'Investigation', description: 'Two guards leave their posts with lanterns to check the corridor.' },
            { roll: 3, title: 'Heightened Alert', description: 'Guards ready weapons and call out for confirmation.' },
            { roll: 4, title: 'Full Alarm', description: 'The alarm gong is struck and reinforcements are summoned.' },
          ],
        });
      }
      return RandomEventListAttributesSchema.parse({
        eventListType: 'random_event',
        diceFormula: '1d6',
        frequencyTrigger: 'Every 2 hours',
        entries: [
          { roll: 1, title: 'Distant Howls', description: 'Eerie cries echo through the fog, putting everyone on edge.' },
          { roll: 2, title: 'Wandering Patrol', description: 'A squad of 1d4 scouts approaches cautiously.' },
          { roll: 3, title: 'Sudden Weather Shift', description: 'Heavy rain or fog rolls in, reducing visibility.' },
          { roll: 4, title: 'Ominous Discovery', description: 'The party finds a freshly abandoned campsite with signs of struggle.' },
          { roll: 5, title: 'Fleeing Wildlife', description: 'Startled beasts rush past, fleeing something deeper in the wilds.' },
          { roll: 6, title: 'Dead Silence', description: 'An unnatural stillness settles over the surrounding area.' },
        ],
      });
    case 'rumor_list':
      return RumorListAttributesSchema.parse({});
    case 'image':
      return ImageAttributesSchema.parse({});
    case 'generic_list':
      return GenericListAttributesSchema.parse({});
  }
}

export function createDefaultEntity(
  scenarioId: string,
  entityType: EntityType,
  name?: string,
  subtype?: string
): Entity {
  const defaultNames: Record<EntityType, string> = {
    npc: 'New NPC',
    enemy: 'New Enemy',
    location: 'New Location',
    item: 'New Item',
    trap: 'New Trap',
    treasure: 'New Treasure',
    region: 'New Region',
    adventure_site: 'New Adventure Site',
    area: 'New Area',
    random_event_list: subtype === 'progress_clock' ? 'New Progress Clock' : 'New Wandering Encounters',
    rumor_list: 'New Rumor Table',
    image: 'New Image',
    generic_list: 'New Generic List',
  };

  const now = new Date().toISOString();
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ent-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    scenarioId,
    entityType,
    name: name || defaultNames[entityType],
    attributes: createDefaultAttributes(entityType, subtype),
    createdAt: now,
    updatedAt: now,
  };
}
