import type { EditorialBaseSection } from './editorial-section-base.model';

export interface EditorialFaqSection extends EditorialBaseSection {
  kind: 'faq';
  items: Array<{
    q: string;
    a: string;
  }>;
}
