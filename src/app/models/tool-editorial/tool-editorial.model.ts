import type { EditorialTone } from './editorial-tone.type';
import type { EditorialSection } from './editorial-section.model';

export interface ToolEditorialModel {
  title?: string;
  lead?: string;
  tone?: EditorialTone;
  updatedAtIso?: string;
  sections?: EditorialSection[];
}
