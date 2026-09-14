import {
  analyzeStructuredData,
  serializeStructuredDataAnalysis,
  STRUCTURED_DATA_MAX_SOURCE_CHARACTERS,
  type StructuredDataAnalysis,
  type StructuredMarkupExtraction,
} from '../domain/structured-data';

export type {
  StructuredDataAnalysis,
  StructuredDataFormat,
  StructuredDataIssue,
  StructuredDataIssueCode,
  StructuredDataIssueSeverity,
  StructuredDataNode,
  StructuredDataProperty,
  StructuredMarkupExtraction,
} from '../domain/structured-data';

export interface StructuredDataMarkupParserPort {
  extract(source: string, baseUrl: string): StructuredMarkupExtraction;
}

export interface StructuredDataClipboardPort {
  copy(text: string): Promise<boolean>;
}

export interface StructuredDataDownloadPort {
  download(content: string, filename: string, mediaType: string): void;
}

export class ExtractStructuredDataUseCase {
  constructor(private readonly parser: StructuredDataMarkupParserPort) {}

  execute(source: string, baseUrl = ''): StructuredDataAnalysis {
    const normalized = source.trim();
    const truncated = normalized.length > STRUCTURED_DATA_MAX_SOURCE_CHARACTERS;
    const extraction = this.parser.extract(
      normalized.slice(0, STRUCTURED_DATA_MAX_SOURCE_CHARACTERS),
      baseUrl.trim().slice(0, 2_048),
    );
    return analyzeStructuredData({
      ...extraction,
      sourceLength: normalized.length,
      truncated,
    });
  }
}

export class CopyStructuredDataReportUseCase {
  constructor(private readonly clipboard: StructuredDataClipboardPort) {}

  execute(analysis: StructuredDataAnalysis): Promise<boolean> {
    return this.clipboard.copy(serializeStructuredDataAnalysis(analysis));
  }
}

export class DownloadStructuredDataReportUseCase {
  constructor(private readonly downloadPort: StructuredDataDownloadPort) {}

  execute(analysis: StructuredDataAnalysis): void {
    this.downloadPort.download(
      serializeStructuredDataAnalysis(analysis),
      'structured-data-report.json',
      'application/json;charset=utf-8',
    );
  }
}
