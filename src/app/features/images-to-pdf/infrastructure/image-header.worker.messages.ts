import type { RasterImageHeader } from '../domain/images-to-pdf.models';

export interface ImageHeaderWorkerCommand {
  blob: Blob;
}

export type ImageHeaderWorkerResponse =
  | Readonly<{ type: 'success'; header: RasterImageHeader | null }>
  | Readonly<{ type: 'failure'; message: string }>;
