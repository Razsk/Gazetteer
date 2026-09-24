import { z } from 'zod';

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
 * Formats scenario context, targeted entities, and user instructions
 * into an optimized prompt for copy-pasting to ChatGPT, Claude, Gemini, or Ollama.
 */
export function formatClipboardPrompt(
  context: ScenarioContext,
  userInstructions: string,
  targets: TargetEntityPayload[]
): string {
  const payload = {
    scenarioContext: context,
    userInstructions,
    targets,
  };

  return `=== GAZETTEER AI INSTRUCTION ===
You are an expert tabletop RPG scenario designer helping a Game Master refine elements in a structured scenario editor.

[SCENARIO CONTEXT]
- Ruleset: ${context.ruleset}
- Setting / Theme: ${context.theme}
- Target Party Level: ${context.targetPartyLevel}

[USER INSTRUCTIONS]
${userInstructions}

[TARGET ENTITIES TO MODIFY]
${JSON.stringify(targets, null, 2)}

[OUTPUT REQUIREMENTS]
1. Return ONLY a valid JSON object matching the JSON Schema below.
2. In "updatedEntities", include ONLY the entityIds present in the input targets.
3. For each entity, return only the fields you are modifying or updating (partial JSON merge patch). If updating the entity's name, include "name" inside the attributes object.
4. Provide a brief 1-2 sentence explanation in "reasoningSummary".
5. Do NOT include extraneous conversational text outside the JSON.

[EXPECTED JSON RESPONSE FORMAT]
\`\`\`json
{
  "updatedEntities": [
    {
      "entityId": "<target-entity-id>",
      "attributes": {
        "key": "updated value"
      }
    }
  ],
  "reasoningSummary": "<explanation>"
}
\`\`\`
`;
}

/**
 * Parses and validates an AI response from clipboard text.
 * Strips markdown code blocks and validates with Zod.
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
    const normalized = {
      updatedEntities: (parsedJson.updatedEntities || parsedJson.updated_entities || []).map((e: any) => ({
        entityId: e.entityId || e.entity_id,
        attributes: e.attributes || {},
      })),
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
