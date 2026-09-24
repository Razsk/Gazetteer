# ADR-0003: AI Orchestration, Clipboard Bridge, and Canvas Grid UX

## Context & Problem Statement
The LLM interaction pipeline needs to be flexible for users who have direct API keys as well as users who prefer running via their web subscriptions (ChatGPT Plus, Claude Pro, Gemini Advanced) without incurring API charges or entering secrets. Additionally, canvas grid manipulation must be intuitive, tactile, and accessible.

## Decision Drivers
- High accessibility: users should not be blocked if they do not have an API key.
- Strict schema validation regardless of whether the model output arrived via an automated API call or manual paste.
- Clean and dependable drag-and-drop mechanics in the multi-column canvas.

## Considered Options
1. API-only integration (fails for users without paid developer keys).
2. Clipboard-only integration (tedious for heavy power users).
3. Dual-path: Automated Vercel AI SDK integration + Manual Clipboard Bridge.

## Decision Outcome
1. **Dual-Path AI Orchestration**:
   - **Automated Path**: Direct API invocation using Vercel AI SDK (`ai`) supporting OpenAI, Anthropic, and Google Gemini with user-provided keys.
   - **Clipboard Bridge (Zero-Key Mode)**: A 1-click "Copy Prompt & Context" action that formats the target entities, instructions, and strict JSON response schema into the clipboard. The user pastes this into any external LLM chat, then pastes the JSON response back into the application's Staged Diff parser, which validates the payload against Zod before showing the side-by-side diff.
2. **Canvas Reordering UX**: Hybrid approach using `@dnd-kit` for fluid drag-and-drop across columns and pages, augmented by explicit card header menus (`Move Up`, `Move Down`, `Toggle Column Span (1/2)`, `Move to Page`).

## Consequences
- **Positive**: 100% of users can use the AI batch-editing features immediately without spending money on API keys or configuring environment variables.
- **Negative**: The parser modal must provide friendly human error messages if a user pastes non-JSON or malformed markdown code fences from their chat.
