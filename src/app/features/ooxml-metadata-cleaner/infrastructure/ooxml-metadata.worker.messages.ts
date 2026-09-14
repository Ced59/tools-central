import type {
  OoxmlDocumentKind,
  OoxmlMetadataOptions,
  OoxmlMetadataReport,
} from '../domain/ooxml-metadata.models';
import type { OoxmlMetadataFailureCode } from '../application/ooxml-metadata-cleaner.use-cases';

export interface OoxmlMetadataWorkerRequest {
  type: 'clean';
  data: ArrayBuffer;
  kind: OoxmlDocumentKind;
  options: OoxmlMetadataOptions;
}

export type OoxmlMetadataWorkerResponse =
  | { type: 'progress'; percent: number }
  | { type: 'success'; output: ArrayBuffer; report: OoxmlMetadataReport }
  | {
    type: 'failure';
    code: OoxmlMetadataFailureCode;
    entryName?: string;
    message: string;
  };
