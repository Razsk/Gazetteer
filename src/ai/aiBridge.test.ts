import { describe, it, expect } from 'vitest';
import {
  formatClipboardPrompt,
  parseClipboardResponse,
  AiBatchEditRequest,
  AiBatchEditResponseSchema,
  formatElementGenerationPrompt,
  parseElementGenerationResponse,
  getSampleGenerationResponse,
} from './aiBridge';

describe('AI Orchestrator & Clipboard Bridge (Seam 3)', () => {
  const sampleContext = {
    ruleset: 'D&D 5e',
    theme: 'Grimdark Swamp',
    targetPartyLevel: 4,
  };

  const sampleTargets = [
    {
      entityId: 'ent-trap-1',
      entityType: 'trap',
      name: 'Tripwire Crossbow',
      attributes: {
        detectionDc: 12,
        trigger: 'Taut wire',
        effect: '1d10 piercing damage',
      },
    },
    {
      entityId: 'ent-npc-1',
      entityType: 'npc',
      name: 'Kaelen',
      attributes: {
        role: 'Informant',
        motivation: 'Wants to survive the bog',
      },
    },
  ];

  it('formats prompt, context, target JSON and strict schema for clipboard copying', () => {
    const formatted = formatClipboardPrompt(
      sampleContext,
      'Make the trap venomous, and connect Kaelen to the marsh treasure.',
      sampleTargets
    );

    expect(formatted).toContain('=== GAZETTEER AI INSTRUCTION ===');
    expect(formatted).toContain('D&D 5e');
    expect(formatted).toContain('Tripwire Crossbow');
    expect(formatted).toContain('ent-trap-1');
    expect(formatted).toContain('"updatedEntities"');
  });

  it('parses, validates, and strips markdown code blocks from LLM clipboard replies', () => {
    const rawLlmReply = `
Here is your requested update:

\`\`\`json
{
  "updatedEntities": [
    {
      "entityId": "ent-trap-1",
      "attributes": {
        "name": "Serpent-Spit Crossbow",
        "detectionDc": 13,
        "effect": "Fires coated bolt: 1d10 piercing damage + DC 13 Con save or 2d6 poison damage."
      }
    },
    {
      "entityId": "ent-npc-1",
      "attributes": {
        "motivation": "Desperate for the Moon-Lily Relic to synthesize an antidote."
      }
    }
  ],
  "reasoningSummary": "Updated trap with venom payload and tied Kaelen's motivation to the relic."
}
\`\`\`
Hope this helps!
`;

    const parsed = parseClipboardResponse(rawLlmReply);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.updatedEntities).toHaveLength(2);
      expect(parsed.data.updatedEntities[0].entityId).toBe('ent-trap-1');
      expect(parsed.data.updatedEntities[0].attributes.name).toBe('Serpent-Spit Crossbow');
      expect(parsed.data.reasoningSummary).toContain('Updated trap');
    }
  });

  it('gracefully fails with readable errors when input is invalid JSON', () => {
    const broken = 'Sorry, as an AI model I cannot do that.';
    const parsed = parseClipboardResponse(broken);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error).toContain('JSON');
    }
  });

  describe('New Element & Page Generation (Seam 3 Extension)', () => {
    it('formats generation prompt with scenario context, referenced elements, and blueprints', () => {
      const prompt = formatElementGenerationPrompt(
        sampleContext,
        'Create a sunken sewer rat den with a boss and traps',
        [
          {
            name: 'Kaelen',
            entityType: 'npc',
            attributes: { role: 'Informant', lore: 'Lost an antidote in the sewers' },
          },
        ],
        {
          scenarioTitle: 'Whispers of the Crypt',
          suggestedPageTitle: 'The Sewers',
        }
      );

      expect(prompt).toContain('=== GAZETTEER AI GENERATION: NEW PAGE & ELEMENTS ===');
      expect(prompt).toContain('Whispers of the Crypt');
      expect(prompt).toContain('Kaelen');
      expect(prompt).toContain('Create a sunken sewer rat den with a boss and traps');
      expect(prompt).toContain('"pageTitle"');
      expect(prompt).toContain('"newEntities"');
      expect(prompt).toContain('• [NPC]: Recognized attribute keys');
    });

    it('parses valid AI generation reply with markdown fences and normalizes entities and keys', () => {
      const rawAiReply = `
\`\`\`json
{
  "pageTitle": "Flooded Sewers: Rat Nest",
  "reasoningSummary": "Created an encounter area directly connecting Kaelen's lost antidote to a wererat hideout.",
  "newEntities": [
    {
      "name": "Wererat Overseer",
      "entityType": "boss",
      "columnSpan": 1,
      "attributes": {
        "creature_type": "Monstrosity",
        "hit_points": 35,
        "armor_class": 13,
        "challenge_rating": "2",
        "tactics": "Ambush from shadows"
      }
    },
    {
      "name": "Sewers Central Basin",
      "entityType": "room",
      "columnSpan": 2,
      "attributes": {
        "dimensions_lighting": "50ft wide, damp and dark",
        "sensory_box": "Foul stench of sewage and nesting rats"
      }
    },
    {
      "name": "Poison Slime Siphon",
      "entityType": "trap",
      "attributes": {
        "trigger": "Pressure plate under slime",
        "detection_dc": 14,
        "disarm_dc": 13,
        "effect": "2d6 acid damage"
      }
    }
  ]
}
\`\`\`
`;

      const result = parseElementGenerationResponse(rawAiReply);
      expect(result.success).toBe(true);
      expect(result.data.pageTitle).toBe('Flooded Sewers: Rat Nest');
      expect(result.data.newEntities).toHaveLength(3);

      // Verify entity type normalization ('boss' -> 'enemy', 'room' -> 'area')
      expect(result.data.newEntities[0].entityType).toBe('enemy');
      expect(result.data.newEntities[0].attributes.hitPoints).toBe(35);
      expect(result.data.newEntities[0].attributes.creatureType).toBe('Monstrosity');

      expect(result.data.newEntities[1].entityType).toBe('area');
      expect(result.data.newEntities[1].columnSpan).toBe(2);
      expect(result.data.newEntities[1].attributes.dimensionsLighting).toBe('50ft wide, damp and dark');

      expect(result.data.newEntities[2].entityType).toBe('trap');
      expect(result.data.newEntities[2].attributes.detectionDc).toBe(14);
    });

    it('gracefully fails with readable error when generation JSON is malformed', () => {
      const invalid = '{"pageTitle": "Broken", newEntities: [}';
      const result = parseElementGenerationResponse(invalid);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('provides a high-fidelity sample response connected to context', () => {
      const sample = getSampleGenerationResponse(sampleContext, [
        { name: 'Kaelen', entityType: 'npc' },
      ]);
      expect(sample.pageTitle).toBeDefined();
      expect(sample.newEntities.length).toBeGreaterThan(0);
      expect(sample.reasoningSummary).toContain('Kaelen');
    });
  });
});

