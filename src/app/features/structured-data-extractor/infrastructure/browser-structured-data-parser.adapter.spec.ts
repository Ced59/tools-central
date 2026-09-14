import { describe, expect, it } from 'vitest';

import { BrowserStructuredDataParserAdapter } from './browser-structured-data-parser.adapter';

describe('BrowserStructuredDataParserAdapter', () => {
  const adapter = new BrowserStructuredDataParserAdapter();

  it('extrait les scripts JSON-LD sans exécuter leur contenu', () => {
    const result = adapter.extract('<script type="application/ld+json">{"@type":"Article"}</script>', '');

    expect(result.jsonLdBlocks).toEqual([expect.objectContaining({ content: '{"@type":"Article"}' })]);
  });

  it('extrait Microdata et résout les URL relatives avec la base fournie', () => {
    const result = adapter.extract(`
      <article itemscope itemtype="https://schema.org/Article" itemid="https://example.com/a">
        <h1 itemprop="headline">Titre</h1>
        <a itemprop="url" href="/article">Lire</a>
        <span itemprop="author" itemscope itemtype="https://schema.org/Person">
          <span itemprop="name">Alice</span>
        </span>
      </article>
    `, 'https://example.com/base');

    expect(result.markupNodes).toHaveLength(2);
    expect(result.markupNodes[0].properties).toContainEqual({ name: 'url', value: 'https://example.com/article', targetId: null });
    expect(result.markupNodes[0].properties).toContainEqual(expect.objectContaining({ name: 'author', targetId: 'microdata-2' }));
    expect(result.markupNodes[1].properties).toContainEqual({ name: 'name', value: 'Alice', targetId: null });
  });

  it('extrait les ressources RDFa et leurs relations', () => {
    const result = adapter.extract(`
      <div vocab="https://schema.org/" typeof="Organization" about="#org">
        <span property="name">Exemple</span>
        <a rel="url" href="https://example.com">Site</a>
        <div property="founder" typeof="Person" about="#alice"><span property="name">Alice</span></div>
      </div>
    `, '');

    const organization = result.markupNodes.find(node => node.id === '#org');
    expect(organization?.format).toBe('rdfa');
    expect(organization?.properties).toContainEqual({ name: 'founder', value: '#alice', targetId: '#alice' });
    expect(result.markupNodes.find(node => node.id === '#alice')?.properties).toContainEqual({ name: 'name', value: 'Alice', targetId: null });
  });

  it('accepte directement un document JSON-LD', () => {
    const result = adapter.extract('{"@context":"https://schema.org","@type":"WebPage"}', '');

    expect(result.jsonLdBlocks).toHaveLength(1);
    expect(result.markupNodes).toHaveLength(0);
  });

  it('transmet aussi un document JSON-LD direct mal formé au diagnostic JSON', () => {
    const result = adapter.extract('{"@type":', '');

    expect(result.jsonLdBlocks).toEqual([expect.objectContaining({ content: '{"@type":' })]);
  });

  it('annonce la limite de prise en charge de itemref', () => {
    const result = adapter.extract('<div itemscope itemref="outside"></div><span id="outside" itemprop="name">Nom</span>', '');

    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'parser-warning', severity: 'info' }));
  });
});
