import type { PreparedPdfImage } from '../application/images-to-pdf.ports';
import type { ImagePdfSettings } from '../domain/images-to-pdf.models';

export interface ImagePdfWorkerCommand {
  images: PreparedPdfImage[];
  settings: ImagePdfSettings;
}

export type ImagePdfWorkerResponse =
  | Readonly<{ type: 'progress'; completed: number; total: number }>
  | Readonly<{ type: 'success'; pdf: Blob }>
  | Readonly<{ type: 'failure'; name: string; message: string }>;
