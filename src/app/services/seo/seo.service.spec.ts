import { TestBed } from '@angular/core/testing';

import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('limite les hreflang d’un outil aux locales éditorialement relues', () => {
    const applyForUrl = (service as unknown as { applyForUrl(url: string): void }).applyForUrl.bind(service);

    applyForUrl('/en/categories/dev/seo/software-application-schema-builder');

    const alternates = Array.from(document.head.querySelectorAll<HTMLLinkElement>(
      'link[rel="alternate"][hreflang]',
    ));
    expect(alternates.map(link => link.hreflang)).toEqual(['fr', 'x-default']);
    expect(alternates.map(link => link.href)).toEqual([
      'https://www.tools-central.com/fr/categories/dev/seo/software-application-schema-builder',
      'https://www.tools-central.com/fr/categories/dev/seo/software-application-schema-builder',
    ]);
  });

  it('limite aussi les hreflang d’un groupe à ses outils publiés', () => {
    const applyForUrl = (service as unknown as { applyForUrl(url: string): void }).applyForUrl.bind(service);

    applyForUrl('/en/categories/dev/ooxml');

    const alternates = Array.from(document.head.querySelectorAll<HTMLLinkElement>(
      'link[rel="alternate"][hreflang]',
    ));
    expect(alternates.map(link => link.hreflang)).toEqual(['fr', 'x-default']);
    expect(alternates.map(link => link.href)).toEqual([
      'https://www.tools-central.com/fr/categories/dev/ooxml',
      'https://www.tools-central.com/fr/categories/dev/ooxml',
    ]);
  });
});
