import { describe, expect, it, vi } from 'vitest';

import type { PdfDocumentRendererPort, PdfImageArchivePort, PdfImageDownloadPort } from './pdf-to-images.ports';
import {
  ConvertPdfToImagesUseCase,
  DownloadPdfImagesUseCase,
  InspectPdfForImagesUseCase,
  PdfToImagesValidationError,
} from './pdf-to-images.use-cases';
import { PDF_TO_IMAGES_MAX_FILE_BYTES, type PdfDocumentSummary } from '../domain/pdf-to-images.models';

const document: PdfDocumentSummary = {
  pageCount: 2,
  pages: [
    { pageNumber: 1, widthPoints: 72, heightPoints: 144, rotation: 0 },
    { pageNumber: 2, widthPoints: 144, heightPoints: 72, rotation: 90 },
  ],
};

function rendererFake(): PdfDocumentRendererPort {
  return {
    inspect: vi.fn().mockResolvedValue(document),
    render: vi.fn().mockResolvedValue([
      { pageNumber: 2, width: 288, height: 144, bytes: new Uint8Array([1, 2]), mimeType: 'image/png', extension: 'png' },
    ]),
  };
}

describe('InspectPdfForImagesUseCase', () => {
  it('inspects a valid local PDF', async () => {
    const renderer = rendererFake();
    await expect(new InspectPdfForImagesUseCase(renderer).execute(new Uint8Array([1]))).resolves.toEqual(document);
    const inspectMock = vi.mocked(renderer.inspect);
    expect(inspectMock).toHaveBeenCalledOnce();
  });

  it('rejects an empty or oversized file before the adapter', async () => {
    const useCase = new InspectPdfForImagesUseCase(rendererFake());
    await expect(useCase.execute(new Uint8Array())).rejects.toMatchObject({ code: 'empty-file' });
    await expect(useCase.execute(new Uint8Array(PDF_TO_IMAGES_MAX_FILE_BYTES + 1)))
      .rejects.toMatchObject({ code: 'file-too-large' });
  });
});

describe('ConvertPdfToImagesUseCase', () => {
  it('validates, normalizes and names rendered images', async () => {
    const renderer = rendererFake();
    const result = await new ConvertPdfToImagesUseCase(renderer).execute({
      data: new Uint8Array([1]),
      sourceName: 'Rapport final.pdf',
      document,
      pageSelection: '2',
      dpi: 144,
      format: 'png',
      quality: 4,
      background: 'invalid',
    });

    expect(result.totalBytes).toBe(2);
    expect(result.images[0].fileName).toBe('Rapport-final-page-02.png');
    const renderMock = vi.mocked(renderer.render);
    expect(renderMock).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      undefined,
      expect.objectContaining({ pageNumbers: [2], quality: 1, background: '#ffffff' }),
      undefined,
    );
  });

  it.each([
    ['', 'invalid-page-selection'],
    ['3', 'page-out-of-range'],
  ])('rejects selection %s as %s', async (pageSelection, code) => {
    const useCase = new ConvertPdfToImagesUseCase(rendererFake());
    await expect(useCase.execute({
      data: new Uint8Array([1]), sourceName: 'a.pdf', document, pageSelection,
      dpi: 96, format: 'jpeg', quality: 0.8, background: '#ffffff',
    })).rejects.toEqual(expect.objectContaining({ code }));
  });

  it('exposes typed validation errors', () => {
    expect(new PdfToImagesValidationError('empty-file')).toBeInstanceOf(Error);
  });
});

describe('DownloadPdfImagesUseCase', () => {
  it('downloads one image directly', async () => {
    const archive: PdfImageArchivePort = { create: vi.fn() };
    const download: PdfImageDownloadPort = { download: vi.fn() };
    const image = { pageNumber: 1, width: 10, height: 10, bytes: new Uint8Array([1]), mimeType: 'image/png', extension: 'png', fileName: 'a.png' };
    await new DownloadPdfImagesUseCase(archive, download).execute('a.pdf', [image]);
    const createMock = vi.mocked(archive.create);
    const downloadMock = vi.mocked(download.download);
    expect(createMock).not.toHaveBeenCalled();
    expect(downloadMock).toHaveBeenCalledWith(image.bytes, 'image/png', 'a.png');
  });

  it('creates a ZIP for multiple images', async () => {
    const archive: PdfImageArchivePort = { create: vi.fn().mockResolvedValue(new Uint8Array([9])) };
    const download: PdfImageDownloadPort = { download: vi.fn() };
    const images = [1, 2].map(pageNumber => ({
      pageNumber, width: 10, height: 10, bytes: new Uint8Array([pageNumber]),
      mimeType: 'image/webp', extension: 'webp', fileName: `a-${String(pageNumber)}.webp`,
    }));
    await new DownloadPdfImagesUseCase(archive, download).execute('Mon fichier.pdf', images);
    const createMock = vi.mocked(archive.create);
    const downloadMock = vi.mocked(download.download);
    expect(createMock).toHaveBeenCalledOnce();
    expect(downloadMock).toHaveBeenCalledWith(expect.any(Uint8Array), 'application/zip', 'Mon-fichier-images.zip');
  });
});
