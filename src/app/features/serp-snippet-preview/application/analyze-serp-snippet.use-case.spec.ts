import { describe, expect, it } from 'vitest';

import { AnalyzeSerpSnippetUseCase } from './analyze-serp-snippet.use-case';

describe('AnalyzeSerpSnippetUseCase', () => {
  it('delegates the analysis without adding presentation concerns', () => {
    const result = new AnalyzeSerpSnippetUseCase().execute({
      siteName: 'Tools Central',
      url: 'tools-central.com/seo',
      title: 'Un titre utile pour un résultat de recherche',
      description: 'Une description claire qui explique la promesse de la page avant le clic.',
      device: 'desktop',
    });

    expect(result.urlValid).toBe(true);
    expect(result.title.characters).toBeGreaterThan(0);
  });
});
