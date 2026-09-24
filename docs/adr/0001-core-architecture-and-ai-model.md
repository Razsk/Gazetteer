# ADR-0001: Core Architecture, Layout Engine, and AI Interaction Model

## Context & Problem Statement
Gazetteer requires a solid architectural foundation that supports:
1. Reusable entities placed across discrete physical pages (A4 / US Letter) with bi-directional syncing.
2. A responsive DTP-style layout engine suitable for high-fidelity export (PDF, Word, Google Docs).
3. Reliable multi-entity LLM transformations that preserve existing content without accidental hallucination or data loss.

## Decision Drivers
- Developer ergonomics and rapid local prototyping without distributed cloud infrastructure overhead.
- Predictable page budget design for role-playing game publishers and GMs.
- Strict data integrity when applying LLM batch edits.

## Considered Options
1. Multi-tier distributed microservices (React + NestJS + Postgres + Redis + S3).
2. Pure client-side SPA with local storage.
3. Full-stack TypeScript application (Next.js App Router with TypeScript, SQLite/PostgreSQL via Drizzle or Prisma, and headless browser export).

## Decision Outcome
Chosen option: **Option 3: Full-stack TypeScript application**, accompanied by:
- **Canonical Entity vs. Placement Separation**: Placements store presentation metadata (`columnSpan`, `displayOrder`, `styleOverrides`), while all content attributes live on the canonical Entity. Placements sync bi-directionally by default; users can explicitly "Fork / Detach as Copy" to break inheritance.
- **DTP Slot-Based Page Grid with Overflow Indicators**: Layout follows discrete physical page boundaries (A4/Letter) with 1- and 2-column tracks. Content overflow is visually flagged rather than automatically reflowing onto subsequent pages, keeping page budgets intentional.
- **Staged AI Diff Review**: All LLM batch modifications return structured JSON patches displayed in a side-by-side diff review modal with 1-click batch acceptance.

## Consequences
- **Positive**: Clean local-first or self-hosted deployment; no dangling or orphaned pages caused by unexpected AI text expansions; zero risk of silent data corruption from LLMs.
- **Negative**: Users must manually manage overflow when text expands beyond page bounds; requires dedicated UI for the staged diff review.
