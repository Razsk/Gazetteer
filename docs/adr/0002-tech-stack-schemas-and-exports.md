# ADR-0002: Tech Stack, Schema Validation, and Multi-Format Exports

## Context & Problem Statement
Gazetteer requires a concrete technology stack, a reliable validation strategy for 12 distinct entity types and their AI-generated JSON patches, and a clear execution plan for document exports and image assets.

## Decision Drivers
- Zero-friction local development without requiring Docker or cloud accounts.
- Complete end-to-end type safety between database, backend APIs, LLM payloads, and UI components.
- Autonomous export functionality (PDF and Word) that operates without requiring third-party OAuth app verification.

## Considered Options
- Database: SQLite / LibSQL vs. Managed PostgreSQL vs. MongoDB.
- Validation: Loose schemaless JSON vs. Strict Zod discriminated schemas.
- Exports: All three (PDF, Docx, Google Docs) simultaneously vs. Phased local exports first.

## Decision Outcome
1. **Tech Stack**: Next.js App Router with TypeScript, Tailwind CSS, Lucide Icons, Zustand for normalized client state, and Drizzle ORM over SQLite/LibSQL (designed with an easy dialect switch to PostgreSQL).
2. **Strict Zod Schemas**: Every entity type (`npc`, `enemy`, `location`, `item`, `trap`, `treasure`, `region`, `adventure_site`, `area`, `random_event_list`, `rumor_list`, `image`) is modeled as a strict Zod discriminated union, featuring an extensible `custom_fields` record for system-specific mechanics.
3. **Phased Export Pipelines**:
   - Phase 1: High-fidelity **PDF** export via headless Chromium (`@page` CSS print styling) and **Word (.docx)** via the `docx` library.
   - Phase 2: Google Docs REST API integration via authenticated OAuth2.
4. **Hybrid Image Asset Handling**: Support local file uploads alongside pluggable AI image generation (e.g. Imagen / DALL-E) persisted to local project assets.

## Consequences
- **Positive**: Immediate developer and user experience out of the box; robust compile-time and runtime validation on all AI patches.
- **Negative**: Google Docs export is deferred to Phase 2.
