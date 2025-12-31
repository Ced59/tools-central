import type { EditorialBaseSection } from './editorial-section-base.model';

export interface EditorialMiniTableSection extends EditorialBaseSection {
  kind: 'table';
  columns: string[];
  rows: Array<string[]>;
  caption?: string;
}
