import { z } from 'zod';
import { EntityType, EntityTypeEnum, createDefaultAttributes } from '@/domain/entities';

export const ScenarioContextSchema = z.object({
  ruleset: z.string().default('D&D 5e'),
  theme: z.string().default('Generic Fantasy'),
  targetPartyLevel: z.number().default(1),
});
export type ScenarioContext = z.infer<typeof ScenarioContextSchema>;

export const TargetEntityPayloadSchema = z.object({
  entityId: z.string(),
  entityType: z.string(),
  name: z.string(),
  attributes: z.record(z.string(), z.any()),
});
export type TargetEntityPayload = z.infer<typeof TargetEntityPayloadSchema>;

export const AiBatchEditRequestSchema = z.object({
  scenarioContext: ScenarioContextSchema,
  userInstructions: z.string(),
  targets: z.array(TargetEntityPayloadSchema),
});
export type AiBatchEditRequest = z.infer<typeof AiBatchEditRequestSchema>;

export const EntityPatchSchema = z.object({
  entityId: z.string(),
  attributes: z.record(z.string(), z.any()),
});
export type EntityPatch = z.infer<typeof EntityPatchSchema>;

export const AiBatchEditResponseSchema = z.object({
  updatedEntities: z.array(EntityPatchSchema),
  reasoningSummary: z.string().default(''),
});
export type AiBatchEditResponse = z.infer<typeof AiBatchEditResponseSchema>;

export const GeneratedEntitySchema = z.object({
  name: z.string().min(1),
  entityType: EntityTypeEnum,
  columnSpan: z.union([z.literal(1), z.literal(2)]).default(1),
  attributes: z.record(z.string(), z.any()).default({}),
});
export type GeneratedEntity = z.infer<typeof GeneratedEntitySchema>;

export const AiGenerateElementsResponseSchema = z.object({
  pageTitle: z.string().min(1).default('New Page'),
  reasoningSummary: z.string().default(''),
  newEntities: z.array(GeneratedEntitySchema),
});
export type AiGenerateElementsResponse = z.infer<typeof AiGenerateElementsResponseSchema>;

/**
 * Standard attribute fields definition by entity type for the AI.
 * This instructs the model EXACTLY which keys are allowed and how they are spelled.
 */
export const ALLOWED_FIELDS_BY_TYPE: Record<string, string[]> = {
  npc: ['name', 'role', 'demeanor', 'lore', 'motivation', 'statBlock', 'hitPoints', 'armorClass'],
  enemy: ['name', 'creatureType', 'challengeRating', 'hitPoints', 'armorClass', 'speed', 'actions', 'tactics', 'lore'],
  location: ['name', 'environmentType', 'sensoryDetails (sight, sound, smell)', 'pointsOfInterest', 'hazards', 'connectedLocations'],
  item: ['name', 'rarity', 'value', 'physicalDescription', 'mechanicalProperties', 'lore'],
  trap: ['name', 'trigger', 'detectionClue', 'disarm', 'effect', 'resetConditions'],
  treasure: ['name', 'value', 'rarity', 'contents', 'hiddenCondition'],
  region: ['name', 'climateTerrain', 'factionsPolitics', 'travelMechanics', 'loreHistory', 'linkedSites'],
  adventure_site: ['name', 'siteType', 'entranceAccess', 'alertState', 'environmentalHazards', 'linkedAreas'],
  area: ['name', 'mapKey', 'dimensionsLighting', 'sensoryBox', 'contents (bullet list or array if multiple; obvious contents should also be mentioned in sensoryBox)', 'exitsConnections'],
  random_event_list: ['name', 'eventListType ("random_event" or "progress_clock")', 'diceFormula', 'frequencyTrigger', 'segments (e.g. 4, 6, 8)', 'currentProgress', 'outcome', 'entries (array of {roll, title, description, linkedEntities})'],
  rumor_list: ['name', 'diceFormula', 'entries (array of {roll, statement, veracity ("True", "Partially True", "False/Deceptive"), sourceDc (e.g. "DC 12 Insight" or empty string if none; do not use 0 or "0"), targetLink})'],
  image: ['name', 'prompt', 'negativePrompt', 'aspectRatio', 'stylePreset', 'caption', 'frameStyle', 'fitMode'],
  generic_list: ['name', 'context (explanation of what this list represents)', 'listStyle ("bullet" or "numbered")', 'items (array of string entries)'],
};

/**
 * Formats scenario context, targeted entities, and user instructions
 * into a strictly constrained prompt with schema blueprints.
 */
export function formatClipboardPrompt(
  context: ScenarioContext,
  userInstructions: string,
  targets: TargetEntityPayload[]
): string {
  // Collect the unique entity types being modified to inject targeted field blueprints
  const targetTypes = Array.from(new Set(targets.map((t) => t.entityType)));
  const fieldGuidelines = targetTypes
    .map((type) => {
      const allowed = ALLOWED_FIELDS_BY_TYPE[type] || ['name'];
      return `• [${type.toUpperCase()}]: Allowed attribute keys -> ${allowed.join(', ')}`;
    })
    .join('\n');

  return `=== GAZETTEER AI INSTRUCTION ===
You are an expert tabletop RPG scenario designer helping a Game Master refine elements in a structured scenario editor.

[SCENARIO CONTEXT]
- Ruleset: ${context.ruleset}
- Setting / Theme: ${context.theme}
- Target Party Level: ${context.targetPartyLevel}

[USER INSTRUCTIONS]
${userInstructions}

[ALLOWED ATTRIBUTE KEYS FOR TARGETED TYPES]
CRITICAL: Do NOT invent arbitrary or novel key names! You must strictly use the recognized field names listed below:
${fieldGuidelines}
(Note: You can update the entity's primary name by including "name": "..." inside the attributes object.)

[TARGET ENTITIES TO MODIFY]
Each target entity below includes its existing attributes. Keep existing values unless instructed to change them.
${JSON.stringify(targets, null, 2)}

[OUTPUT REQUIREMENTS]
1. Return ONLY a single valid JSON object matching the JSON format below. Do not wrap in conversational text.
2. In "updatedEntities", include an entry for each entity you are modifying with its exact "entityId".
3. Inside "attributes", return the updated field values using the exact key names defined above. Do NOT invent new fields.
4. For area/room entities: Provide "contents" (bullet list if multiple items). Obvious contents should also be mentioned in the "sensoryBox" read-aloud text.
5. If an attribute is unchanged, you may omit it or include its existing value.
6. Provide a 1-2 sentence explanation of your changes in "reasoningSummary".

[REQUIRED JSON RESPONSE FORMAT]
\`\`\`json
{
  "updatedEntities": [
    {
      "entityId": "<matching-target-entity-id>",
      "attributes": {
        "<exact-attribute-key>": "<new or updated value>"
      }
    }
  ],
  "reasoningSummary": "Brief explanation of modifications made."
}
\`\`\`
`;
}

/**
 * Maps common snake_case or alias keys returned by LLMs back to camelCase domain keys.
 */
const KEY_NORMALIZE_MAP: Record<string, string> = {
  // Common
  detection_clue: 'detectionClue',
  detection: 'detectionClue',
  detection_dc: 'detectionDc',
  disarm_method: 'disarm',
  disarm_procedure: 'disarm',
  how_to_disarm: 'disarm',
  disarm_dc: 'disarmDc',
  hit_points: 'hitPoints',
  armor_class: 'armorClass',
  challenge_rating: 'challengeRating',
  creature_type: 'creatureType',
  stat_block: 'statBlock',
  reset_conditions: 'resetConditions',
  physical_description: 'physicalDescription',
  mechanical_properties: 'mechanicalProperties',
  hidden_condition: 'hiddenCondition',
  environment_type: 'environmentType',
  sensory_details: 'sensoryDetails',
  points_of_interest: 'pointsOfInterest',
  connected_locations: 'connectedLocations',
  climate_terrain: 'climateTerrain',
  factions_politics: 'factionsPolitics',
  travel_mechanics: 'travelMechanics',
  lore_history: 'loreHistory',
  linked_sites: 'linkedSites',
  site_type: 'siteType',
  entrance_access: 'entranceAccess',
  alert_state: 'alertState',
  environmental_hazards: 'environmentalHazards',
  linked_areas: 'linkedAreas',
  map_key: 'mapKey',
  dimensions_lighting: 'dimensionsLighting',
  sensory_box: 'sensoryBox',
  exits_connections: 'exitsConnections',
  dice_formula: 'diceFormula',
  frequency_trigger: 'frequencyTrigger',
  source_dc: 'sourceDc',
  target_link: 'targetLink',
  aspect_ratio: 'aspectRatio',
  style_preset: 'stylePreset',
  frame_style: 'frameStyle',
  fit_mode: 'fitMode',
};

/**
 * Cleans entity attributes, ensuring rumor sourceDc values are valid strings and not stray 0, '0', or 'o' markers.
 */
export function sanitizeEntityAttributes(attrs: Record<string, any>): Record<string, any> {
  const result = { ...attrs };
  if (Array.isArray(result.entries)) {
    result.entries = result.entries.map((entry: any) => {
      if (!entry || typeof entry !== 'object') return entry;
      const sanitized = { ...entry };
      if (sanitized.sourceDc !== undefined || sanitized.source_dc !== undefined) {
        const dcVal = sanitized.sourceDc ?? sanitized.source_dc;
        const dcStr = dcVal != null ? String(dcVal).trim() : '';
        if (['0', 'o', 'none', 'null', 'undefined', 'false', ''].includes(dcStr.toLowerCase())) {
          sanitized.sourceDc = '';
        } else {
          sanitized.sourceDc = dcStr;
        }
        delete sanitized.source_dc;
      }
      return sanitized;
    });
  }
  return result;
}

/**
 * Parses and validates an AI response from clipboard text.
 * Strips markdown code blocks, normalizes keys, and validates with Zod.
 */
export function parseClipboardResponse(rawText: string): {
  success: boolean;
  data: AiBatchEditResponse;
  error?: string;
} {
  try {
    let clean = rawText.trim();

    // Extract JSON from markdown fences if present
    const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      clean = jsonMatch[1].trim();
    } else {
      // Find outermost curly braces
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        clean = clean.substring(firstBrace, lastBrace + 1);
      }
    }

    const parsedJson = JSON.parse(clean);

    // Support camelCase and snake_case response variants from various models
    const rawEntities = parsedJson.updatedEntities || parsedJson.updated_entities || [];
    const normalizedEntities = rawEntities.map((e: any) => {
      const entityId = e.entityId || e.entity_id;
      const rawAttrs = e.attributes || {};

      // Normalize snake_case keys back to camelCase
      const normalizedAttrs: Record<string, any> = {};
      for (const [key, val] of Object.entries(rawAttrs)) {
        const normalizedKey = KEY_NORMALIZE_MAP[key] || key;
        normalizedAttrs[normalizedKey] = val;
      }

      return {
        entityId,
        attributes: sanitizeEntityAttributes(normalizedAttrs),
      };
    });

    const normalized = {
      updatedEntities: normalizedEntities,
      reasoningSummary: parsedJson.reasoningSummary || parsedJson.reasoning_summary || '',
    };

    const validated = AiBatchEditResponseSchema.parse(normalized);
    return { success: true, data: validated };
  } catch (err: any) {
    return {
      success: false,
      data: { updatedEntities: [], reasoningSummary: '' },
      error: `Failed to parse AI response: ${err.message || 'Invalid JSON format'}`,
    };
  }
}

/**
 * Normalizes colloquial or alias entity type names to canonical EntityType.
 */
export function normalizeEntityType(raw: string): EntityType {
  const clean = raw.toLowerCase().trim().replace(/[-\s]+/g, '_');
  const ENTITY_TYPE_ALIASES: Record<string, EntityType> = {
    enemy: 'enemy',
    boss: 'enemy',
    monster: 'enemy',
    creature: 'enemy',
    mob: 'enemy',
    npc: 'npc',
    person: 'npc',
    ally: 'npc',
    vendor: 'npc',
    quest_giver: 'npc',
    questgiver: 'npc',
    adventure_site: 'adventure_site',
    site: 'adventure_site',
    dungeon: 'adventure_site',
    ruin: 'adventure_site',
    ruins: 'adventure_site',
    complex: 'adventure_site',
    area: 'area',
    room: 'area',
    chamber: 'area',
    zone: 'area',
    location: 'location',
    region: 'region',
    biome: 'region',
    item: 'item',
    magic_item: 'item',
    weapon: 'item',
    gear: 'item',
    equipment: 'item',
    treasure: 'treasure',
    loot: 'treasure',
    hoard: 'treasure',
    cache: 'treasure',
    trap: 'trap',
    hazard: 'trap',
    random_event_list: 'random_event_list',
    random_events: 'random_event_list',
    random_table: 'random_event_list',
    event_list: 'random_event_list',
    progress_clock: 'random_event_list',
    clock: 'random_event_list',
    countdown_clock: 'random_event_list',
    countdown: 'random_event_list',
    rumor_list: 'rumor_list',
    rumors: 'rumor_list',
    rumours: 'rumor_list',
    rumor_table: 'rumor_list',
    image: 'image',
    illustration: 'image',
    art: 'image',
    generic_list: 'generic_list',
    list: 'generic_list',
    checklist: 'generic_list',
  };

  if (ENTITY_TYPE_ALIASES[clean]) {
    return ENTITY_TYPE_ALIASES[clean];
  }

  const validTypes = EntityTypeEnum.options as readonly string[];
  if (validTypes.includes(clean)) {
    return clean as EntityType;
  }

  return 'npc';
}

export interface GenerateElementsPromptOptions {
  scenarioTitle?: string;
  suggestedPageTitle?: string;
}

/**
 * Formats scenario context, referenced existing elements, and GM instructions
 * into an air-gapped clipboard prompt for generating new elements on a new page.
 */
export function formatElementGenerationPrompt(
  context: ScenarioContext,
  userInstructions: string,
  referencedEntities: Array<{
    name: string;
    entityType: string;
    attributes: Record<string, any>;
  }> = [],
  options?: GenerateElementsPromptOptions
): string {
  const referencedText =
    referencedEntities.length > 0
      ? referencedEntities
          .map((e) => {
            return `• [${e.entityType.toUpperCase()}] "${e.name}":\n${JSON.stringify(e.attributes, null, 2)}`;
          })
          .join('\n\n')
      : 'None provided. Build fresh elements matching the scenario theme and instructions.';

  const allFields = Object.entries(ALLOWED_FIELDS_BY_TYPE)
    .map(([type, fields]) => `• [${type.toUpperCase()}]: Recognized attribute keys -> ${fields.join(', ')}`)
    .join('\n');

  return `=== GAZETTEER AI GENERATION: NEW PAGE & ELEMENTS ===
You are an expert tabletop RPG scenario designer authoring rich, structured scenario elements for a Game Master.

[SCENARIO CONTEXT]
- Scenario Title: ${options?.scenarioTitle || 'Untitled Scenario'}
- Ruleset: ${context.ruleset}
- Setting / Theme: ${context.theme}
- Target Party Level: ${context.targetPartyLevel}

[REFERENCED CONTEXT / LORE TO BUILD UPON]
The GM has explicitly referenced these existing scenario elements as narrative and mechanical context. Connect the new elements to these characters, locations, traps, or lore hooks:
${referencedText}

[USER REQUEST & INSTRUCTIONS]
${userInstructions}

[ALLOWED ENTITY TYPES & RECOGNIZED ATTRIBUTE KEYS]
Choose "entityType" strictly from:
npc, enemy, location, item, trap, treasure, region, adventure_site, area, random_event_list, rumor_list, generic_list, image.

Inside each entity's "attributes" object, strictly use these recognized keys:
${allFields}

[LAYOUT & FORMAT INSTRUCTIONS]
1. Suggest a descriptive "pageTitle" for the new page where these elements will be placed.
2. In "reasoningSummary", write 1-3 sentences describing how these elements fulfill the request and weave into the referenced lore/theme.
3. In "newEntities", generate a cohesive set of elements to populate the new page.
4. For each entity, specify "columnSpan" (use 2 for full-width headers like adventure_site, region, wide area maps, or large event tables; use 1 for NPCs, traps, enemies, items, etc.).
5. For room/area entities: Populate "contents" (bullet list if multiple items). Obvious contents should also be mentioned in the "sensoryBox" read-aloud text.
6. Return ONLY a single valid JSON object matching the JSON response format below. No markdown explanations outside the code block.

[REQUIRED JSON RESPONSE FORMAT]
\`\`\`json
{
  "pageTitle": "${options?.suggestedPageTitle || 'Descriptive Page Title (e.g., Catacombs: The Wererat Warrens)'}",
  "reasoningSummary": "Brief summary of how these new elements connect to the scenario and lore.",
  "newEntities": [
    {
      "name": "Name of the Element",
      "entityType": "npc | enemy | trap | treasure | item | location | adventure_site | area | random_event_list | rumor_list | generic_list | image",
      "columnSpan": 1,
      "attributes": {
        "<exact-attribute-key>": "<attribute-value>"
      }
    }
  ]
}
\`\`\`
`;
}

/**
 * Parses and validates an AI generation response from clipboard text.
 * Strips code fences, normalizes entity types and casing, applies domain defaults, and validates with Zod.
 */
export function parseElementGenerationResponse(rawText: string): {
  success: boolean;
  data: AiGenerateElementsResponse;
  error?: string;
} {
  try {
    let clean = rawText.trim();

    // Extract JSON from markdown fences if present
    const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      clean = jsonMatch[1].trim();
    } else {
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        clean = clean.substring(firstBrace, lastBrace + 1);
      }
    }

    const parsedJson = JSON.parse(clean);

    const rawEntities =
      parsedJson.newEntities ||
      parsedJson.new_entities ||
      parsedJson.entities ||
      parsedJson.elements ||
      [];

    const normalizedEntities: GeneratedEntity[] = rawEntities.map((e: any, idx: number) => {
      const rawType = String(e.entityType || e.entity_type || e.type || 'npc');
      const entityType = normalizeEntityType(rawType);
      const name = String(e.name || `Generated ${entityType} ${idx + 1}`).trim();
      const rawSpan = Number(
        e.columnSpan || e.column_span || (['adventure_site', 'region', 'area'].includes(entityType) ? 2 : 1)
      );
      const columnSpan: 1 | 2 = rawSpan === 2 ? 2 : 1;

      const rawAttrs = e.attributes || {};
      const normalizedAttrs: Record<string, any> = {};
      for (const [k, v] of Object.entries(rawAttrs)) {
        const normKey =
          KEY_NORMALIZE_MAP[k] ||
          (k.includes('_')
            ? k.replace(/_([a-z0-9])/gi, (_, c) => c.toUpperCase())
            : k);
        normalizedAttrs[normKey] = v;
      }

      // Merge with default attributes to ensure schema conformity
      const isClock = rawType.toLowerCase().includes('clock') || rawType.toLowerCase().includes('countdown') || normalizedAttrs.eventListType === 'progress_clock';
      const subtype = isClock ? 'progress_clock' : undefined;
      const defaultAttrs = createDefaultAttributes(entityType, subtype);
      if (isClock && entityType === 'random_event_list') {
        normalizedAttrs.eventListType = 'progress_clock';
      }
      const mergedAttrs = {
        ...defaultAttrs,
        ...normalizedAttrs,
      };

      if (entityType === 'area' && mergedAttrs.contents) {
        if (typeof mergedAttrs.contents === 'string') {
          mergedAttrs.contents = mergedAttrs.contents
            .split(/\r?\n/)
            .map((s: string) => s.trim().replace(/^[-*•]\s*/, ''))
            .filter(Boolean);
        } else if (Array.isArray(mergedAttrs.contents)) {
          mergedAttrs.contents = mergedAttrs.contents
            .map((s: any) => String(s).trim().replace(/^[-*•]\s*/, ''))
            .filter(Boolean);
        }
      }

      return {
        name,
        entityType,
        columnSpan,
        attributes: sanitizeEntityAttributes(mergedAttrs),
      };
    });

    const pageTitle =
      parsedJson.pageTitle ||
      parsedJson.page_title ||
      parsedJson.title ||
      'New Page';

    const reasoningSummary =
      parsedJson.reasoningSummary ||
      parsedJson.reasoning_summary ||
      parsedJson.summary ||
      '';

    const normalized = {
      pageTitle: String(pageTitle).trim() || 'New Page',
      reasoningSummary: String(reasoningSummary).trim(),
      newEntities: normalizedEntities,
    };

    const validated = AiGenerateElementsResponseSchema.parse(normalized);
    return { success: true, data: validated };
  } catch (err: any) {
    return {
      success: false,
      data: { pageTitle: 'New Page', reasoningSummary: '', newEntities: [] },
      error: `Failed to parse AI generation response: ${err.message || 'Invalid JSON format'}`,
    };
  }
}

/**
 * Returns a high-fidelity sample response tailored to the scenario context.
 * Useful for instant testing and one-click preview in the UI.
 */
export function getSampleGenerationResponse(
  context: ScenarioContext,
  referencedEntities: Array<{ name: string; entityType: string }> = []
): AiGenerateElementsResponse {
  const refNames = referencedEntities.map((e) => e.name).join(', ');
  const refNotice = refNames ? `Building upon referenced context (${refNames}).` : `Tailored for ${context.theme}.`;

  return {
    pageTitle: 'Sunken Catacombs & Wererat Warren',
    reasoningSummary: `Generated subterranean encounter area connecting directly to the current scenario theme (${context.theme}). ${refNotice}`,
    newEntities: [
      {
        name: 'Flooded Warrens Access',
        entityType: 'area',
        columnSpan: 2,
        attributes: {
          mapKey: '2A',
          dimensionsLighting: '60ft x 40ft vaulted brick tunnel, pitch black with knee-deep stagnant runoff.',
          sensoryBox: 'The reek of rot and wet fur hangs heavy; faint splashing echoes from the dark.',
          contents: ['Cracked stone sluice gate', 'Rusted iron grates', 'Gnawed skeletal remains'],
          exitsConnections: 'Western iron gate leads back toward crypt; eastern pipe descends to the nest.',
        },
      },
      {
        name: 'Skritt the Plague-Biter',
        entityType: 'enemy',
        columnSpan: 1,
        attributes: {
          creatureType: 'Wererat Chieftain',
          challengeRating: '3',
          hitPoints: 44,
          armorClass: 14,
          speed: '30 ft., burrow 20 ft.',
          actions: 'Multiattack: 1 Bite (+5 to hit, 1d4+2 piercing + DC 11 Con save against wererat curse) and 1 Shortsword (+5, 1d6+2 piercing).',
          tactics: 'Fights from the shadows, commanding diseased giant rats to flank while Skritt snipes with a hand crossbow.',
          lore: 'Former smuggler transformed by cursed swamp water. Hoards silver trinkets and guards the water supply.',
        },
      },
      {
        name: 'Toxic Siphon Trap',
        entityType: 'trap',
        columnSpan: 1,
        attributes: {
          trigger: 'Tripwire attached to rusted copper siphon release valve.',
          detectionClue: 'Greenish corrosion flakes floating on the water near a taut wire.',
          disarm: 'Clamp the valve stem with pliers or carefully tie off the tripwire.',
          effect: 'Pressurized jet of toxic swamp gas in a 15ft cone: DC 13 Con save or 2d8 poison damage and poisoned for 1 hour.',
          resetConditions: 'Manual reset by closing valve wheel in pipe alcove.',
        },
      },
      {
        name: 'Smuggler’s Submerged Strongbox',
        entityType: 'treasure',
        columnSpan: 1,
        attributes: {
          value: '350 gp total (assorted silver bullion & pearls)',
          rarity: 'Uncommon',
          contents: 'Wax-sealed leather pouch containing 120 gp, 2 silver trade bars (50 gp each), and a Potion of Water Breathing.',
          hiddenCondition: 'Chained to underwater mooring post beneath the central sluice gate; DC 14 Investigation to spot.',
        },
      },
      {
        name: 'Dredged River Rumors',
        entityType: 'rumor_list',
        columnSpan: 1,
        attributes: {
          diceFormula: '1d4',
          entries: [
            { roll: 1, statement: 'Skritt once served the town guild before being betrayed and cast into the canal.', veracity: 'True', sourceDc: 'DC 12 Persuasion' },
            { roll: 2, statement: 'The sewer water burns skin if you stay wading for more than an hour.', veracity: 'Partially True', sourceDc: 'DC 10 Survival' },
            { roll: 3, statement: 'A massive albino crocodile dwells past the second grate.', veracity: 'False/Deceptive', sourceDc: 'DC 14 Insight' },
            { roll: 4, statement: 'A secret latch behind the valve releases a dry escape tunnel to the surface.', veracity: 'True', sourceDc: 'DC 13 Investigation' },
          ],
        },
      },
    ],
  };
}
