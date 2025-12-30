import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class LocalePathService {
  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  /**
   * ✅ Pour [routerLink]
   * On NE met JAMAIS la locale dans les segments.
   * Car en i18n Angular (baseHref=/fr/), le router est déjà “dans” la locale.
   *
   * Exemple:
   *  - build FR (base=/fr/) -> ['/', 'legal-notice'] => /fr/legal-notice
   *  - build EN (base=/en/) -> ['/', 'legal-notice'] => /en/legal-notice
   */
  routerLink(path: string): any[] {
    const clean = (path ?? '').replace(/^\/+/, '');
    return clean ? ['/', clean] : ['/'];
  }

  /**
   * ✅ Pour href (string)
   * On utilise base href réel pour construire un lien correct en SSR/SSG.
   */
  href(path: string): string {
    const clean = (path ?? '').replace(/^\/+/, '');
    const base = this.getBaseHref(); // "/fr/" ou "/"
    const joined = `${base}${clean}`;
    return normalizeSlashes('/' + joined.replace(/^\/+/, ''));
  }

  /**
   * Switch locale en gardant le "reste" du chemin.
   * Ici, on travaille sur le pathname ABSOLU (avec locale).
   */
  switchLocale(currentPath: string, targetLocale: string): string {
    const pathOnly = (currentPath || '/').split('?')[0].split('#')[0];
    const hasTrailingSlash = pathOnly.endsWith('/');

    const parts = pathOnly.split('/').filter(Boolean);
    const first = parts[0];

    // si on est déjà sur une locale, on enlève ce premier segment
    const rest = first && looksLikeLocale(first) ? parts.slice(1) : parts;

    if (rest.length === 0) return `/${targetLocale}/`;

    const joined = `/${targetLocale}/${rest.join('/')}`;
    return hasTrailingSlash ? `${joined}/` : joined;
  }

  private getBaseHref(): string {
    const baseEl = this.doc.querySelector('base');
    const href = (baseEl?.getAttribute('href') ?? '/').trim();
    // normalise pour être "/xx/" ou "/"
    if (!href.startsWith('/')) return '/' + href;
    return href.endsWith('/') ? href : href + '/';
  }
}

function normalizeSlashes(path: string): string {
  return path.replace(/\/{2,}/g, '/');
}

function looksLikeLocale(seg: string): boolean {
  return /^[a-z]{2}(-[A-Za-z]+)?$/.test(seg);
}
