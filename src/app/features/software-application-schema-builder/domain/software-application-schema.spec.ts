import { describe, expect, it } from 'vitest';

import {
  buildSoftwareApplicationSchema,
  type SoftwareApplicationSchemaInput,
} from './software-application-schema';

describe('buildSoftwareApplicationSchema', () => {
  it('génère un SoftwareApplication gratuit valide pour Schema.org', () => {
    const result = buildSoftwareApplicationSchema(validInput({
      price: '0',
      priceCurrency: '',
      includeAggregateRating: false,
    }));

    expect(result.state).toBe('schema-valid');
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'missing-aggregate-rating' }));
    expect(result.schema).toEqual(expect.objectContaining({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Outil exemple',
      offers: { '@type': 'Offer', price: '0' },
    }));
  });

  it('devient prêt pour Google avec une note agrégée réelle et cohérente', () => {
    const result = buildSoftwareApplicationSchema(validInput({
      includeAggregateRating: true,
      ratingValue: '4,7',
      ratingCount: '128',
    }));

    expect(result.state).toBe('google-ready');
    expect(result.issues).toHaveLength(0);
    expect(result.schema?.['aggregateRating']).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.7,
      ratingCount: 128,
      bestRating: 5,
      worstRating: 1,
    });
  });

  it('exige un nom et un prix non négatif', () => {
    const result = buildSoftwareApplicationSchema(validInput({ name: ' ', price: '-1' }));

    expect(result.state).toBe('invalid');
    expect(result.schema).toBeNull();
    expect(result.issues.map(item => item.code)).toEqual(expect.arrayContaining(['missing-name', 'invalid-price']));
  });

  it('refuse les URL non HTTP et les identifiants intégrés', () => {
    const result = buildSoftwareApplicationSchema(validInput({
      url: 'javascript:alert(1)',
      screenshotUrl: 'https://user:secret@example.com/image.png',
    }));

    expect(result.issues.map(item => item.code)).toEqual(expect.arrayContaining([
      'invalid-url',
      'screenshot-url-credentials',
    ]));
  });

  it('refuse l’état Google-ready lorsqu’une offre payante ne précise pas sa devise', () => {
    const result = buildSoftwareApplicationSchema(validInput({
      price: '12.50',
      priceCurrency: '',
      includeAggregateRating: true,
    }));

    expect(result.state).toBe('schema-valid');
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'missing-price-currency' }));
  });

  it('refuse un code de trois lettres absent de la norme ISO 4217', () => {
    const result = buildSoftwareApplicationSchema(validInput({ priceCurrency: 'ZZZ' }));

    expect(result.state).toBe('invalid');
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: 'invalid-price-currency',
      detail: 'ZZZ',
    }));
  });

  it('accepte les unités de fonds et complémentaires présentes dans la liste ISO 4217', () => {
    for (const priceCurrency of ['BOV', 'CHE', 'CHW', 'CLF', 'XAD']) {
      const result = buildSoftwareApplicationSchema(validInput({ priceCurrency }));

      expect(result.issues).not.toContainEqual(expect.objectContaining({ code: 'invalid-price-currency' }));
    }
  });

  it('conserve les trois décimales des devises qui les utilisent', () => {
    const result = buildSoftwareApplicationSchema(validInput({
      price: '1.234',
      priceCurrency: 'KWD',
    }));

    expect(result.state).toBe('schema-valid');
    expect(result.issues).not.toContainEqual(expect.objectContaining({ code: 'invalid-price' }));
    expect(result.schema?.['offers']).toEqual({
      '@type': 'Offer',
      price: '1.234',
      priceCurrency: 'KWD',
    });
  });

  it('préserve exactement un prix décimal au-delà de la précision de Number', () => {
    const result = buildSoftwareApplicationSchema(validInput({
      price: '123456789.123456789',
      priceCurrency: 'EUR',
    }));

    expect(result.state).toBe('schema-valid');
    expect(result.schema?.['offers']).toEqual(expect.objectContaining({
      price: '123456789.123456789',
    }));
    expect(result.jsonLd).toContain('"price": "123456789.123456789"');
  });

  it('compare exactement les décimales à la limite de prix', () => {
    const accepted = buildSoftwareApplicationSchema(validInput({ price: '999999999.990' }));
    const rejected = buildSoftwareApplicationSchema(validInput({ price: '999999999.9901' }));

    expect(accepted.issues).not.toContainEqual(expect.objectContaining({ code: 'price-too-large' }));
    expect(accepted.schema?.['offers']).toEqual(expect.objectContaining({ price: '999999999.990' }));
    expect(rejected.issues).toContainEqual(expect.objectContaining({ code: 'price-too-large' }));
  });

  it('refuse une note hors de son échelle et un compteur non entier', () => {
    const result = buildSoftwareApplicationSchema(validInput({
      includeAggregateRating: true,
      ratingValue: '6',
      ratingCount: '1.5',
    }));

    expect(result.state).toBe('invalid');
    expect(result.issues.map(item => item.code)).toEqual(expect.arrayContaining([
      'invalid-rating-count',
      'rating-out-of-range',
    ]));
  });

  it('échappe une fermeture de script dans la sortie HTML embarquable', () => {
    const result = buildSoftwareApplicationSchema(validInput({ name: '</script><script>alert(1)</script>' }));

    expect(result.jsonLd).toContain('</script>');
    expect(result.scriptTag).not.toContain('</script><script>');
    expect(result.scriptTag).toContain('\\u003C/script>');
  });

  it('borne les champs textuels et le prix', () => {
    const result = buildSoftwareApplicationSchema(validInput({
      name: 'a'.repeat(201),
      description: 'b'.repeat(2_001),
      operatingSystem: 'c'.repeat(201),
      softwareVersion: 'd'.repeat(101),
      price: '1000000000',
    }));

    expect(result.issues.map(item => item.code)).toEqual(expect.arrayContaining([
      'name-too-long',
      'description-too-long',
      'operating-system-too-long',
      'version-too-long',
      'price-too-large',
    ]));
  });
});

function validInput(overrides: Partial<SoftwareApplicationSchemaInput> = {}): SoftwareApplicationSchemaInput {
  return {
    type: 'WebApplication',
    name: 'Outil exemple',
    description: 'Une application utile et visible sur la page.',
    url: 'https://example.com/app',
    screenshotUrl: 'https://example.com/app.png',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Navigateur web moderne',
    softwareVersion: '2.1',
    price: '0',
    priceCurrency: 'EUR',
    includeAggregateRating: false,
    ratingValue: '4.7',
    ratingCount: '128',
    bestRating: '5',
    worstRating: '1',
    ...overrides,
  };
}
