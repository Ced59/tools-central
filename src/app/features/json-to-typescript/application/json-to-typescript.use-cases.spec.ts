import { describe, expect, it, vi } from 'vitest';

import type {
  JsonToTypeScriptClipboardPort,
  JsonToTypeScriptDownloadPort,
  JsonToTypeScriptGeneratorPort,
  JsonToTypeScriptLocationPort,
  JsonToTypeScriptTextFileReaderPort,
} from './json-to-typescript.ports';
import {
  CopyJsonToTypeScriptArtifactUseCase,
  CopyJsonToTypeScriptShareLinkUseCase,
  DownloadJsonToTypeScriptArtifactUseCase,
  GenerateTypeScriptFromJsonUseCase,
  JSON_TO_TYPESCRIPT_MAX_FILE_BYTES,
  JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS,
  JsonToTypeScriptFileError,
  ReadJsonToTypeScriptSourceFileUseCase,
} from './json-to-typescript.use-cases';
import {
  generateTypeScriptFromJson,
  type JsonToTypeScriptOptions,
} from '../domain/json-to-typescript.models';

const OPTIONS: JsonToTypeScriptOptions = {
  rootName: 'User',
  declarationKind: 'interface',
  arrayObjectMode: 'merge',
  inferDates: false,
  readonlyProperties: false,
};

describe('JSON to TypeScript use cases', () => {
  it('delegates generation to the isolated port', async () => {
    const expected = generateTypeScriptFromJson('{"id":1}', OPTIONS);
    const generator: JsonToTypeScriptGeneratorPort = {
      generate: vi.fn().mockResolvedValue(expected),
    };

    await expect(new GenerateTypeScriptFromJsonUseCase(generator).execute('{"id":1}', OPTIONS))
      .resolves.toBe(expected);
    expect(generator.generate).toHaveBeenCalledWith('{"id":1}', OPTIONS, undefined);
  });

  it('rejects an oversized source before starting a Worker', async () => {
    const generator: JsonToTypeScriptGeneratorPort = { generate: vi.fn() };
    const source = 'x'.repeat(JSON_TO_TYPESCRIPT_MAX_SOURCE_CHARACTERS + 1);

    const result = await new GenerateTypeScriptFromJsonUseCase(generator).execute(source, OPTIONS);

    expect(result.issues[0].code).toBe('source-too-large');
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it('validates file name, size, and cancellation before reading', async () => {
    const reader: JsonToTypeScriptTextFileReaderPort = {
      read: vi.fn().mockResolvedValue('{"id":1}'),
    };
    const useCase = new ReadJsonToTypeScriptSourceFileUseCase(reader);

    await expect(useCase.execute({ fileName: 'sample.json', size: 8, blob: new Blob(['x']) }))
      .resolves.toBe('{"id":1}');
    await expect(useCase.execute({ fileName: 'sample.js', size: 8, blob: new Blob(['x']) }))
      .rejects.toMatchObject({ code: 'unsupported-file' });
    await expect(useCase.execute({ fileName: 'sample.json', size: 0, blob: new Blob() }))
      .rejects.toMatchObject({ code: 'empty-file' });
    await expect(useCase.execute({
      fileName: 'sample.json',
      size: JSON_TO_TYPESCRIPT_MAX_FILE_BYTES + 1,
      blob: new Blob(['x']),
    })).rejects.toMatchObject({ code: 'file-too-large' });

    const controller = new AbortController();
    controller.abort();
    await expect(useCase.execute(
      { fileName: 'sample.txt', size: 8, blob: new Blob(['x']) },
      controller.signal,
    )).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('copies and downloads each result artifact with stable names', async () => {
    const copy = vi.fn().mockResolvedValue(true);
    const triggerDownload = vi.fn();
    const clipboard: JsonToTypeScriptClipboardPort = { copy };
    const download: JsonToTypeScriptDownloadPort = { download: triggerDownload };
    const result = generateTypeScriptFromJson('{"id":1}', OPTIONS);

    await expect(new CopyJsonToTypeScriptArtifactUseCase(clipboard).execute(result, 'typescript'))
      .resolves.toBe(true);
    await new CopyJsonToTypeScriptArtifactUseCase(clipboard).execute(result, 'report');
    const downloadUseCase = new DownloadJsonToTypeScriptArtifactUseCase(download);
    downloadUseCase.execute(result, 'typescript');
    downloadUseCase.execute(result, 'report');

    expect(copy).toHaveBeenNthCalledWith(1, result.output);
    expect(copy).toHaveBeenNthCalledWith(2, result.report);
    expect(triggerDownload).toHaveBeenNthCalledWith(
      1,
      result.output,
      'User.ts',
      'text/typescript;charset=utf-8',
    );
    expect(triggerDownload).toHaveBeenNthCalledWith(
      2,
      result.report,
      'User-rapport.json',
      'application/json;charset=utf-8',
    );
  });

  it('shares only the clean page URL, never the JSON input', async () => {
    const clipboard: JsonToTypeScriptClipboardPort = { copy: vi.fn().mockResolvedValue(true) };
    const location: JsonToTypeScriptLocationPort = {
      currentUrlWithoutQueryOrFragment: () => 'https://tools.test/fr/json-to-typescript',
    };

    await new CopyJsonToTypeScriptShareLinkUseCase(clipboard, location).execute();

    expect(clipboard.copy).toHaveBeenCalledWith('https://tools.test/fr/json-to-typescript');
  });

  it('exposes stable file errors', () => {
    expect(new JsonToTypeScriptFileError('invalid-utf8').code).toBe('invalid-utf8');
  });
});
