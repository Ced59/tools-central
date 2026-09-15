import { describe, expect, it } from 'vitest';

import { isGroupPublishedForLocale, isToolPublishedForLocale } from './index';

describe('isToolPublishedForLocale', () => {
  it('conserve le comportement historique sans restriction de locale', () => {
    expect(isToolPublishedForLocale({ available: true }, 'en')).toBe(true);
  });

  it('refuse toujours un outil globalement indisponible', () => {
    expect(isToolPublishedForLocale({ available: false, reviewedLocales: ['fr'] }, 'fr')).toBe(false);
  });

  it('publie uniquement les locales explicitement relues', () => {
    const tool = { available: true, reviewedLocales: ['fr', 'pt-BR'] };

    expect(isToolPublishedForLocale(tool, 'fr')).toBe(true);
    expect(isToolPublishedForLocale(tool, 'pt-BR')).toBe(true);
    expect(isToolPublishedForLocale(tool, 'pt-PT')).toBe(false);
    expect(isToolPublishedForLocale(tool, 'en')).toBe(false);
  });

  it('accepte une variante régionale du langage relu sans région', () => {
    expect(isToolPublishedForLocale({ available: true, reviewedLocales: ['fr'] }, 'fr-FR')).toBe(true);
  });

  it('publie un groupe uniquement si au moins un outil est relu dans la locale', () => {
    expect(isGroupPublishedForLocale('dev', 'ooxml', 'fr')).toBe(true);
    expect(isGroupPublishedForLocale('dev', 'ooxml', 'en')).toBe(false);
  });
});
