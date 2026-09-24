# **Role-Playing Scenario Editor System Requirements**

[https://gemini.google.com/app/6a0ae1b00aea48c2](https://gemini.google.com/app/6a0ae1b00aea48c2)

*User prompt: System requirements for role playing Scenario editor The app is designed around modules that can be locked into pages. These modules represent different elements of a role-playing scenario, such as: • A location • An item • A non-player character • Enemies • Traps • Treasures Each of these elements is defined by attributes, and the editor can communicate with an LLM to flesh out, fill out, or modify them. The user can add these elements, mark a bunch of them, and add notes, requests, or comments. This will then be sent to the AI that edits just those elements.Both the input and output will be formatted in JSON so the application can process and update the elements in a structured way. The scenario is organized in pages so the application can export to several formats: • PDF • Word • Google Doc Each of the elements can be presented in different designs with graphical elements, and can be laid out in one or two columns. The elements can also be duplicated, meaning that an element can be reused on other pages and updated in either place, with any changes reflected in both places.*

## **Response: System Architecture Overview**

┌────────────────────────────────────────────────────────┐  
│                   Client Application                   │  
│  ┌───────────────────────┐   ┌──────────────────────┐  │  
│  │ Page & Grid Composer  │   │ Canvas / DOM Renderer│  │  
│  │ (1-col / 2-col flow)  │   │ (Themed Visual Skins)│  │  
│  └───────────┬───────────┘   └──────────▲───────────┘  │  
│              │                          │              │  
│  ┌───────────▼──────────────────────────┴───────────┐  │  
│  │ Normalized State Store (Entities vs. Placements) │  │  
│  └───────────┬──────────────────────────▲───────────┘  │  
└──────────────┼──────────────────────────┼──────────────┘  
               │                          │  
       REST / WebSocket            REST / Export Queue  
               │                          │  
┌──────────────▼──────────────────────────┴──────────────┐  
│                    Backend Services                    │  
│  ┌───────────────────────┐   ┌──────────────────────┐  │  
│  │ LLM Orchestrator      │   │ Multi-Format Export  │  │  
│  │ \- Context Assembly    │   │ \- Headless Chrome    │  │  
│  │ \- JSON Schema Enforce │   │ \- docx / Pandoc      │  │  
│  │ \- Delta Patch Engine  │   │ \- Google Docs API v1 │  │  
│  └───────────┬───────────┘   └──────────────────────┘  │  
│              │                                         │  
│  ┌───────────▼──────────────────────────────────────┐  │  
│  │ Primary Database: PostgreSQL (Relational \+ JSONB)│  │  
│  └──────────────────────────────────────────────────┘  │  
└────────────────────────────────────────────────────────┘

## **1\. Functional Requirements**

### **1.1 Entity & Instance Management (Reusability & Sync)**

> * **Single Source of Truth:** Every role-playing element (Location, NPC, Item, Enemy, Trap, Treasure) must exist as a canonical entity stored in an entity library.  
> * **Page Instances (Clones):** When an element is placed onto a page, the canvas creates an Instance referencing the base EntityID.  
> * **Bi-directional Sync:** Any attribute updated in one instance must instantly propagate to all other instances referencing the same EntityID via a normalized reactive state store (e.g., Redux Toolkit, Zustand) and persistent backend storage.  
> * **Attribute Schema Support:**  
  * **NPC / Enemy:** Name, role/creature type, stat block, hit points, armor class, attacks/actions, lore, demeanor, visual theme ID.  
  * **Location:** Name, environment type, sensory details (sight, sound, smell), points of interest, hazards, connected locations.  
  * **Item / Treasure:** Name, rarity, value, physical description, mechanical properties/magic effects, lore.  
  * **Trap:** Trigger, detection DC/difficulty, disarm mechanism, mechanical payload/damage, reset conditions.

### **1.2 Multi-Page Grid & Layout Composer**

> * **Page-Centric Canvas:** Physical page boundaries (A4 and US Letter) with user-defined margins and print-safe bleed boundaries.  
> * **Layout Grid:**  
  * Support for dynamic 1-column and 2-column flow per page or per section.  
  * Ability to lock/pin elements into specific slots or allow them to reflow vertically.  
  * Configurable span (e.g., a massive Boss Enemy block spanning across 2 columns; small items taking 1 column).  
> * **Visual Skinning Engine:**  
  * Swappable visual design themes (e.g., *Parchment Fantasy*, *Cyberpunk HUD*, *Gothic Horror*, *Clean Minimalist*).  
  * Graphical embellishments: frame borders, decorative dividers, stat-block background watermarks, and callout ribbons.

### **1.3 LLM Batch-Editing Engine**

> * **Multi-Selection Pipeline:** The user can multi-select arbitrary elements across the current page or scenario, attaching global or itemized modification prompts (e.g., *"Make these three NPCs members of the local thieves guild and adjust the trap DC to level 5"*).  
> * **Structured Payload Assembly:** The application bundles:  
  * Scenario global context (setting, tone, theme, party level).  
  * Selected entities' current JSON states.  
  * Explicit JSON Schema definitions for every element type.  
  * User instructions and targeted comments.  
> * **Strict JSON Validation & Partial Patching:**  
  * The backend enforces strict structured output (e.g., OpenAI Structured Outputs / JSON Schema Mode).  
  * Updates are processed as partial JSON merge-patches (RFC 7396\) or targeted field updates to prevent inadvertent data loss in unmentioned attributes.

### **1.4 Document Export Engine**

> * **PDF Export:** High-fidelity print layout preservation matching the browser canvas exactly (including exact page breaks, 2-column CSS layouts, and embedded fonts) via headless Chromium execution.  
> * **Word (.docx) Export:** Conversion of structural blocks into native Word tables, callout text boxes, and native multi-column section breaks using server-side libraries (e.g., docx on Node.js or python-docx).  
> * **Google Docs Export:** Server-side synchronization using Google Docs API (documents.batchUpdate) to construct headings, styled tables, inline formatting, and structural document tabs.

## **2\. Data Architecture & Schemas**

### **2.1 Entity vs. Placement Schema (PostgreSQL Model)**

\-- Canonical element data  
CREATE TABLE scenario\_entities (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    scenario\_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,  
    entity\_type VARCHAR(32) NOT NULL, \-- 'npc', 'enemy', 'location', 'item', 'trap', 'treasure'  
    name VARCHAR(255) NOT NULL,  
    attributes JSONB NOT NULL,        \-- Structured stats, lore, mechanics  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    updated\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- Physical instances on pages  
CREATE TABLE page\_placements (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    page\_id UUID NOT NULL REFERENCES scenario\_pages(id) ON DELETE CASCADE,  
    entity\_id UUID NOT NULL REFERENCES scenario\_entities(id) ON DELETE CASCADE,  
    column\_index INT DEFAULT 0,       \-- 0 \= Full/Col 1, 1 \= Col 2  
    column\_span INT DEFAULT 1,        \-- 1 or 2 columns  
    display\_order INT NOT NULL,  
    style\_overrides JSONB DEFAULT '{}'-- Custom skin, color tint, collapsed view toggle  
);

### **2.2 LLM Exchange Schema**

#### **Request Payload (POST /api/v1/ai/batch-edit)**

{  
  "scenario\_context": {  
    "system\_ruleset": "D\&D 5e",  
    "theme": "Grimdark Swamp",  
    "target\_party\_level": 4  
  },  
  "user\_instructions": "Make the trap trigger venomous, and link the NPC's motivation to the treasure.",  
  "targets": \[  
    {  
      "entity\_id": "8a3e7b1a-9821-4f12-9cbb-564d3f572a11",  
      "entity\_type": "trap",  
      "attributes": {  
        "name": "Tripwire Crossbow",  
        "detection\_dc": 12,  
        "trigger": "Taut chord across hallway",  
        "effect": "Fires a plain iron bolt dealing 1d10 piercing damage."  
      }  
    },  
    {  
      "entity\_id": "f51b9e2c-3814-419b-a01f-0e8c7161b993",  
      "entity\_type": "npc",  
      "attributes": {  
        "name": "Kaelen the Herbalist",  
        "role": "Informant",  
        "motivation": "Looking to buy rare marsh roots."  
      }  
    }  
  \]  
}

#### **Enforced LLM Response**

{  
  "updated\_entities": \[  
    {  
      "entity\_id": "8a3e7b1a-9821-4f12-9cbb-564d3f572a11",  
      "attributes": {  
        "name": "Serpent-Spit Crossbow",  
        "detection\_dc": 13,  
        "trigger": "Taut chord across hallway coated in algae",  
        "effect": "Fires a coated bolt: 1d10 piercing damage plus DC 13 Constitution save or 2d6 poison damage."  
      }  
    },  
    {  
      "entity\_id": "f51b9e2c-3814-419b-a01f-0e8c7161b993",  
      "attributes": {  
        "motivation": "Desperate to acquire the Moon-Lily Relic to synthesize an antidote for his ailing daughter."  
      }  
    }  
  \],  
  "reasoning\_summary": "Updated trap with venomous payload and updated Kaelen's motivation to target the scenario's treasure."  
}

## **3\. Non-Functional & Technical Requirements**

| Domain | Specification | Requirement / Architecture Choice |
| :---- | :---- | :---- |
| **Frontend Framework** | UI & Layout Engine | **React / Next.js** or **SvelteKit** paired with **CSS Paged Media (@page)** and **CSS Grid / Flexbox** for strict column calculations. |
| **State Management** | Normalized In-Memory Store | **Zustand** or **Redux Toolkit** with normalized state tables (entities: { \[id\]: data }, placements: { \[pageId\]: \[entityIds\] }). |
| **Backend & DB** | Primary Platform | **Node.js (NestJS)** or **Go / Python (FastAPI)** with **PostgreSQL 16+** leveraging jsonb\_build\_object() and jsonb\_set() for efficient partial updates. |
| **AI Integration** | Reliability & Safety | Strict adherence to JSON schema enforcement; retry loops handling JSON schema violations; system latency ≤5s for batch batches up to 6 entities. |
| **Export Engines** | PDF Generation | Headless Chromium via **Puppeteer** executing print media queries (@page { size: A4; margin: 15mm; }). |
| **Export Engines** | Word / Google Docs | **docx (npm)** or **Pandoc** for Word; **Google Docs REST API v1** utilizing authenticated OAuth 2.0 service accounts / user tokens. |
| **Concurrency** | Real-Time Sync | **WebSockets** or **Server-Sent Events (SSE)** to stream entity updates to all open browser tabs and instances simultaneously. |

## **4\. Edge Cases & Mitigation Strategies**

> * **Circular LLM Changes:** When the LLM outputs updates for multiple linked elements, the orchestrator must validate incoming foreign keys or cross-references to ensure no dangling pointers or broken dependencies occur.  
> * **Layout Overflow:** Adding long descriptive text via AI can push content beyond page borders. The layout engine needs automatic pagination calculation or an overflow flag prompting the user to resize, split the element, or shift it to the next page.  
> * **Export Visual Fidelity Discrepancies:** Native Word and Google Docs do not support CSS pseudo-elements, drop shadows, or SVG borders. The export engine must utilize structured conversion templates, transforming web styling into native Word/Docs table borders, font formatting, and colored backgrounds.

---

*User prompt: List of different elements: • Region • Adventure Site • Area • Random Event List • Rumor List*

### **Response: Extended Scenario Elements: Schema & Integration**

These five elements represent the macro-to-micro hierarchy and dynamic encounter engines needed to structure sandbox, hexcrawl, and mystery scenarios.

### **1\. Region (Macro Setting)**

Represents a large geographic territory, province, biome, or political domain.

> * **Core Attributes:**  
  * climate\_terrain: Biome type, elevation, prevailing weather patterns, travel difficulty modifiers.  
  * factions\_politics: Dominant rulers, competing factions, law enforcement presence, hostility level.  
  * travel\_mechanics: Hex/mile scale, rations required, navigation DCs, foraging DC.  
  * lore\_history: Historical background, ruins origin, current conflicts.  
  * linked\_sites: Array of site\_ids (references to Adventure Sites located in this region).  
> * **Grid Presentation:** Typically a full 2-column header or splash block featuring territory overview badges, faction heraldry, and a regional travel pace chart.

### **2\. Adventure Site (Dungeon / Landmark)**

A bounded, explorable location such as a dungeon, forgotten fortress, sunken temple, or settlement.

> * **Core Attributes:**  
  * site\_type: Dungeon, ruin, castle, cavern system, village.  
  * entrance\_access: Discovery DC, locks, environmental barriers, guard checkpoints.  
  * alert\_state: Passive, on alert, locked down, evacuated (and what triggers state transitions).  
  * environmental\_hazards: Submerged sections, unbreathable air, darkness, magical dampening.  
  * linked\_areas: Ordered array of area\_ids detailing the individual rooms or sub-zones inside.  
> * **Grid Presentation:** Works well across 1 or 2 columns, featuring an integrated architectural key, ambient atmosphere box, and entry prerequisites.

### **3\. Area (Room / Encounter Zone)**

A specific sub-location inside an Adventure Site (e.g., Room 4: The Alchemist’s Cellar) or a localized encounter point.

> * **Core Attributes:**  
  * map\_key: Identifier tag (e.g., "Area 3B", "Room 12").  
  * dimensions\_lighting: Dimensions (e.g., 30×40 ft), ceiling height, light level (dark, dim, bright).  
  * sensory\_box: Read-aloud narrative text covering sight, sound, smell, and temperature.  
  * contents: Arrays referencing linked element IDs (npc\_ids, enemy\_ids, trap\_ids, treasure\_ids).  
  * exits\_connections: Directional passages, doors, secret passages with required investigation DCs.  
> * **Grid Presentation:** Highly compact 1-column modular cards designed to stack cleanly sequentially down a printed page.

### **4\. Random Event List (Wandering Encounters / Complications)**

A rolling table for time-based risks, patrol encounters, or dynamic weather shifts.

> * **Core Attributes:**  
  * dice\_formula: Die expression (e.g., "1d6", "1d8", "1d20").  
  * frequency\_trigger: Trigger interval (e.g., *"Check every 2 game hours"* or *"Check upon a short rest"*).  
  * entries: Array of structured table rows:  
    * roll\_range: Single value or span (e.g., \[1, 2\], \[3, 4\], \[20\]).  
    * title: Event name.  
    * description: Mechanical trigger and GM guidance.  
    * linked\_entities: Optional references to enemy\_id or trap\_id spawned by this roll.  
> * **Grid Presentation:** Formatted as an inset Markdown/Word table with zebra-striped rows, roll badges, and inline reference chips.

### **5\. Rumor List (Information & Lead Engine)**

A collection of clues, hooks, and hearsay gathered by players from taverns, informants, or ancient texts.

> * **Core Attributes:**  
  * dice\_formula: Die expression for random determination (e.g., "1d6").  
  * entries: Array of information items:  
    * roll: Number key.  
    * statement: In-character quote or factual piece of hearsay.  
    * veracity: Classification tag ("True", "Partially True", "False/Deceptive").  
    * source\_dc: Streetwise/Investigation DC and primary sources (e.g., *"Drunken sailors at The Salty Dog"*).  
    * target\_link: Optional link pointing to an npc\_id, site\_id, or treasure\_id.  
> * **Grid Presentation:** 1-column parchment-style card or player handout box with distinct true/false badges visible only in GM view, easily toggleable for player-facing exports.

### **Updated Data Model Extension (JSONB Structure)**

{  
  "entity\_id": "c71a39f1-0982-42e1-9876-1f928e3b4a22",  
  "entity\_type": "random\_event\_list",  
  "name": "Sunken Crypt Patrols",  
  "attributes": {  
    "dice\_formula": "1d6",  
    "frequency\_trigger": "Every 2 dungeon turns or loud noise",  
    "entries": \[  
      {  
        "roll": 1,  
        "title": "Dripping Silence",  
        "description": "Ceiling lime sloughs off; DC 12 Dex save or blinded 1 round."  
      },  
      {  
        "roll": \[2, 3\],  
        "title": "Skeletal Sentry",  
        "description": "2 Skeleton archers advance from the nearest corridor.",  
        "linked\_entities": \["enemy\_skeleton\_sentry\_id"\]  
      },  
      {  
        "roll": \[4, 6\],  
        "title": "Rising Water",  
        "description": "Footing becomes difficult terrain for 1d4 turns."  
      }  
    \]  
  }  
}

---

*User prompt: Image: this will have input for an image prompt and also ratio.*

### **Response: Image Module: Specification & Architecture**

The **Image Module** functions as a visual asset block that can either hold generated AI concept art, uploaded cartography/handouts, or prompt blueprints for future generation.

### **1\. Attribute Schema & Data Model**

The image module is treated as a canonical entity within the scenario\_entities table, storing generation metadata alongside the rendered output.

export interface ImageAttributes {  
  // Generation Parameters  
  prompt: string;  
  negative\_prompt?: string;  
  aspect\_ratio: '1:1' | '16:9' | '9:16' | '4:3' | '3:2' | '21:9';  
  style\_preset?: 'oil\_painting' | 'parchment\_sketch' | 'isometric\_map' | 'dark\_fantasy' | 'watercolor';  
    
  // Asset References & State  
  asset\_url: string | null;           // CDN or S3 storage path for the rendered image  
  thumbnail\_url: string | null;       // Optimized preview for fast page grid rendering  
  generation\_status: 'draft' | 'queued' | 'rendering' | 'ready' | 'failed';  
    
  // Layout & Editorial Presentation  
  caption?: string;                  // Optional label printed beneath the image  
  frame\_style: 'borderless' | 'ornate\_parchment' | 'vignette' | 'clean\_cut';  
  fit\_mode: 'cover' | 'contain';      // CSS object-fit behavior inside the grid cell  
}

### **2\. Canvas & Grid Behavior**

> * **Column Span Adaptability:**  
  * **1-Column:** Standard for portrait character art (9:16, 4:3) or small item illustrations.  
  * **2-Column:** Spans the full page width, suitable for battle maps, landscape overviews (16:9, 21:9), and chapter-splash headers.  
> * **Layout Locking & Bleed:**  
  * Supports fixed pixel height, fluid aspect-ratio boxes, or full-width page header pins.  
  * Optional full-bleed mode for PDF rendering (image extends beyond the 15mm printable page margin).

### **3\. LLM & Image Generation Pipeline**

The Image Module interfaces with both the text LLM and diffusion/generation APIs (e.g., Imagen, Midjourney API, Stable Diffusion):

> * **Contextual Auto-Prompting:** The text LLM can automatically write or refine the prompt by reading connected scenario entities (e.g., pulling descriptive tags from a linked *Enemy* or *Adventure Site* to build an art prompt like: *"Dark fantasy oil painting of an ancient sunken crypt, algae-slick stone, torchlight reflections, 16:9"*).  
> * **Generation Lifecycle:**  
  1. User or LLM fills in prompt and selects aspect\_ratio.  
  2. Frontend sends request to backend generation worker.  
  3. Worker triggers the image model, uploads result to object storage (S3/GCS), and returns public CDN URLs.  
  4. Reactive store updates the entity; all duplicated instances of the image across pages immediately update.

### **4\. Export Handling (PDF, Word, Google Docs)**

| Format | Implementation |
| :---- | :---- |
| **PDF (Chromium)** | Directly embeds native high-resolution WebP/PNG assets within CSS aspect-ratio containers, maintaining exact border treatments and vignette clipping masks. |
| **Word (.docx)** | Maps CSS dimensions to native EMU (English Metric Units) to embed the image at target physical widths (e.g., 85mm for 1-column, 175mm for 2-column) without distortion. |
| **Google Docs** | Uses InlineObjectElement via the Google Docs API with explicit pixel width/height constraints matching the target aspect ratio. |

---

