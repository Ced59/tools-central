import { describe, expect, it } from 'vitest';

import { toolParams } from './app.routes.server';

describe('toolParams', () => {
  it('pré-rend uniquement les outils publiés dans la locale demandée', () => {
    const frenchParams = toolParams('fr');
    const englishParams = toolParams('en');
    const ooxmlMetadataCleaner = {
      idCategory: 'dev',
      idGroup: 'ooxml',
      idTool: 'ooxml-sanitize-metadata',
    };
    const universalPdfTool = {
      idCategory: 'dev',
      idGroup: 'pdf',
      idTool: 'pdf-form-fields-to-json',
    };

    expect(frenchParams).toContainEqual(ooxmlMetadataCleaner);
    expect(englishParams).not.toContainEqual(ooxmlMetadataCleaner);
    expect(englishParams).toContainEqual(universalPdfTool);
  });
});
