import { describe, expect, it, vi } from 'vitest';

import {
  CleanOoxmlMetadataUseCase,
  DownloadCleanedOoxmlUseCase,
  OoxmlMetadataValidationError,
} from './ooxml-metadata-cleaner.use-cases';
import type {
  OoxmlFileReaderPort,
  OoxmlMetadataCleanerPort,
  OoxmlMetadataDownloadPort,
} from './ooxml-metadata-cleaner.ports';
import type { OoxmlDocumentKind, OoxmlMetadataOptions } from '../domain/ooxml-metadata.models';

const options: OoxmlMetadataOptions = {
  removeCoreProperties: true,
  removeApplicationProperties: true,
  removeCustomProperties: true,
  removeThumbnail: true,
};

function createUseCase(overrides?: {
  read?: OoxmlFileReaderPort['read'];
  clean?: OoxmlMetadataCleanerPort['clean'];
}): CleanOoxmlMetadataUseCase {
  return new CleanOoxmlMetadataUseCase(
    { read: overrides?.read ?? vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]))) },
    {
      clean: overrides?.clean ?? vi.fn((_data: Uint8Array, kind: OoxmlDocumentKind) => Promise.resolve({
        blob: new Blob(['clean']),
        report: {
          kind,
          detected: [],
          removed: [],
          remaining: [],
          detectedCount: 0,
          removedCount: 0,
          remainingCount: 0,
          truncatedFindingCount: 0,
          archiveEntryCount: 3,
          uncompressedBytes: 10,
        },
      })),
    },
  );
}

describe('CleanOoxmlMetadataUseCase', () => {
  it('reads, cleans and names a supported document', async () => {
    const progress = vi.fn();
    const result = await createUseCase().execute({
      source: { fileName: 'rapport.docx', size: 3, blob: new Blob(['zip']) },
      options,
      onProgress: progress,
    });
    expect(result.fileName).toBe('rapport-sans-metadonnees.docx');
    expect(result.report.kind).toBe('docx');
    expect(result.blob.size).toBe(5);
  });

  it.each([
    ['empty-file', { fileName: 'a.docx', size: 0, blob: new Blob() }],
    ['unsupported-format', { fileName: 'a.docm', size: 2, blob: new Blob(['a']) }],
  ] as const)('rejects %s before reading', async (code, source) => {
    await expect(createUseCase().execute({ source, options }))
      .rejects.toEqual(expect.objectContaining({ code }));
  });

  it('requires at least one cleaning option', async () => {
    await expect(createUseCase().execute({
      source: { fileName: 'a.xlsx', size: 2, blob: new Blob(['a']) },
      options: {
        removeCoreProperties: false,
        removeApplicationProperties: false,
        removeCustomProperties: false,
        removeThumbnail: false,
      },
    })).rejects.toEqual(expect.objectContaining({ code: 'no-option-selected' }));
  });

  it('maps a bounded Worker error to an application validation error', async () => {
    const cleaner = vi.fn(() => Promise.reject(Object.assign(new Error('compression-ratio-exceeded'), {
      code: 'compression-ratio-exceeded',
      entryName: 'word/document.xml',
    })));
    await expect(createUseCase({ clean: cleaner }).execute({
      source: { fileName: 'a.docx', size: 2, blob: new Blob(['a']) },
      options,
    })).rejects.toEqual(expect.objectContaining<OoxmlMetadataValidationError>({
      code: 'compression-ratio-exceeded',
      entryName: 'word/document.xml',
      name: 'Error',
      message: 'compression-ratio-exceeded',
    }));
  });

  it('preserves cancellation errors', async () => {
    const reader = vi.fn(() => {
      const error = new Error('cancelled');
      error.name = 'AbortError';
      return Promise.reject(error);
    });
    await expect(createUseCase({ read: reader }).execute({
      source: { fileName: 'a.pptx', size: 2, blob: new Blob(['a']) },
      options,
    })).rejects.toEqual(expect.objectContaining({ name: 'AbortError' }));
  });
});

describe('DownloadCleanedOoxmlUseCase', () => {
  it('delegates the generated blob and safe file name', () => {
    const download = vi.fn<OoxmlMetadataDownloadPort['download']>();
    const document = {
      blob: new Blob(['clean']),
      fileName: 'clean.docx',
      report: {
        kind: 'docx' as const,
        detected: [],
        removed: [],
        remaining: [],
        detectedCount: 0,
        removedCount: 0,
        remainingCount: 0,
        truncatedFindingCount: 0,
        archiveEntryCount: 3,
        uncompressedBytes: 10,
      },
    };
    new DownloadCleanedOoxmlUseCase({ download }).execute(document);
    expect(download).toHaveBeenCalledWith(document.blob, 'clean.docx');
  });
});
