import { describe, expect, it, vi } from 'vitest';

import type {
  ImageHeaderReaderPort,
  ImagePdfDownloadPort,
  ImagePdfGeneratorPort,
  ImageSourceFile,
} from './images-to-pdf.ports';
import {
  CreateImagesPdfUseCase,
  DownloadImagesPdfUseCase,
  ImagesToPdfValidationError,
  PrepareImagesForPdfUseCase,
  ReorderPdfImagesUseCase,
} from './images-to-pdf.use-cases';
import { IMAGES_TO_PDF_MAX_FILE_BYTES } from '../domain/images-to-pdf.models';

function source(id: string, size = 3): ImageSourceFile {
  return { id, fileName: `${id}.png`, blob: new Blob(['x'.repeat(size)], { type: 'image/png' }) };
}

function readerFake(): ImageHeaderReaderPort {
  return {
    inspect: vi.fn().mockResolvedValue({
      format: 'png', mimeType: 'image/png', width: 640, height: 480,
    }),
  };
}

describe('PrepareImagesForPdfUseCase', () => {
  it('inspects files sequentially and preserves their order', async () => {
    const reader = readerFake();
    const progress = vi.fn();
    const result = await new PrepareImagesForPdfUseCase(reader).execute(
      [source('first'), source('second')],
      progress,
    );

    expect(result.map(image => image.id)).toEqual(['first', 'second']);
    expect(result[0]).toMatchObject({ width: 640, height: 480, size: 3 });
    expect(progress).toHaveBeenLastCalledWith(2, 2);
  });

  it('rejects oversized files before invoking the image parser', async () => {
    const reader = readerFake();
    const file = {
      id: 'large', fileName: 'large.png', blob: new Blob([new Uint8Array(IMAGES_TO_PDF_MAX_FILE_BYTES + 1)]),
    };

    await expect(new PrepareImagesForPdfUseCase(reader).execute([file]))
      .rejects.toMatchObject({ code: 'file-too-large', fileName: 'large.png' });
    expect(reader.inspect).not.toHaveBeenCalled();
  });

  it('rejects unsupported content identified by its bytes', async () => {
    const reader: ImageHeaderReaderPort = { inspect: vi.fn().mockResolvedValue(null) };
    await expect(new PrepareImagesForPdfUseCase(reader).execute([source('fake')]))
      .rejects.toMatchObject({ code: 'unsupported-image' });
  });
});

describe('CreateImagesPdfUseCase', () => {
  it('delegates a valid, bounded conversion to the generator', async () => {
    const output = new Blob(['pdf'], { type: 'application/pdf' });
    const generator: ImagePdfGeneratorPort = { create: vi.fn().mockResolvedValue(output) };
    const images = await new PrepareImagesForPdfUseCase(readerFake()).execute([source('one')]);

    await expect(new CreateImagesPdfUseCase(generator).execute(images, {
      pageFormat: 'a4-portrait', marginMm: 10, compression: 'balanced',
    })).resolves.toBe(output);
  });

  it('exposes typed validation errors', () => {
    expect(new ImagesToPdfValidationError('invalid-settings')).toBeInstanceOf(Error);
  });

  it('rejects unsafe prepared dimensions before invoking the generator', async () => {
    const generator: ImagePdfGeneratorPort = { create: vi.fn() };
    const images = await new PrepareImagesForPdfUseCase(readerFake()).execute([source('one')]);
    const unsafe = [{ ...images[0], width: 8_193 }];

    await expect(new CreateImagesPdfUseCase(generator).execute(unsafe, {
      pageFormat: 'a4-portrait', marginMm: 10, compression: 'balanced',
    })).rejects.toMatchObject({ code: 'image-too-large', fileName: 'one.png' });
    expect(generator.create).not.toHaveBeenCalled();
  });

  it('maps a worker preflight budget failure to the public output error', async () => {
    const budgetError = new Error('budget exceeded');
    budgetError.name = 'ImagesToPdfOutputBudgetError';
    const generator: ImagePdfGeneratorPort = { create: vi.fn().mockRejectedValue(budgetError) };
    const images = await new PrepareImagesForPdfUseCase(readerFake()).execute([source('one')]);

    await expect(new CreateImagesPdfUseCase(generator).execute(images, {
      pageFormat: 'image', marginMm: 0, compression: 'quality',
    })).rejects.toMatchObject({ code: 'output-too-large' });
  });
});

describe('image PDF ordering and download', () => {
  it('reorders pages and downloads with a safe name', async () => {
    const images = await new PrepareImagesForPdfUseCase(readerFake()).execute([
      source('first'), source('second'),
    ]);
    const reordered = new ReorderPdfImagesUseCase().execute(images, 'second', 'first');
    const download: ImagePdfDownloadPort = { download: vi.fn() };
    const pdf = new Blob(['pdf'], { type: 'application/pdf' });
    new DownloadImagesPdfUseCase(download).execute(reordered, pdf);

    expect(reordered.map(image => image.id)).toEqual(['second', 'first']);
    expect(download.download).toHaveBeenCalledWith(pdf, 'second-images.pdf');
  });
});
