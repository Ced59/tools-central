import { describe, expect, it, vi } from 'vitest';

import {
  CompareJsonDocumentsUseCase,
  CopyJsonDiffArtifactUseCase,
  CopyJsonDiffShareLinkUseCase,
  DownloadJsonDiffArtifactUseCase,
  JSON_DIFF_MAX_FILE_BYTES,
  JSON_DIFF_MAX_SOURCE_CHARACTERS,
  JsonDiffFileError,
  ReadJsonDiffSourceFileUseCase,
} from './json-diff.use-cases';
import type { JsonDiffResult } from '../domain/json-diff.models';

const RESULT: JsonDiffResult = {
  ok: true,
  equivalent: false,
  issues: [],
  summary: { added: 1, removed: 0, changed: 0, typeChanged: 0, moved: 0, total: 1 },
  changes: [],
  changesTruncated: false,
  patch: '[{"op":"add","path":"/x","value":1}]',
  report: '{"summary":{"added":1}}',
  stats: { leftCharacters: 2, rightCharacters: 7, leftNodes: 1, rightNodes: 2, ignoredPaths: 0 },
};

describe('JSON diff use cases', () => {
  it('délègue la comparaison au port et transmet le signal', async () => {
    const compare = vi.fn().mockResolvedValue(RESULT);
    const controller = new AbortController();
    const useCase = new CompareJsonDocumentsUseCase({ compare });

    await expect(useCase.execute('{}', '{"x":1}', {
      arrayMode: 'index',
      arrayKey: '/id',
      ignoredPaths: '',
    }, controller.signal)).resolves.toBe(RESULT);
    expect(compare).toHaveBeenCalledWith('{}', '{"x":1}', expect.any(Object), controller.signal);
  });

  it('refuse une source trop longue avant de la transférer au Worker', async () => {
    const compare = vi.fn();
    const useCase = new CompareJsonDocumentsUseCase({ compare });

    const result = await useCase.execute(
      '{}',
      'x'.repeat(JSON_DIFF_MAX_SOURCE_CHARACTERS + 1),
      { arrayMode: 'index', arrayKey: '/id', ignoredPaths: '' },
    );

    expect(result.issues[0]).toMatchObject({ code: 'source-too-large', side: 'right' });
    expect(compare).not.toHaveBeenCalled();
  });

  it('valide taille, extension et présence avant la lecture locale', async () => {
    const read = vi.fn().mockResolvedValue('{}');
    const useCase = new ReadJsonDiffSourceFileUseCase({ read });
    const validBlob = new Blob(['{}']);

    await expect(useCase.execute({ fileName: 'left.json', size: 2, blob: validBlob })).resolves.toBe('{}');
    await expect(useCase.execute({ fileName: 'empty.json', size: 0, blob: new Blob() }))
      .rejects.toMatchObject({ code: 'empty-file' });
    await expect(useCase.execute({ fileName: 'large.json', size: JSON_DIFF_MAX_FILE_BYTES + 1, blob: validBlob }))
      .rejects.toMatchObject({ code: 'file-too-large' });
    await expect(useCase.execute({ fileName: 'data.csv', size: 2, blob: validBlob }))
      .rejects.toMatchObject({ code: 'unsupported-file' });
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('respecte un signal déjà annulé avant la lecture', async () => {
    const controller = new AbortController();
    controller.abort();
    const useCase = new ReadJsonDiffSourceFileUseCase({ read: vi.fn() });

    await expect(useCase.execute({ fileName: 'a.json', size: 2, blob: new Blob(['{}']) }, controller.signal))
      .rejects.toMatchObject({ name: 'AbortError' });
  });

  it('copie ou télécharge uniquement les artefacts d’un résultat valide', async () => {
    const copy = vi.fn().mockResolvedValue(true);
    const download = vi.fn();
    const copyUseCase = new CopyJsonDiffArtifactUseCase({ copy });
    const downloadUseCase = new DownloadJsonDiffArtifactUseCase({ download });

    await expect(copyUseCase.execute(RESULT, 'patch')).resolves.toBe(true);
    await expect(copyUseCase.execute({ ...RESULT, ok: false }, 'report')).resolves.toBe(false);
    downloadUseCase.execute(RESULT, 'report');
    downloadUseCase.execute({ ...RESULT, ok: false }, 'patch');

    expect(copy).toHaveBeenCalledWith(RESULT.patch);
    expect(download).toHaveBeenCalledOnce();
    expect(download).toHaveBeenCalledWith(
      RESULT.report,
      'json-diff-report.json',
      'application/json;charset=utf-8',
    );
  });

  it('copie un lien fourni sans sérialiser les documents', async () => {
    const copy = vi.fn().mockResolvedValue(true);
    const publicUrlWithoutData = vi.fn().mockReturnValue('https://example.test/fr/json-diff');
    const useCase = new CopyJsonDiffShareLinkUseCase({ copy }, { publicUrlWithoutData });

    await expect(useCase.execute()).resolves.toBe(true);
    expect(copy).toHaveBeenCalledWith('https://example.test/fr/json-diff');
  });

  it('expose une erreur de fichier typée', () => {
    expect(new JsonDiffFileError('invalid-utf8')).toMatchObject({
      name: 'JsonDiffFileError',
      code: 'invalid-utf8',
    });
  });
});
