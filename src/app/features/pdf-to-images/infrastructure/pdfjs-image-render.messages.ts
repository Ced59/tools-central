import type { PdfRenderedImage, PdfRenderPlan } from '../domain/pdf-to-images.models';

export interface PdfImageRenderWorkerCommand {
  data: ArrayBuffer;
  password?: string;
  plan: PdfRenderPlan;
  assetRoot: string;
}

export type PdfImageRenderWorkerResponse =
  | Readonly<{ type: 'progress'; completed: number; total: number }>
  | Readonly<{ type: 'success'; images: PdfRenderedImage[] }>
  | Readonly<{ type: 'failure'; name: string; message: string }>;
