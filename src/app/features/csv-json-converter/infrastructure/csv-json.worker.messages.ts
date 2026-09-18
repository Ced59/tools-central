import type {
  CsvJsonConversionOptions,
  CsvJsonConversionResult,
} from '../domain/csv-json.models';

export interface CsvJsonWorkerRequest {
  source: string;
  options: CsvJsonConversionOptions;
}

export type CsvJsonWorkerResponse =
  | Readonly<{ type: 'success'; result: CsvJsonConversionResult }>
  | Readonly<{ type: 'failure'; message: string }>;
