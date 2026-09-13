import type {
  PdfSanitizeCounts,
  PdfSanitizeOptions,
} from '../domain/pdf-sanitize.models';

export type SanitizePdfCommand = Readonly<{
  pdfBytes: ArrayBuffer;
  options: PdfSanitizeOptions;
}>;

export type SanitizePdfResult = Readonly<{
  pdfBytes: ArrayBuffer;
  counts: PdfSanitizeCounts;
  annotationsMayRemain: boolean;
}>;

export interface PdfSanitizerPort {
  sanitize(command: SanitizePdfCommand): Promise<SanitizePdfResult>;
}

export class SanitizePdfUseCase {
  constructor(private readonly sanitizer: PdfSanitizerPort) {}

  execute(command: SanitizePdfCommand): Promise<SanitizePdfResult> {
    return this.sanitizer.sanitize(command);
  }
}
