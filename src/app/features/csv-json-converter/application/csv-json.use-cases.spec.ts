import { describe, expect, it, vi } from 'vitest';

import {
  ConvertCsvJsonUseCase,
  CopyCsvJsonOutputUseCase,
  CsvJsonValidationError,
  DownloadCsvJsonOutputUseCase,
  ReadCsvJsonSourceFileUseCase,
} from './csv-json.use-cases';
import type {
  CsvJsonConverterPort,
  CsvJsonClipboardPort,
  CsvJsonDownloadPort,
  CsvJsonTextFileReaderPort,
} from './csv-json.ports';
import { convertCsvJson, type CsvJsonConversionOptions } from '../domain/csv-json.models';

const OPTIONS: CsvJsonConversionOptions = {
  direction: 'csv-to-json',
  delimiter: 'auto',
  firstRowHeaders: true,
  trimCells: false,
  inferTypes: true,
  mapping: '',
  protectSpreadsheetFormulas: true,
  includeBom: false,
};

describe('CSV/JSON use cases', () => {
  it('délègue la conversion au port isolé', async () => {
    const expected = convertCsvJson('name\nAda', OPTIONS);
    const converter: CsvJsonConverterPort = { convert: vi.fn().mockResolvedValue(expected) };

    const actual = await new ConvertCsvJsonUseCase(converter).execute('name\nAda', OPTIONS);

    expect(actual).toBe(expected);
    expect(converter.convert).toHaveBeenCalledWith('name\nAda', OPTIONS, undefined);
  });

  it('valide le nom, la taille et le contenu avant de lire un fichier', async () => {
    const reader: CsvJsonTextFileReaderPort = { read: vi.fn().mockResolvedValue('a,b\n1,2') };
    const useCase = new ReadCsvJsonSourceFileUseCase(reader);

    await expect(useCase.execute({ fileName: 'data.csv', size: 7, blob: new Blob(['x']) }))
      .resolves.toBe('a,b\n1,2');
    await expect(useCase.execute({ fileName: 'data.exe', size: 7, blob: new Blob(['x']) }))
      .rejects.toMatchObject({ code: 'unsupported-file' });
    await expect(useCase.execute({ fileName: 'empty.json', size: 0, blob: new Blob() }))
      .rejects.toMatchObject({ code: 'empty-file' });
  });

  it('propage une annulation sans lire le fichier', async () => {
    const reader: CsvJsonTextFileReaderPort = { read: vi.fn() };
    const controller = new AbortController();
    controller.abort();

    await expect(new ReadCsvJsonSourceFileUseCase(reader).execute(
      { fileName: 'data.csv', size: 10, blob: new Blob(['a,b']) },
      controller.signal,
    )).rejects.toMatchObject({ name: 'AbortError' });
    expect(reader.read).not.toHaveBeenCalled();
  });

  it('nomme le téléchargement selon le format réellement produit', () => {
    const download: CsvJsonDownloadPort = { download: vi.fn() };
    const result = convertCsvJson('name\nAda', OPTIONS);

    new DownloadCsvJsonOutputUseCase(download).execute(result);

    expect(download.download).toHaveBeenCalledWith(
      result.output,
      'conversion-csv-json.json',
      'application/json;charset=utf-8',
    );
  });

  it('autorise la copie et le téléchargement d’un CSV vide valide', async () => {
    const copy = vi.fn().mockResolvedValue(true);
    const triggerDownload = vi.fn();
    const clipboard: CsvJsonClipboardPort = { copy };
    const download: CsvJsonDownloadPort = { download: triggerDownload };
    const result = convertCsvJson('[]', { ...OPTIONS, direction: 'json-to-csv' });

    await expect(new CopyCsvJsonOutputUseCase(clipboard).execute(result)).resolves.toBe(true);
    new DownloadCsvJsonOutputUseCase(download).execute(result);

    expect(copy).toHaveBeenCalledWith('');
    expect(triggerDownload).toHaveBeenCalledWith(
      '',
      'conversion-csv-json.csv',
      'text/csv;charset=utf-8',
    );
  });

  it('expose des erreurs de validation stables', () => {
    expect(new CsvJsonValidationError('file-too-large').code).toBe('file-too-large');
  });
});
