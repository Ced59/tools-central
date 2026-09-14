import { describe, expect, it, vi } from 'vitest';

import {
  CopySoftwareApplicationSchemaUseCase,
  DownloadSoftwareApplicationSchemaUseCase,
  GenerateSoftwareApplicationSchemaUseCase,
  type SoftwareApplicationSchemaClipboardPort,
  type SoftwareApplicationSchemaDownloadPort,
  type SoftwareApplicationSchemaInput,
} from './software-application-schema.use-cases';

describe('software application schema use cases', () => {
  it('orchestre la génération sans dépendance navigateur', () => {
    const result = new GenerateSoftwareApplicationSchemaUseCase().execute(input());

    expect(result.state).toBe('schema-valid');
    expect(result.jsonLd).toContain('"@type": "WebApplication"');
  });

  it('ne copie pas une sortie vide', async () => {
    const copy = vi.fn().mockResolvedValue(true);
    const clipboard: SoftwareApplicationSchemaClipboardPort = { copy };
    const copied = await new CopySoftwareApplicationSchemaUseCase(clipboard).execute('');

    expect(copied).toBe(false);
    expect(copy).not.toHaveBeenCalled();
  });

  it('copie une sortie générée', async () => {
    const copy = vi.fn().mockResolvedValue(true);
    const clipboard: SoftwareApplicationSchemaClipboardPort = { copy };
    const copied = await new CopySoftwareApplicationSchemaUseCase(clipboard).execute('{"name":"App"}');

    expect(copied).toBe(true);
    expect(copy).toHaveBeenCalledWith('{"name":"App"}');
  });

  it('télécharge chaque format avec un nom et un type explicites', () => {
    const download = vi.fn();
    const downloadPort: SoftwareApplicationSchemaDownloadPort = { download };
    const useCase = new DownloadSoftwareApplicationSchemaUseCase(downloadPort);

    useCase.execute('jsonLd', '{}');
    useCase.execute('scriptTag', '<script></script>');

    expect(download).toHaveBeenNthCalledWith(
      1,
      '{}',
      'software-application.jsonld.json',
      'application/ld+json;charset=utf-8',
    );
    expect(download).toHaveBeenNthCalledWith(
      2,
      '<script></script>',
      'software-application-json-ld.html',
      'text/html;charset=utf-8',
    );
  });
});

function input(): SoftwareApplicationSchemaInput {
  return {
    type: 'WebApplication',
    name: 'Application exemple',
    description: '',
    url: '',
    screenshotUrl: '',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    softwareVersion: '',
    price: '0',
    priceCurrency: '',
    includeAggregateRating: false,
    ratingValue: '',
    ratingCount: '',
    bestRating: '5',
    worstRating: '1',
  };
}
