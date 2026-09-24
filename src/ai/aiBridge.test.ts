import { describe, it, expect } from 'vitest';
import {
  formatClipboardPrompt,
  parseClipboardResponse,
  AiBatchEditRequest,
  AiBatchEditResponseSchema
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
});
