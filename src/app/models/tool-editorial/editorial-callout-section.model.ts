import type { EditorialBaseSection } from './editorial-section-base.model';

export type EditorialCalloutVariant = 'info' | 'warning' | 'success';

export interface EditorialCalloutSection extends EditorialBaseSection {
  kind: 'callout';
  variant?: EditorialCalloutVariant;
  text: string;
}
