# CONTEXT.md

This glossary defines the canonical domain vocabulary for Gazetteer (the Role-Playing Scenario Editor). All skills, issues, PRs, and code must use these terms with these exact meanings.

## Domain Glossary

### Scenario
The top-level container representing an entire tabletop role-playing adventure, module, campaign setting, or dungeon crawl. Contains pages and an entity library.

### Entity
The canonical, single-source-of-truth definition of a role-playing element (such as an NPC, Location, Enemy, Item, Trap, Treasure, Region, Adventure Site, Area, Random Event List, Rumor List, or Image).
- Stored independently of any physical page.
- Identified by an `EntityId`.
- Carries all core data, mechanics, stat blocks, and lore in structured attributes.

### Placement (Instance)
A visual occurrence of an Entity on a specific Page in a Scenario.
- References its parent Entity by `EntityId`.
- Dictates visual layout on that page: `pageId`, `columnIndex`, `columnSpan`, `displayOrder`, and presentation settings (`styleOverrides` like theme skin or collapsed card view).
- Editing any domain attribute in a Placement mutates the underlying canonical Entity, immediately updating all other Placements of that Entity across the entire Scenario.
- Can be detached into an independent new Entity via an explicit "Fork / Detach as Copy" action.

### Page
A discrete, physical document unit (A4 or US Letter format) with configurable print margins and bleed boundaries. A Page contains an ordered sequence of Placements organized into 1-column or 2-column grid tracks.

### Overflow Indicator
A visual alert on a Placement indicating that its content exceeds the allocated vertical space on the physical Page, prompting the GM to adjust column span, split the element, or move Placements across pages.

### Staged Diff (AI Staging Area)
An ephemeral review buffer where proposed JSON patches returned by the LLM are presented side-by-side (Before vs. After) against the selected target Entities. Changes become canonical only when explicitly accepted by the user.

### Visual Skin (Theme)
A styling preset (e.g. *Parchment Fantasy*, *Cyberpunk HUD*, *Gothic Horror*, *Clean Minimalist*) that controls card borders, fonts, callout ribbons, stat-block watermarks, and background textures across a Scenario or per Placement.

### Scenario Context
The global scenario-level metadata (such as system ruleset e.g. D&D 5e / Pathfinder / OSR, campaign theme, and target party level) injected into LLM prompts to ensure consistent tone and power scaling.

### Clipboard Bridge (BYO-LLM / Air-Gapped Mode)
An alternative zero-API-key workflow where the application bundles the target entities, scenario context, instructions, and target JSON schema into the system clipboard. The user pastes this into any web chat interface (ChatGPT, Claude, Gemini, local Ollama), and copies the resulting JSON back into the app's Staged Diff parser for validation and merge.


### Entity Type Hierarchy
- **Macro / Geographic:**
  - **Region**: Large territory, province, or biome with travel rules, factions, and weather.
  - **Adventure Site**: A bounded complex, dungeon, ruins, castle, or settlement inside a Region.
  - **Area**: A specific room, chamber, or encounter zone within an Adventure Site.
- **Narrative & Social:**
  - **NPC**: Non-player character with stats, motivations, demeanor, and lore.
  - **Rumor List**: Table of clues, hooks, and hearsay with truth/deception tags and DCs.
- **Tactical & Hazard:**
  - **Enemy**: Hostile creature/boss with combat stat block, actions, and tactics.
  - **Trap**: Environmental or mechanical hazard with trigger, DC, damage, and disarm rules.
- **Loot & Economy:**
  - **Item**: Gear, magical artifact, or mundane object with rarity, value, and mechanics.
  - **Treasure**: Hoard, reward cache, or high-value objective.
- **Dynamic Tables & Assets:**
  - **Random Event List**: Rolling table for wandering monsters, weather, or time-based complications.
  - **Image**: Visual illustration, map, or portrait block containing generation prompt, aspect ratio, frame style, and asset URL.

