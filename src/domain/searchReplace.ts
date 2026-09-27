import { Entity } from './entities';
import { Page, Scenario, Placement } from '../store/scenarioStore';

export interface SearchOptions {
  query: string;
  replacement?: string;
  scope?: 'all' | string; // 'all' or specific pageId
  matchCase?: boolean;
  matchWholeWord?: boolean;
  useRegex?: boolean;
}

export interface SearchMatch {
  id: string;
  targetType: 'scenario_title' | 'page_title' | 'entity_name' | 'entity_attribute';
  targetId: string; // scenarioId | pageId | entityId
  pageId?: string;
  pageNumber?: number;
  pageTitle?: string;
  entityId?: string;
  entityName?: string;
  entityType?: string;
  fieldPath: string; // e.g. 'title', 'name', 'attributes.lore', 'attributes.sensoryDetails.sight'
  fieldLabel: string;
  matchIndex: number;
  matchLength: number;
  matchedText: string;
  replacementText: string;
  originalValue: string;
  replacedValue: string;
  beforeSnippet: string;
  afterSnippet: string;
}

export interface SearchStateContext {
  currentScenario: Scenario | null;
  pages: Page[];
  entities: Record<string, Entity>;
  placements: Record<string, Placement[]>;
}

export interface ReplacementResult {
  updatedScenario: Scenario | null;
  updatedPages: Page[];
  updatedEntities: Record<string, Entity>;
  replacementCount: number;
  entitiesUpdatedCount: number;
  pagesUpdatedCount: number;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRegex(options: SearchOptions): RegExp | null {
  const trimmed = options.query?.trim();
  if (!trimmed) return null;

  try {
    let pattern = options.query;
    if (!options.useRegex) {
      pattern = escapeRegex(pattern);
      if (options.matchWholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
    } else if (options.matchWholeWord) {
      pattern = `\\b(?:${pattern})\\b`;
    }

    const flags = options.matchCase ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  } catch (e) {
    console.error('Invalid regular expression in search:', e);
    return null;
  }
}

function makeSnippet(text: string, matchIndex: number, matchLength: number, snippetRadius = 25) {
  const start = Math.max(0, matchIndex - snippetRadius);
  const end = Math.min(text.length, matchIndex + matchLength + snippetRadius);

  const before = (start > 0 ? '…' : '') + text.slice(start, matchIndex);
  const after = text.slice(matchIndex + matchLength, end) + (end < text.length ? '…' : '');

  return { before, after };
}

function formatFieldLabel(fieldPath: string): string {
  if (fieldPath === 'name') return 'Name';
  if (fieldPath === 'title') return 'Title';

  const cleanPath = fieldPath.replace(/^attributes\./, '');
  const parts = cleanPath.split('.');

  return parts
    .map((part) => {
      if (/^\d+$/.test(part)) {
        return `#${Number(part) + 1}`;
      }
      return part
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
    })
    .join(' → ');
}

interface StringLocation {
  path: string;
  value: string;
}

function extractAllStrings(obj: unknown, prefix = ''): StringLocation[] {
  const results: StringLocation[] = [];

  if (typeof obj === 'string') {
    results.push({ path: prefix, value: obj });
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPrefix = prefix ? `${prefix}.${index}` : `${index}`;
      results.push(...extractAllStrings(item, itemPrefix));
    });
  } else if (obj !== null && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const keyPrefix = prefix ? `${prefix}.${key}` : key;
      results.push(...extractAllStrings(value, keyPrefix));
    }
  }

  return results;
}

export function findMatches(
  context: SearchStateContext,
  options: SearchOptions
): SearchMatch[] {
  if (!options.query || !options.query.trim()) {
    return [];
  }

  const regex = buildRegex(options);
  if (!regex) return [];

  const replacement = options.replacement ?? '';
  const matches: SearchMatch[] = [];
  const scope = options.scope || 'all';

  // Map each entityId to the pages where it appears
  const entityPageMap: Record<string, { pageId: string; pageNumber: number; pageTitle?: string }[]> = {};
  for (const page of context.pages) {
    const list = context.placements[page.id] || [];
    for (const pl of list) {
      if (!entityPageMap[pl.entityId]) {
        entityPageMap[pl.entityId] = [];
      }
      if (!entityPageMap[pl.entityId].some((p) => p.pageId === page.id)) {
        entityPageMap[pl.entityId].push({
          pageId: page.id,
          pageNumber: page.pageNumber,
          pageTitle: page.title,
        });
      }
    }
  }

  const helperSearchString = (
    text: string,
    meta: {
      targetType: SearchMatch['targetType'];
      targetId: string;
      pageId?: string;
      pageNumber?: number;
      pageTitle?: string;
      entityId?: string;
      entityName?: string;
      entityType?: string;
      fieldPath: string;
      fieldLabel?: string;
    }
  ) => {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const matchedText = match[0];
      const matchLength = matchedText.length;

      if (matchLength === 0) {
        regex.lastIndex++;
        continue;
      }

      const { before, after } = makeSnippet(text, matchIndex, matchLength);
      let calculatedReplacement = replacement;
      if (options.useRegex) {
        try {
          const singleRegex = new RegExp(regex.source, options.matchCase ? '' : 'i');
          calculatedReplacement = matchedText.replace(singleRegex, replacement);
        } catch {
          calculatedReplacement = replacement;
        }
      }

      const replacedValue =
        text.slice(0, matchIndex) + calculatedReplacement + text.slice(matchIndex + matchLength);

      const matchId = `match-${meta.targetType}-${meta.targetId}-${meta.fieldPath.replace(/[^a-zA-Z0-9]/g, '_')}-${matchIndex}`;

      matches.push({
        id: matchId,
        targetType: meta.targetType,
        targetId: meta.targetId,
        pageId: meta.pageId,
        pageNumber: meta.pageNumber,
        pageTitle: meta.pageTitle,
        entityId: meta.entityId,
        entityName: meta.entityName,
        entityType: meta.entityType,
        fieldPath: meta.fieldPath,
        fieldLabel: meta.fieldLabel || formatFieldLabel(meta.fieldPath),
        matchIndex,
        matchLength,
        matchedText,
        replacementText: calculatedReplacement,
        originalValue: text,
        replacedValue,
        beforeSnippet: before,
        afterSnippet: after,
      });
    }
  };

  // 1. Scenario Title (searched if scope is 'all')
  if (scope === 'all' && context.currentScenario?.title) {
    helperSearchString(context.currentScenario.title, {
      targetType: 'scenario_title',
      targetId: context.currentScenario.id,
      fieldPath: 'title',
      fieldLabel: 'Scenario Title',
    });
  }

  // 2. Pages
  const pagesToSearch = scope === 'all'
    ? context.pages
    : context.pages.filter((p) => p.id === scope);

  for (const page of pagesToSearch) {
    if (page.title) {
      helperSearchString(page.title, {
        targetType: 'page_title',
        targetId: page.id,
        pageId: page.id,
        pageNumber: page.pageNumber,
        pageTitle: page.title,
        fieldPath: 'title',
        fieldLabel: `Page ${page.pageNumber} Title`,
      });
    }
  }

  // 3. Entities
  let targetEntities: Entity[] = [];
  if (scope === 'all') {
    targetEntities = Object.values(context.entities);
  } else {
    const pagePlacements = context.placements[scope] || [];
    const entityIds = new Set(pagePlacements.map((p) => p.entityId));
    targetEntities = Object.values(context.entities).filter((e) => entityIds.has(e.id));
  }

  for (const entity of targetEntities) {
    const pagesInfo = entityPageMap[entity.id] || [];
    const firstPage = pagesInfo[0];
    const targetPage = scope !== 'all' ? context.pages.find((p) => p.id === scope) : undefined;
    const pageId = targetPage ? targetPage.id : firstPage?.pageId;
    const pageNumber = targetPage ? targetPage.pageNumber : firstPage?.pageNumber;
    const pageTitle = targetPage
      ? targetPage.title
      : pagesInfo.length > 0
      ? pagesInfo.map((p) => `Page ${p.pageNumber}`).join(', ')
      : 'Library (Unplaced)';

    // Search Entity Name
    helperSearchString(entity.name, {
      targetType: 'entity_name',
      targetId: entity.id,
      entityId: entity.id,
      entityName: entity.name,
      entityType: entity.entityType,
      pageId,
      pageNumber,
      pageTitle,
      fieldPath: 'name',
      fieldLabel: 'Element Name',
    });

    // Search Entity Attributes recursively
    if (entity.attributes) {
      const stringProps = extractAllStrings(entity.attributes, 'attributes');
      for (const prop of stringProps) {
        helperSearchString(prop.value, {
          targetType: 'entity_attribute',
          targetId: entity.id,
          entityId: entity.id,
          entityName: entity.name,
          entityType: entity.entityType,
          pageId,
          pageNumber,
          pageTitle,
          fieldPath: prop.path,
        });
      }
    }
  }

  return matches;
}

function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const isNextNumber = /^\d+$/.test(nextPart);

    if (current[part] === undefined || current[part] === null) {
      current[part] = isNextNumber ? [] : {};
    }
    current = current[part];
  }
  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}

function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

export function applyReplacements(
  context: SearchStateContext,
  matchesToApply: SearchMatch[]
): ReplacementResult {
  if (matchesToApply.length === 0) {
    return {
      updatedScenario: context.currentScenario,
      updatedPages: context.pages,
      updatedEntities: context.entities,
      replacementCount: 0,
      entitiesUpdatedCount: 0,
      pagesUpdatedCount: 0,
    };
  }

  let updatedScenario = context.currentScenario ? { ...context.currentScenario } : null;
  const updatedPagesMap: Record<string, Page> = {};
  context.pages.forEach((p) => {
    updatedPagesMap[p.id] = { ...p };
  });

  const updatedEntitiesMap: Record<string, Entity> = {};
  for (const [id, entity] of Object.entries(context.entities)) {
    updatedEntitiesMap[id] = {
      ...entity,
      attributes: JSON.parse(JSON.stringify(entity.attributes || {})),
    };
  }

  // Group matches by (targetType + targetId + fieldPath) so we can replace in descending index order
  type GroupKey = string;
  const groups: Record<GroupKey, SearchMatch[]> = {};

  for (const match of matchesToApply) {
    const key = `${match.targetType}::${match.targetId}::${match.fieldPath}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(match);
  }

  let totalReplacementsApplied = 0;
  const affectedEntityIds = new Set<string>();
  const affectedPageIds = new Set<string>();

  for (const [, matchList] of Object.entries(groups)) {
    // Sort descending by matchIndex so earlier indices are not shifted by string length alterations
    matchList.sort((a, b) => b.matchIndex - a.matchIndex);

    const first = matchList[0];
    const targetType = first.targetType;
    const targetId = first.targetId;
    const fieldPath = first.fieldPath;

    let originalString = '';

    if (targetType === 'scenario_title' && updatedScenario) {
      originalString = updatedScenario.title;
    } else if (targetType === 'page_title' && updatedPagesMap[targetId]) {
      originalString = updatedPagesMap[targetId].title || '';
    } else if (targetType === 'entity_name' && updatedEntitiesMap[targetId]) {
      originalString = updatedEntitiesMap[targetId].name;
    } else if (targetType === 'entity_attribute' && updatedEntitiesMap[targetId]) {
      originalString = getNestedValue(updatedEntitiesMap[targetId], fieldPath) || '';
    }

    let modifiedString = originalString;

    for (const match of matchList) {
      const idx = match.matchIndex;
      const len = match.matchLength;
      const rep = match.replacementText;

      modifiedString = modifiedString.slice(0, idx) + rep + modifiedString.slice(idx + len);
      totalReplacementsApplied++;
    }

    // Write back modified string
    if (targetType === 'scenario_title' && updatedScenario) {
      updatedScenario.title = modifiedString;
      updatedScenario.updatedAt = new Date().toISOString();
    } else if (targetType === 'page_title' && updatedPagesMap[targetId]) {
      updatedPagesMap[targetId].title = modifiedString;
      affectedPageIds.add(targetId);
    } else if (targetType === 'entity_name' && updatedEntitiesMap[targetId]) {
      updatedEntitiesMap[targetId].name = modifiedString;
      updatedEntitiesMap[targetId].updatedAt = new Date().toISOString();
      affectedEntityIds.add(targetId);
    } else if (targetType === 'entity_attribute' && updatedEntitiesMap[targetId]) {
      setNestedValue(updatedEntitiesMap[targetId], fieldPath, modifiedString);
      updatedEntitiesMap[targetId].updatedAt = new Date().toISOString();
      affectedEntityIds.add(targetId);
    }
  }

  return {
    updatedScenario,
    updatedPages: Object.values(updatedPagesMap),
    updatedEntities: updatedEntitiesMap,
    replacementCount: totalReplacementsApplied,
    entitiesUpdatedCount: affectedEntityIds.size,
    pagesUpdatedCount: affectedPageIds.size,
  };
}
