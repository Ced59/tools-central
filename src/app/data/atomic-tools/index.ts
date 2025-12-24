import { Type } from '@angular/core';
import type { CategoryId } from '../categories';
import type { GroupId } from '../tool-groups';
import type { SubGroupId } from '../tool-subgroups';

import { PERCENTAGES_TOOLS } from './math/percentages.tools';
import { RATIOS_TOOLS } from './math/ratios.tools';
import { RULE_OF_THREE_TOOLS } from './math/rule-of-three.tools';
import { STATISTICS_TOOLS } from './math/statistics.tools';
import { FRACTIONS_TOOLS } from './math/fractions.tools';
import { ROUNDING_TOOLS } from './math/rounding.tools';
import {TEXT_CASE_TOOLS} from "./text/text-case.tools";
import {WRITING_TOOLS} from "./text/writing.tools";
import {DEV_PDF_TOOLS} from "./dev/pdf";

export interface AtomicTool<C extends CategoryId, G extends GroupId<C>> {
  category: C;
  group: G;
  subGroup: SubGroupId<C, G>;
  title: string;
  description: string;
  icon?: string;
  route: string;
  available: boolean;
  loadComponent?: () => Promise<Type<unknown>>;
}

/** Helper: union “any valid pair” (évite never) */
export type AtomicToolAny = {
  [C in CategoryId]: {
    [G in GroupId<C>]: AtomicTool<C, G>;
  }[GroupId<C>];
}[CategoryId];

/** ✅ Registry global : merge par groupe */
export const ATOMIC_TOOLS = {
  ...PERCENTAGES_TOOLS,
  ...RATIOS_TOOLS,
  ...RULE_OF_THREE_TOOLS,
  ...STATISTICS_TOOLS,
  ...FRACTIONS_TOOLS,
  ...ROUNDING_TOOLS,
  ...TEXT_CASE_TOOLS,
  ...WRITING_TOOLS,
  ...DEV_PDF_TOOLS
} as const satisfies Record<string, AtomicToolAny>;

export type ToolId = keyof typeof ATOMIC_TOOLS;
export type AtomicToolItem = { id: ToolId } & (typeof ATOMIC_TOOLS)[ToolId];

export const ATOMIC_TOOL_LIST: AtomicToolItem[] = Object.entries(ATOMIC_TOOLS).map(([id, tool]) => ({
  id: id as ToolId,
  ...tool,
}));

export function getToolById(id: ToolId) {
  return ATOMIC_TOOLS[id];
}
