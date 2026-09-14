import { describe, expect, it } from 'vitest';

import {
  analyzeStructuredData,
  serializeStructuredDataAnalysis,
  STRUCTURED_DATA_MAX_NODES,
  type StructuredMarkupExtraction,
} from './structured-data';

function extraction(overrides: Partial<StructuredMarkupExtraction> = {}): StructuredMarkupExtraction {
  return {
    sourceLength: 100,
    truncated: false,
    jsonLdBlocks: [],
    markupNodes: [],
    issues: [],
    ...overrides,
  };
}

describe('analyzeStructuredData', () => {
  it('normalise un graphe JSON-LD et ses relations imbriquées', () => {
    const analysis = analyzeStructuredData(extraction({
      jsonLdBlocks: [{
        sourceIndex: 1,
        content: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          '@id': 'https://example.com/article',
          headline: 'Un guide',
          author: { '@type': 'Person', '@id': 'https://example.com/alice', name: 'Alice' },
          image: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
        }),
      }],
    }));

    expect(analysis.nodes).toHaveLength(2);
    expect(analysis.formatCounts.jsonLd).toBe(2);
    expect(analysis.edgeCount).toBe(1);
    expect(analysis.typeCounts).toEqual([
      { type: 'Article', count: 1 },
      { type: 'Person', count: 1 },
    ]);
    expect(analysis.nodes[0].properties).toContainEqual({
      name: 'author',
      value: 'https://example.com/alice',
      targetId: 'https://example.com/alice',
    });
  });

  it('développe @graph sans créer un faux nœud conteneur', () => {
    const analysis = analyzeStructuredData(extraction({
      jsonLdBlocks: [{
        sourceIndex: 2,
        content: '{"@context":"https://schema.org","@graph":[{"@id":"#site","@type":"WebSite"},{"@id":"#org","@type":"Organization"}]}',
      }],
    }));

    expect(analysis.nodes.map(node => node.id)).toEqual(['#site', '#org']);
    expect(analysis.issues).toHaveLength(0);
  });

  it('fusionne les descriptions JSON-LD répétées du même identifiant', () => {
    const analysis = analyzeStructuredData(extraction({
      jsonLdBlocks: [{
        sourceIndex: 1,
        content: '[{"@context":"https://schema.org","@id":"#thing","@type":"Thing","name":"A"},{"@context":"https://schema.org","@id":"#thing","url":"https://example.com"}]',
      }],
    }));

    expect(analysis.nodes).toHaveLength(1);
    expect(analysis.nodes[0].properties.map(property => property.name)).toEqual(['name', 'url']);
  });

  it('signale un JSON invalide sans lever d’exception', () => {
    const analysis = analyzeStructuredData(extraction({
      jsonLdBlocks: [{ sourceIndex: 3, content: '{"@type":' }],
    }));

    expect(analysis.nodes).toHaveLength(0);
    expect(analysis.issues[0]).toMatchObject({ code: 'invalid-json', severity: 'error', sourceIndex: 3 });
  });

  it('signale le contexte absent et un nœud sans type', () => {
    const analysis = analyzeStructuredData(extraction({
      jsonLdBlocks: [{ sourceIndex: 1, content: '{"name":"Sans type"}' }],
    }));

    expect(analysis.issues.map(item => item.code)).toEqual(['missing-jsonld-context', 'missing-type']);
  });

  it('conserve les nœuds Microdata et RDFa déjà extraits', () => {
    const analysis = analyzeStructuredData(extraction({
      markupNodes: [
        { id: 'microdata-1', format: 'microdata', types: ['https://schema.org/Product'], sourceIndex: 1, properties: [{ name: 'name', value: 'Produit', targetId: null }] },
        { id: 'rdfa-2', format: 'rdfa', types: ['schema:Organization'], sourceIndex: 2, properties: [{ name: 'schema:name', value: 'Société', targetId: null }] },
      ],
    }));

    expect(analysis.formatCounts).toEqual({ jsonLd: 0, microdata: 1, rdfa: 1 });
    expect(analysis.propertyCount).toBe(2);
  });

  it('distingue une source vide d’une page sans balisage structuré', () => {
    const empty = analyzeStructuredData(extraction({ sourceLength: 0 }));
    const plainHtml = analyzeStructuredData(extraction({ sourceLength: 20 }));

    expect(empty.issues).toContainEqual(expect.objectContaining({ code: 'empty-source', severity: 'error' }));
    expect(plainHtml.issues).toContainEqual(expect.objectContaining({ code: 'no-structured-data', severity: 'warning' }));
  });

  it('bloque un contenu tronqué et borne le nombre de nœuds', () => {
    const markupNodes = Array.from({ length: STRUCTURED_DATA_MAX_NODES + 2 }, (_, index) => ({
      id: `node-${String(index)}`,
      format: 'microdata' as const,
      types: ['Thing'],
      properties: [],
      sourceIndex: index + 1,
    }));
    const analysis = analyzeStructuredData(extraction({ truncated: true, markupNodes }));

    expect(analysis.nodes).toHaveLength(STRUCTURED_DATA_MAX_NODES);
    expect(analysis.issues.map(item => item.code)).toContain('source-too-large');
    expect(analysis.issues.map(item => item.code)).toContain('node-limit');
  });

  it('produit un export JSON déterministe avec résumé', () => {
    const analysis = analyzeStructuredData(extraction({
      jsonLdBlocks: [{ sourceIndex: 1, content: '{"@context":"https://schema.org","@type":"WebPage","name":"Accueil"}' }],
    }));
    const exported = JSON.parse(serializeStructuredDataAnalysis(analysis)) as { summary: { nodes: number }; nodes: unknown[] };

    expect(exported.summary.nodes).toBe(1);
    expect(exported.nodes).toHaveLength(1);
  });
});
