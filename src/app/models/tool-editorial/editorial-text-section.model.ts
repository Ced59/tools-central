import type { EditorialBaseSection } from './editorial-section-base.model';

export interface EditorialTextSection extends EditorialBaseSection {
  kind: 'text';
  paragraphs: string[];
}
