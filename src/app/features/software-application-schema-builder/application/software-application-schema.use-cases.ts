import {
  buildSoftwareApplicationSchema,
  type SoftwareApplicationSchemaInput,
  type SoftwareApplicationSchemaResult,
} from '../domain/software-application-schema';

export {
  SOFTWARE_APPLICATION_CATEGORIES,
  SOFTWARE_APPLICATION_TYPES,
} from '../domain/software-application-schema';

export type {
  SoftwareApplicationCategory,
  SoftwareApplicationSchemaField,
  SoftwareApplicationSchemaInput,
  SoftwareApplicationSchemaIssue,
  SoftwareApplicationSchemaIssueCode,
  SoftwareApplicationSchemaIssueSeverity,
  SoftwareApplicationSchemaResult,
  SoftwareApplicationSchemaState,
  SoftwareApplicationType,
} from '../domain/software-application-schema';

export type SoftwareApplicationSchemaOutputFormat = 'jsonLd' | 'scriptTag';

export class GenerateSoftwareApplicationSchemaUseCase {
  execute(input: SoftwareApplicationSchemaInput): SoftwareApplicationSchemaResult {
    return buildSoftwareApplicationSchema(input);
  }
}

export interface SoftwareApplicationSchemaClipboardPort {
  copy(text: string): Promise<boolean>;
}

export interface SoftwareApplicationSchemaDownloadPort {
  download(content: string, filename: string, mediaType: string): void;
}

export class CopySoftwareApplicationSchemaUseCase {
  constructor(private readonly clipboard: SoftwareApplicationSchemaClipboardPort) {}

  execute(content: string): Promise<boolean> {
    return content ? this.clipboard.copy(content) : Promise.resolve(false);
  }
}

export class DownloadSoftwareApplicationSchemaUseCase {
  constructor(private readonly downloadPort: SoftwareApplicationSchemaDownloadPort) {}

  execute(format: SoftwareApplicationSchemaOutputFormat, content: string): void {
    if (!content) return;
    const files: Record<SoftwareApplicationSchemaOutputFormat, { filename: string; mediaType: string }> = {
      jsonLd: {
        filename: 'software-application.jsonld.json',
        mediaType: 'application/ld+json;charset=utf-8',
      },
      scriptTag: {
        filename: 'software-application-json-ld.html',
        mediaType: 'text/html;charset=utf-8',
      },
    };
    const file = files[format];
    this.downloadPort.download(content, file.filename, file.mediaType);
  }
}
