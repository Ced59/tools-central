import type { EditorialTextSection } from './editorial-text-section.model';
import type { EditorialListSection } from './editorial-list-section.model';
import type { EditorialCalloutSection } from './editorial-callout-section.model';
import type { EditorialFaqSection } from './editorial-faq-section.model';
import type { EditorialMiniTableSection } from './editorial-table-section.model';

export type EditorialSection =
  | EditorialTextSection
  | EditorialListSection
  | EditorialCalloutSection
  | EditorialFaqSection
  | EditorialMiniTableSection;
