import { describe, expect, it, vi } from 'vitest';

import type {
  JsonSchemaClipboardPort,
  JsonSchemaDownloadPort,
  JsonSchemaLocationPort,
  JsonSchemaTextFileReaderPort,
  JsonSchemaValidatorPort,
} from './json-schema-validator.ports';
import {
  CopyJsonSchemaArtifactUseCase,
  CopyJsonSchemaShareLinkUseCase,
  DownloadJsonSchemaArtifactUseCase,
  JSON_SCHEMA_MAX_FILE_BYTES,
  JSON_SCHEMA_MAX_SCHEMA_CHARACTERS,
  JsonSchemaFileError,
  ReadJsonSchemaSourceFileUseCase,
  ValidateJsonSchemaUseCase,
  type JsonSchemaValidationResult,
} from './json-schema-validator.use-cases';

const SUCCESS_RESULT: JsonSchemaValidationResult = {
  ok: true,
  valid: false,
  draft: 'draft-07',
  issues: [],
  errors: [],
  errorsTruncated: false,
  totalErrors: 1,
  correction: { source: '{"name":"Ada"}', corrections: [], valid: true, remainingErrors: 0 },
  report: '{"valid":false}',
  stats: { schemaCharacters: 2, instanceCharacters: 2, schemaNodes: 1, instanceNodes: 1, patterns: 0 },
};

describe('ValidateJsonSchemaUseCase', () => {
  it('delegates bounded validation with its abort signal', async () => {
    const signal = new AbortController().signal;
    const validate = vi.fn().mockResolvedValue(SUCCESS_RESULT);
    const port: JsonSchemaValidatorPort = { validate };
    const result = await new ValidateJsonSchemaUseCase(port).execute(
      '{}',
      '{}',
      { draft: 'auto', validateFormats: true },
      signal,
    );
    expect(result).toBe(SUCCESS_RESULT);
    expect(validate).toHaveBeenCalledWith('{}', '{}', { draft: 'auto', validateFormats: true }, signal);
  });

  it('rejects an oversized schema before starting a worker', async () => {
    const validate = vi.fn();
    const result = await new ValidateJsonSchemaUseCase({ validate }).execute(
      'x'.repeat(JSON_SCHEMA_MAX_SCHEMA_CHARACTERS + 1),
      '{}',
      { draft: 'auto', validateFormats: true },
    );
    expect(result.issues[0]).toMatchObject({ code: 'source-too-large', side: 'schema' });
    expect(validate).not.toHaveBeenCalled();
  });
});

describe('ReadJsonSchemaSourceFileUseCase', () => {
  it('reads supported local files', async () => {
    const read = vi.fn().mockResolvedValue('{}');
    const reader: JsonSchemaTextFileReaderPort = { read };
    const blob = new Blob(['{}']);
    const result = await new ReadJsonSchemaSourceFileUseCase(reader).execute({
      fileName: 'profile.schema.json',
      size: blob.size,
      blob,
    });
    expect(result).toBe('{}');
    expect(read).toHaveBeenCalledWith(blob, undefined);
  });

  it.each([
    ['empty-file', { fileName: 'empty.json', size: 0, blob: new Blob([]) }],
    ['file-too-large', { fileName: 'huge.json', size: JSON_SCHEMA_MAX_FILE_BYTES + 1, blob: new Blob(['x']) }],
    ['unsupported-file', { fileName: 'schema.yaml', size: 4, blob: new Blob(['x']) }],
  ] as const)('rejects %s', async (code, source) => {
    const useCase = new ReadJsonSchemaSourceFileUseCase({ read: vi.fn() });
    await expect(useCase.execute(source)).rejects.toMatchObject({ code });
  });

  it('rejects an already aborted read', async () => {
    const controller = new AbortController();
    controller.abort();
    const useCase = new ReadJsonSchemaSourceFileUseCase({ read: vi.fn() });
    await expect(useCase.execute({ fileName: 'data.json', size: 2, blob: new Blob(['{}']) }, controller.signal))
      .rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('JSON Schema output use cases', () => {
  it('copies reports and corrected examples', async () => {
    const copy = vi.fn().mockResolvedValue(true);
    const port: JsonSchemaClipboardPort = { copy };
    const useCase = new CopyJsonSchemaArtifactUseCase(port);
    await expect(useCase.execute(SUCCESS_RESULT, 'report')).resolves.toBe(true);
    await expect(useCase.execute(SUCCESS_RESULT, 'correction')).resolves.toBe(true);
    expect(copy).toHaveBeenNthCalledWith(1, SUCCESS_RESULT.report);
    expect(copy).toHaveBeenNthCalledWith(2, SUCCESS_RESULT.correction?.source);
  });

  it('downloads artifacts with stable file names', () => {
    const download = vi.fn();
    const port: JsonSchemaDownloadPort = { download };
    const useCase = new DownloadJsonSchemaArtifactUseCase(port);
    useCase.execute(SUCCESS_RESULT, 'report');
    useCase.execute(SUCCESS_RESULT, 'correction');
    expect(download).toHaveBeenNthCalledWith(
      1,
      SUCCESS_RESULT.report,
      'json-schema-validation-report.json',
      'application/json;charset=utf-8',
    );
    expect(download).toHaveBeenNthCalledWith(
      2,
      SUCCESS_RESULT.correction?.source,
      'json-schema-corrected-example.json',
      'application/json;charset=utf-8',
    );
  });

  it('copies a public share link without input data', async () => {
    const copy = vi.fn().mockResolvedValue(true);
    const clipboard: JsonSchemaClipboardPort = { copy };
    const location: JsonSchemaLocationPort = { publicUrlWithoutData: () => 'https://example.com/tool' };
    await new CopyJsonSchemaShareLinkUseCase(clipboard, location).execute();
    expect(copy).toHaveBeenCalledWith('https://example.com/tool');
  });

  it('does not copy a missing correction', async () => {
    const copy = vi.fn();
    const result = { ...SUCCESS_RESULT, correction: null };
    await expect(new CopyJsonSchemaArtifactUseCase({ copy }).execute(result, 'correction')).resolves.toBe(false);
    expect(copy).not.toHaveBeenCalled();
  });
});

describe('JsonSchemaFileError', () => {
  it('keeps a stable error name and code', () => {
    const error = new JsonSchemaFileError('invalid-utf8');
    expect(error.name).toBe('JsonSchemaFileError');
    expect(error.code).toBe('invalid-utf8');
  });
});
