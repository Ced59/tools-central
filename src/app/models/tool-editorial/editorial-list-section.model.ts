import type { EditorialBaseSection } from './editorial-section-base.model';

export interface EditorialListSection extends EditorialBaseSection {
  kind: 'list';
  items: Array<{
    title?: string;
    text: string;
  }>;
}
