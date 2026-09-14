import { describe, expect, it } from 'vitest';

import { LocalHtmlHeadParserAdapter } from './local-html-head-parser.adapter';

describe('LocalHtmlHeadParserAdapter', () => {
  const parser = new LocalHtmlHeadParserAdapter();

  it('extrait les métadonnées utiles d’un document complet sans API navigateur', () => {
    const result = parser.extract(`<!doctype html><html><head>
      <meta charset="UTF-8">
      <title>Guide &amp; outils</title>
      <meta name="description" content="Description &quot;utile&quot;">
      <link rel="canonical alternate" hreflang="fr" href="https://example.com/fr">
      <meta property="og:title" content="Guide">
      <script type="application/ld+json">{"@type":"WebPage"}</script>
    </head><body><h1>Contenu</h1></body></html>`);

    expect(result.titles).toEqual([{ value: 'Guide & outils', position: 2 }]);
    expect(result.metas).toContainEqual(expect.objectContaining({ name: 'description', content: 'Description "utile"' }));
    expect(result.links[0]).toEqual(expect.objectContaining({ rel: ['canonical', 'alternate'], hreflang: 'fr' }));
    expect(result.charsets[0].value).toBe('UTF-8');
    expect(result.jsonLdCount).toBe(1);
  });

  it('tolère les attributs sans guillemets et les chevrons dans une valeur', () => {
    const result = parser.extract('<head><meta NAME=viewport content="width=device-width, note=>"><base href=https://example.com/></head>');

    expect(result.metas[0]).toEqual(expect.objectContaining({ name: 'viewport', content: 'width=device-width, note=>' }));
    expect(result.baseHrefs[0].value).toBe('https://example.com/');
  });

  it('extrait le charset déclaré dans content-type', () => {
    const result = parser.extract('<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">');

    expect(result.charsets).toEqual([{ value: 'iso-8859-1', position: 1 }]);
  });

  it('signale les constructions non terminées sans lever d’exception', () => {
    const title = parser.extract('<title>Titre');
    const comment = parser.extract('<!-- commentaire');
    const script = parser.extract('<script>const exemple = "<meta name=description content=faux>";');

    expect(title.titles[0].value).toBe('Titre');
    expect(title.parserIssues[0]).toEqual(expect.objectContaining({ code: 'parser-unclosed-title' }));
    expect(comment.parserIssues[0]).toEqual(expect.objectContaining({ code: 'parser-unclosed-comment' }));
    expect(script.metas).toHaveLength(0);
    expect(script.parserIssues[0]).toEqual(expect.objectContaining({ code: 'parser-unclosed-script' }));
  });

  it('borne le nombre de balises parcourues', () => {
    const result = parser.extract('<meta name="robots" content="index">'.repeat(1_002));

    expect(result.tagLimitReached).toBe(true);
    expect(result.scannedTagCount).toBe(1_000);
    expect(result.metas).toHaveLength(1_000);
  });

  it('borne aussi les balises mal formées et leurs diagnostics', () => {
    const result = parser.extract('<1>'.repeat(1_002));

    expect(result.tagLimitReached).toBe(true);
    expect(result.scannedTagCount).toBe(1_000);
    expect(result.parserIssues).toHaveLength(200);
  });

  it('ignore les balises title situées dans le body d’un document complet', () => {
    const result = parser.extract('<html><head><title>Page</title></head><body><svg><title>Icône</title></svg></body></html>');

    expect(result.titles).toEqual([{ value: 'Page', position: 1 }]);
  });

  it('respecte la fermeture implicite du head avant le body', () => {
    const result = parser.extract('<html><head><title>Page</title><body><svg><title>Icône</title></svg></body></html>');

    expect(result.titles).toEqual([{ value: 'Page', position: 1 }]);
    expect(result.parserIssues).not.toContainEqual(expect.objectContaining({ code: 'parser-unclosed-head' }));
  });

  it('ne confond pas une chaîne brute de script avec la fermeture du head', () => {
    const result = parser.extract(`<html><head>
      <script type="application/ld+json">{"description":"texte </head> littéral"}</script>
      <title>Page réelle</title>
      <link rel="canonical" href="https://example.com/page">
    </head><body></body></html>`);

    expect(result.titles[0]?.value).toBe('Page réelle');
    expect(result.links[0]?.href).toBe('https://example.com/page');
    expect(result.parserIssues).not.toContainEqual(expect.objectContaining({ code: 'parser-unclosed-head' }));
  });

  it('ignore les fragments ressemblant à du HTML dans une feuille de style', () => {
    const result = parser.extract('<head><style>.x::after { content: "<title>faux</title>" }</style><title>Réel</title></head>');

    expect(result.titles).toEqual([{ value: 'Réel', position: 2 }]);
  });

  it('ignore le contenu brut noframes pendant l’extraction principale', () => {
    const result = parser.extract('<head><noframes><title>Secours</title></noframes><title>Réel</title></head>');

    expect(result.titles).toEqual([{ value: 'Réel', position: 2 }]);
  });

  it('délimite le head implicite des documents complets sans balise head', () => {
    const result = parser.extract(
      '<!doctype html><html lang="fr"><title>Page</title><meta name="description" content="Active"><body><svg><title>Icône</title></svg></body></html>',
    );

    expect(result.titles).toEqual([{ value: 'Page', position: 1 }]);
    expect(result.metas).toEqual([expect.objectContaining({ content: 'Active' })]);
  });

  it('arrête la recherche du head avant les templates inertes du body', () => {
    const result = parser.extract(
      '<!doctype html><html><body><template><head><title>Inerte</title></head></template></body></html>',
    );

    expect(result.titles).toHaveLength(0);
  });

  it('ignore les métadonnées contenues dans noscript avec scripting actif', () => {
    const result = parser.extract(
      '<head><noscript><meta name="description" content="Inerte"><link rel="canonical" href="https://example.com/inerte"></noscript><title>Réel</title></head>',
    );

    expect(result.titles).toEqual([{ value: 'Réel', position: 2 }]);
    expect(result.metas).toHaveLength(0);
    expect(result.links).toHaveLength(0);
  });

  it('ignore les métadonnées inertes des templates, y compris imbriqués', () => {
    const result = parser.extract(`<head>
      <template>
        <title>Faux</title>
        <template><meta name="description" content="Fausse"></template>
        <link rel="canonical" href="https://example.com/fausse">
      </template>
      <title>Réel</title>
      <meta name="description" content="Active">
      <link rel="canonical" href="https://example.com/reelle">
    </head>`);

    expect(result.titles).toEqual([{ value: 'Réel', position: 2 }]);
    expect(result.metas).toEqual([expect.objectContaining({ content: 'Active' })]);
    expect(result.links).toEqual([expect.objectContaining({ href: 'https://example.com/reelle' })]);
  });

  it('ignore les fermetures de template littérales dans tous les éléments raw-text', () => {
    const result = parser.extract(`<head><template>
      <iframe>contenu </template> littéral</iframe>
      <xmp>contenu </template> littéral</xmp>
      <noembed>contenu </template> littéral</noembed>
      <noframes>contenu </template> littéral</noframes>
      <title>Faux</title>
    </template><title>Réel</title></head>`);

    expect(result.titles).toEqual([{ value: 'Réel', position: 2 }]);
  });

  it('décode les références de caractères HTML standard dans le texte et les attributs', () => {
    const result = parser.extract('<head><title>Caf&eacute;</title><meta name="description" content="Cr&egrave;me br&ucirc;l&eacute;e"></head>');

    expect(result.titles[0]?.value).toBe('Café');
    expect(result.metas[0]?.content).toBe('Crème brûlée');
  });

  it('signale un élément head non terminé', () => {
    const result = parser.extract('<html><head><title>Page</title>');

    expect(result.parserIssues).toContainEqual(expect.objectContaining({ code: 'parser-unclosed-head' }));
  });
});
