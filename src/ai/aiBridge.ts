import { z } from 'zod';
import { EntityType } from '@/domain/entities';

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

/**
 * Standard attribute fields definition by entity type for the AI.
 * This instructs the model EXACTLY which keys are allowed and how they are spelled.
 */
export const ALLOWED_FIELDS_BY_TYPE: Record<string, string[]> = {
  npc: ['name', 'role', 'demeanor', 'lore', 'motivation', 'statBlock', 'hitPoints', 'armorClass'],
  enemy: ['name', 'creatureType', 'challengeRating', 'hitPoints', 'armorClass', 'speed', 'actions', 'tactics', 'lore'],
  location: ['name', 'environmentType', 'sensoryDetails (sight, sound, smell)', 'pointsOfInterest', 'hazards', 'connectedLocations'],
  item: ['name', 'rarity', 'value', 'physicalDescription', 'mechanicalProperties', 'lore'],
  trap: ['name', 'trigger', 'detectionDc', 'disarmDc', 'effect', 'resetConditions'],
  treasure: ['name', 'value', 'rarity', 'contents', 'hiddenCondition'],
  region: ['name', 'climateTerrain', 'factionsPolitics', 'travelMechanics', 'loreHistory', 'linkedSites'],
  adventure_site: ['name', 'siteType', 'entranceAccess', 'alertState', 'environmentalHazards', 'linkedAreas'],
  area: ['name', 'mapKey', 'dimensionsLighting', 'sensoryBox', 'contents', 'exitsConnections'],
  random_event_list: ['name', 'diceFormula', 'frequencyTrigger', 'entries (array of {roll, title, description, linkedEntities})'],
  rumor_list: ['name', 'diceFormula', 'entries (array of {roll, statement, veracity, sourceDc, targetLink})'],
  image: ['name', 'prompt', 'negativePrompt', 'aspectRatio', 'stylePreset', 'caption', 'frameStyle', 'fitMode'],
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
4. If an attribute is unchanged, you may omit it or include its existing value.
5. Provide a 1-2 sentence explanation of your changes in "reasoningSummary".

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
  detection_dc: 'detectionDc',
  disarm_dc: 'disarmDc',
  hit_points: 'hitPoints',
  armor_class: 'armorClass',
  challenge_rating: 'challengeRating',
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
        attributes: normalizedAttrs,
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
