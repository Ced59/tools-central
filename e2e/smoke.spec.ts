import { expect, test } from '@playwright/test';
import JSZip from 'jszip';
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFString, rgb } from 'pdf-lib';
import { readFile } from 'node:fs/promises';

test('home, locale and theme remain usable', async ({ page }) => {
  await page.goto('/fr/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Vos outils en ligne');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveClass(/dark-mode/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

  await page.locator('.locale-select').selectOption('en');
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('percentage calculator recomputes a real result', async ({ page }) => {
  await page.goto('/fr/categories/math/percentages/percentage-of-number');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pourcentage d’un nombre');
  await page.locator('#percent').fill('12.5');
  await page.locator('#base').fill('240');

  await expect(page.locator('.result-item.highlight .result-value')).toHaveText('30.00');
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(page.locator('.result-item.highlight .result-value')).toHaveText('16.00');
});

test('unknown routes return the localized 404 page', async ({ page }) => {
  const response = await page.goto('/fr/route-inconnue');

  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(/\/fr\/route-inconnue$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cette page est introuvable');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
});

test('SERP snippet preview adapts its pixel budget to mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/seo/serp-snippet-preview');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Prévisualiseur de snippet Google');
  await expect(page.getByText('580 px', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Mobile' }).click();

  await expect(page.getByText('520 px', { exact: false })).toBeVisible();
  await expect(page.getByTestId('serp-preview')).toHaveClass(/browser-frame--mobile/);
  await expect.poll(async () => {
    const grid = await page.locator('.workspace-grid').boundingBox();
    const editor = await page.locator('.editor').boundingBox();
    return grid && editor ? editor.width <= grid.width + 1 : false;
  }).toBe(true);
  await expect.poll(async () => {
    const card = await page.locator('.workspace-card').boundingBox();
    const preview = await page.getByTestId('serp-preview').boundingBox();
    return card && preview
      ? preview.x >= card.x && preview.x + preview.width <= card.x + card.width + 1
      : false;
  }).toBe(true);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('robots.txt builder validates and simulates a blocking rule locally', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/seo/robots-txt-builder');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Générateur et validateur robots.txt');
  await expect(page.getByText('Aucun problème détecté')).toBeVisible();

  await page.locator('#robots-content').fill('User-agent: *\nDisallow: /');
  await expect(page.getByTestId('robots-decision')).toContainText('Exploration bloquée');

  await page.locator('#robots-test-url').fill('/robots.txt');
  await expect(page.getByTestId('robots-decision')).toContainText('Exploration autorisée');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('sitemap XML builder generates, validates and remains responsive', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/seo/sitemap-xml-builder');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Générateur et validateur sitemap XML');
  await expect(page.getByText('Aucun problème détecté')).toBeVisible();

  await page.locator('#sitemap-source-lines').fill('/produits/café?tri=nom&ordre=asc | 2026-09-01');
  await page.getByRole('button', { name: 'Générer et remplacer l’éditeur' }).click();

  await expect(page.locator('#sitemap-content')).toHaveValue(/caf%C3%A9\?tri=nom&amp;ordre=asc/);
  await expect(page.getByTestId('sitemap-analysis')).toContainText('1');

  const largeEntries = Array.from(
    { length: 2_000 },
    (_, index) => `<url><loc>https://www.tools-central.com/page-${index}</loc></url>`,
  ).join('');
  await page.locator('#sitemap-content').fill(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${largeEntries}</urlset>`);
  await expect(page.locator('.report-card')).toHaveAttribute('aria-busy', 'false', { timeout: 10_000 });
  await expect(page.getByTestId('sitemap-analysis').locator('strong').nth(1)).toHaveText(/2.?000/);

  await page.locator('#sitemap-content').fill('<urlset>');
  await expect(page.getByText('Le document XML est mal formé', { exact: false })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('hreflang checker generates formats, finds a missing return and remains responsive', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/seo/hreflang-checker');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Générateur et vérificateur hreflang');
  await expect(page.getByTestId('hreflang-set-analysis')).toContainText(/4\s*variantes valides/u);

  await page.locator('#hreflang-current-url').fill('https://example.com/fr/page?a=1&b=2');
  await page.locator('#hreflang-alternates').fill([
    'fr | https://example.com/fr/page?a=1&b=2',
    'en | https://example.com/en/page',
    'x-default | https://example.com/',
  ].join('\n'));
  await expect(page.locator('#hreflang-output')).toHaveValue(/a=1&amp;b=2/u);

  await page.getByRole('button', { name: 'En-tête HTTP' }).click();
  await expect(page.locator('#hreflang-output')).toHaveValue(/^Link:/u);

  await page.locator('#hreflang-audit-source').fill([
    'PAGE https://example.com/fr | https://example.com/fr',
    'fr | https://example.com/fr',
    'en | https://example.com/en',
    'x-default | https://example.com/',
    'PAGE https://example.com/en | https://example.com/en',
    'en | https://example.com/en',
  ].join('\n'));
  await page.getByRole('button', { name: 'Analyser les blocs fournis' }).click();
  await expect(page.getByTestId('hreflang-audit-report')).toContainText('La page cible fournie ne contient aucun lien retour');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('structured data extractor inventories a mixed graph and remains responsive', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/seo/structured-data-extractor');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Extracteur de données structurées');
  await expect(page.getByTestId('structured-data-summary')).toContainText(/2\s*entités extraites/u);

  await page.locator('#structured-data-base-url').fill('https://example.com/catalogue/');
  await page.locator('#structured-data-source').fill(`
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"WebSite","@id":"#site","name":"Exemple"}
    </script>
    <article itemscope itemtype="https://schema.org/Article" itemid="#article">
      <h2 itemprop="headline">Guide</h2>
      <a itemprop="url" href="guide">Lire</a>
    </article>
    <div vocab="https://schema.org/" typeof="Organization" about="#org">
      <span property="name">Studio</span>
    </div>
  `);
  await page.getByRole('button', { name: 'Extraire et analyser' }).click();

  await expect(page.getByTestId('structured-data-summary')).toContainText(/3\s*entités extraites/u);
  await expect(page.getByTestId('structured-data-summary')).toContainText(/1\s*JSON-LD/u);
  await expect(page.getByTestId('structured-data-summary')).toContainText(/1\s*Microdata/u);
  await expect(page.getByTestId('structured-data-summary')).toContainText(/1\s*RDFa/u);
  await expect(page.getByTestId('structured-data-graph')).toContainText('https://example.com/catalogue/guide');

  await page.locator('#structured-data-source').fill('<script type="application/ld+json">{"@type":</script>');
  await page.getByRole('button', { name: 'Extraire et analyser' }).click();
  await expect(page.getByText('Ce bloc JSON-LD n’est pas un JSON valide.')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('HTML head auditor reports contradictory metadata and remains responsive', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/seo/html-head-auditor');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Auditeur de head HTML');
  await expect(page.getByTestId('html-head-summary')).toContainText(/0\s*points à vérifier/u);

  await page.locator('#html-head-page-url').fill('https://example.com/page');
  await page.locator('#html-head-source').fill([
    '<head>',
    '<title>Premier titre</title><title>Second titre</title>',
    '<meta name="robots" content="index, noindex">',
    '<link rel="canonical" href="/relative">',
    '<meta property="og:title" content="Titre social">',
    '</head>',
  ].join(''));
  await page.getByRole('button', { name: 'Auditer le head' }).click();

  await expect(page.getByTestId('html-head-diagnostics')).toContainText('Plusieurs balises title sont présentes.');
  await expect(page.getByTestId('html-head-diagnostics')).toContainText('L’URL canonical doit être une URL HTTP ou HTTPS absolue.');
  await expect(page.getByTestId('html-head-diagnostics')).toContainText('Une directive demande de ne pas indexer cette page.');
  await expect(page.getByTestId('html-head-diagnostics')).toContainText('Une propriété Open Graph de base est absente.');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto('/en/categories/dev/seo/html-head-auditor');
  await expect(page.locator('#html-head-source')).toHaveValue(/Practical Guide to Auditing an HTML Head/u);
  await expect(page.locator('#html-head-source')).toHaveValue(/<html lang="en">/u);

  await page.goto('/fil/categories/dev/seo/html-head-auditor');
  await expect(page.locator('#html-head-source')).toHaveValue(/hreflang="tl" href="https:\/\/example\.com\/fil\/guide"/u);
  await expect(page.locator('.issue')).toHaveCount(0);
});

test('SoftwareApplication schema builder validates real ratings and remains responsive', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/seo/software-application-schema-builder');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Générateur Schema.org SoftwareApplication');
  await expect(page.getByTestId('software-schema-summary')).toContainText('Schema.org valide, résultat enrichi Google incomplet');
  await expect(page.getByTestId('software-schema-output')).toContainText('"@type": "WebApplication"');
  await expect(page.getByTestId('software-schema-output')).not.toContainText('aggregateRating');

  await page.getByLabel('Inclure une AggregateRating réelle').check();
  await expect(page.getByTestId('software-schema-summary')).toContainText('Propriétés requises par Google présentes');
  await expect(page.getByTestId('software-schema-output')).toContainText('"ratingCount": 128');

  await page.locator('#software-schema-price').fill('12.50');
  await page.locator('#software-schema-currency').fill('');
  await expect(page.getByTestId('software-schema-diagnostics')).toContainText('ajoutez une devise ISO 4217');

  await page.getByRole('button', { name: 'JSON-LD seul' }).click();
  await expect(page.getByTestId('software-schema-output')).not.toContainText('<script');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto('/en/categories/dev/seo');
  await expect(page.getByText('Schema.org SoftwareApplication Generator', { exact: true })).toHaveCount(0);

  await page.goto('/en/categories/dev/seo/software-application-schema-builder');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tool unavailable');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('#software-schema-name')).toHaveCount(0);
});

test('PDF to images renders locally, previews output and remains responsive', async ({ page }) => {
  const source = await PDFDocument.create();
  const first = source.addPage([720, 360]);
  first.drawRectangle({ x: 0, y: 0, width: 720, height: 360, color: rgb(1, 1, 1) });
  first.drawText('Tools Central', { x: 90, y: 150, size: 60, color: rgb(0.1, 0.25, 0.7) });
  source.addPage([72, 144]);
  const bytes = await source.save();

  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/pdf/pdf-to-images');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Convertir un PDF en images');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'test-local.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(bytes),
  });
  await expect(page.getByText('PDF chargé')).toBeVisible({ timeout: 10_000 });
  await page.locator('#pdf-to-images-pages').fill('1-2');
  await page.locator('#pdf-to-images-dpi').selectOption('300');
  await expect(page.getByTestId('pdf-to-images-estimate')).toContainText(/3\s*000 × 1\s*500 px/u);
  const renderWorkerResponse = page.waitForResponse(response => /\/worker-[\w-]+\.js$/u.test(response.url()));
  await page.getByRole('button', { name: 'Convertir les pages' }).click();
  await expect((await renderWorkerResponse).ok()).toBe(true);
  await expect(page.getByTestId('pdf-to-images-results').locator('img')).toHaveCount(2, { timeout: 20_000 });
  await expect(page.getByTestId('pdf-to-images-results')).toContainText('test-local-page-01.png');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger tout' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('test-local-images.zip');
  await expect(page.getByRole('button', { name: 'Télécharger tout' })).toBeEnabled();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto('/en/categories/dev/pdf/pdf-to-images');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tool unavailable');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
});

test('images to PDF preserves order, creates a real document and remains responsive', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/pdf/images-to-pdf');
  const png = Buffer.from(await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 20;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable in the test browser.');
    context.fillStyle = '#2563eb';
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png').split(',')[1];
  }), 'base64');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Convertir des images en PDF');
  await page.locator('input[type="file"]').setInputFiles([
    { name: 'premiere.png', mimeType: 'image/png', buffer: png },
    { name: 'seconde.png', mimeType: 'image/png', buffer: png },
  ]);
  const list = page.getByTestId('images-to-pdf-list');
  await expect(list.locator('.image-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Monter seconde.png' }).click();
  await expect(list.locator('.image-card strong').first()).toContainText('seconde.png');
  await page.locator('#images-to-pdf-page-format').selectOption('image');
  await page.locator('#images-to-pdf-margin').selectOption('0');
  await page.locator('#images-to-pdf-compression').selectOption('quality');
  const workerResponse = page.waitForResponse(response => /\/worker-[\w-]+\.js$/u.test(response.url()));
  await page.getByRole('button', { name: 'Créer le PDF' }).click();
  await expect((await workerResponse).ok()).toBe(true);
  await expect(page.getByTestId('images-to-pdf-result')).toContainText('2 page(s)', { timeout: 20_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le PDF' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('seconde-images.pdf');
  const path = await download.path();
  expect(path).not.toBeNull();
  const pdf = await PDFDocument.load(await readFile(path as string));
  expect(pdf.getPageCount()).toBe(2);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto('/en/categories/dev/pdf/images-to-pdf');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tool unavailable');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
});

test('OOXML metadata cleaner rebuilds a private DOCX locally and remains responsive', async ({ page }) => {
  const source = new JSZip();
  source.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/docProps/thumbnail.jpeg" ContentType="image/jpeg"/></Types>');
  source.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rCore" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
    + '<Relationship Id="rApp" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
    + '<Relationship Id="rCustom" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="docProps/custom.xml"/>'
    + '<Relationship Id="rThumb" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="docProps/thumbnail.jpeg"/>'
    + '</Relationships>');
  source.file('word/document.xml', '<document><content>Contenu à conserver</content></document>');
  source.file('docProps/core.xml', '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>Alice</dc:creator><cp:lastModifiedBy>Bob</cp:lastModifiedBy></cp:coreProperties>');
  source.file('docProps/app.xml', '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Word</Application><Company>Exemple SA</Company></Properties>');
  source.file('docProps/custom.xml', '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties"><property name="Client"><value>Société secrète</value></property></Properties>');
  source.file('docProps/thumbnail.jpeg', new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
  const buffer = Buffer.from(await source.generateAsync({ type: 'uint8array' }));

  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/ooxml/ooxml-sanitize-metadata');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Supprimer les métadonnées d’un document Office');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'rapport.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer,
  });
  const workerResponse = page.waitForResponse(response => /\/worker-[\w-]+\.js$/u.test(response.url()));
  await page.getByRole('button', { name: 'Analyser et nettoyer' }).click();
  await expect((await workerResponse).ok()).toBe(true);
  const result = page.getByTestId('ooxml-metadata-result');
  await expect(result).toContainText('Document nettoyé et rapport prêt', { timeout: 20_000 });
  await expect(result).toContainText('6');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le document nettoyé' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('rapport-sans-metadonnees.docx');
  const path = await download.path();
  expect(path).not.toBeNull();
  const cleaned = await JSZip.loadAsync(await readFile(path as string));
  await expect(cleaned.file('word/document.xml')?.async('string')).resolves.toContain('Contenu à conserver');
  await expect(cleaned.file('docProps/core.xml')?.async('string')).resolves.not.toContain('Alice');
  await expect(cleaned.file('docProps/app.xml')?.async('string')).resolves.not.toContain('Exemple SA');
  expect(cleaned.file('docProps/thumbnail.jpeg')).toBeNull();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto('/en/categories/dev/ooxml/ooxml-sanitize-metadata');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tool unavailable');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
});

test('PDF privacy inspector inventories hidden signals locally and remains responsive', async ({ page }) => {
  const source = await PDFDocument.create();
  source.setTitle('Rapport confidentiel');
  source.setAuthor('Alice');
  const infoDictionary = source.context.lookupMaybe(source.context.trailerInfo.Info, PDFDict);
  if (!infoDictionary) throw new Error('PDF Info dictionary unavailable');
  infoDictionary.set(PDFName.of('ClientEmail'), PDFString.of('client@example.test'));
  source.addJavaScript('OpenAction', 'app.alert("secret-script");');
  source.catalog.set(PDFName.of('OpenAction'), source.context.obj({
    Type: 'Action',
    S: 'URI',
    URI: PDFString.of('https://open.example/start'),
  }));
  await source.attach(new TextEncoder().encode('pièce jointe confidentielle'), 'secret.txt', {
    mimeType: 'text/plain',
    description: 'Annexe interne',
  });
  const associatedStream = source.context.register(source.context.flateStream(
    'associated-only payload',
    { Type: 'EmbeddedFile', Subtype: PDFName.of('text#2Fplain') },
  ));
  const associatedFile = source.context.register(source.context.obj({
    Type: 'Filespec',
    F: PDFString.of('associated-only.txt'),
    UF: PDFString.of('associated-only.txt'),
    Desc: PDFString.of('Associated file'),
    EF: { F: associatedStream },
  }));
  source.catalog.set(PDFName.of('AF'), source.context.obj([associatedFile]));
  const pdfPage = source.addPage([600, 800]);
  pdfPage.node.set(PDFName.of('AA'), source.context.obj({
    O: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of('https://page-open.example/ping'),
    },
  }));
  pdfPage.drawText('Rapport à contrôler', { x: 72, y: 720, size: 24 });
  const form = source.getForm();
  const field = form.createTextField('contact-email');
  field.setText('alice@example.test');
  field.addToPage(pdfPage, { x: 72, y: 650, width: 250, height: 28 });
  field.acroField.dict.set(PDFName.of('AA'), source.context.obj({
    K: {
      Type: 'Action',
      S: 'JavaScript',
      JS: PDFString.of('app.alert("field-secret");'),
    },
  }));
  const link = source.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [72, 600, 320, 630],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of('https://tracker.example/click'),
    },
  });
  const annotationReference = source.context.register(link);
  const launch = source.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [72, 560, 320, 590],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'Launch',
      F: PDFString.of('calc.exe'),
    },
  });
  const launchAnnotationReference = source.context.register(launch);
  const httpLaunch = source.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [72, 520, 320, 550],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'Launch',
      F: PDFString.of('https://launch.example/run'),
    },
  });
  const httpLaunchAnnotationReference = source.context.register(httpLaunch);
  const submitForm = source.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [72, 480, 320, 510],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'SubmitForm',
      F: PDFString.of('https://submit.example/collect'),
    },
  });
  const submitFormAnnotationReference = source.context.register(submitForm);
  const chainedUri = source.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [72, 440, 320, 470],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'GoTo',
      D: [pdfPage.ref, PDFName.of('Fit')],
      Next: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of('https://next.example/continue'),
      },
    },
  });
  const chainedUriAnnotationReference = source.context.register(chainedUri);
  const hiddenJavascript = source.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [72, 400, 320, 430],
    Border: [0, 0, 0],
    AA: {
      E: {
        Type: 'Action',
        S: 'JavaScript',
        JS: PDFString.of('app.alert("annotation-secret");'),
      },
    },
  });
  const hiddenJavascriptAnnotationReference = source.context.register(hiddenJavascript);
  const annotations = pdfPage.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
  if (annotations) {
    annotations.push(annotationReference);
    annotations.push(launchAnnotationReference);
    annotations.push(httpLaunchAnnotationReference);
    annotations.push(submitFormAnnotationReference);
    annotations.push(chainedUriAnnotationReference);
    annotations.push(hiddenJavascriptAnnotationReference);
  } else {
    pdfPage.node.set(PDFName.of('Annots'), source.context.obj([
      annotationReference,
      launchAnnotationReference,
      httpLaunchAnnotationReference,
      submitFormAnnotationReference,
      chainedUriAnnotationReference,
      hiddenJavascriptAnnotationReference,
    ]));
  }
  const bytes = await source.save({ useObjectStreams: false });

  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/pdf/pdf-privacy-inspector');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Inspecter la confidentialité d’un PDF');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'audit.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(bytes),
  });
  const workerResponse = page.waitForResponse(response => /\/worker-[\w-]+\.js$/u.test(response.url()));
  await page.getByRole('button', { name: 'Inspecter le PDF' }).click();
  await expect((await workerResponse).ok()).toBe(true);
  const result = page.getByTestId('pdf-privacy-result');
  await expect(result).toContainText('Rapport de confidentialité', { timeout: 20_000 });
  await expect(result).toContainText('Attention forte');
  await expect(result).toContainText('JavaScript embarqué');
  await expect(result).toContainText('secret.txt');
  await expect(result).toContainText('associated-only.txt');
  await expect(result).toContainText('https://tracker.example/click');
  await expect(result).toContainText('calc.exe');
  await expect(result).toContainText('Launch');
  await expect(result).toContainText('https://launch.example/run');
  await expect(result).toContainText('SubmitForm');
  await expect(result).toContainText('https://submit.example/collect');
  await expect(result).toContainText('OpenAction · URI');
  await expect(result).toContainText('https://open.example/start');
  await expect(result).toContainText('AA · URI');
  await expect(result).toContainText('https://page-open.example/ping');
  await expect(result).toContainText('Next · URI');
  await expect(result).toContainText('https://next.example/continue');
  await expect(result).toContainText('JavaScript embarqué');

  await result.getByRole('button', { name: /Métadonnées/u }).click();
  await expect(result).toContainText('Alice');
  await expect(result).toContainText('ClientEmail');
  await expect(result).toContainText('client@example.test');
  await expect(result).not.toContainText('secret.txt');
  await result.getByRole('button', { name: /Tout/u }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le rapport JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('audit-rapport-confidentialite.json');
  const path = await download.path();
  expect(path).not.toBeNull();
  const exported = JSON.parse(await readFile(path as string, 'utf8')) as {
    schema: string;
    report: {
      attentionLevel: string;
      categoryCounts: Record<string, number>;
      findings: unknown[];
    };
  };
  expect(exported.schema).toBe('tools-central/pdf-privacy-report/v1');
  expect(exported.report.attentionLevel).toBe('high');
  expect(exported.report.categoryCounts['active-content']).toBeGreaterThan(0);
  expect(exported.report.categoryCounts['attachments']).toBeGreaterThan(0);
  expect(exported.report.categoryCounts['links']).toBeGreaterThan(0);
  expect(exported.report.categoryCounts['forms']).toBeGreaterThan(0);
  expect(exported.report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({
      message: { code: 'dictionary-action', actionType: 'URI', context: 'open-action' },
    }),
    expect.objectContaining({
      message: { code: 'dictionary-action', actionType: 'URI', context: 'chained-action' },
    }),
    expect.objectContaining({
      message: { code: 'dictionary-action', actionType: 'URI', context: 'additional-action' },
      value: 'https://page-open.example/ping',
    }),
    expect.objectContaining({
      message: { code: 'dictionary-action', actionType: 'JavaScript', context: 'additional-action' },
    }),
    expect.objectContaining({ id: 'attachment:associated:1', label: 'associated-only.txt' }),
  ]));
  expect(exported.report.findings).not.toEqual(expect.arrayContaining([
    expect.objectContaining({ message: { code: 'form-actions' } }),
  ]));
  expect(JSON.stringify(exported)).not.toContain('secret-script');
  expect(JSON.stringify(exported)).not.toContain('field-secret');
  expect(JSON.stringify(exported)).not.toContain('annotation-secret');
  expect(JSON.stringify(exported)).not.toContain('alice@example.test');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto('/en/categories/dev/pdf/pdf-privacy-inspector');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tool unavailable');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
});
