import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LOCALES } from '../i18n/locales.generated';

@Injectable({ providedIn: 'root' })
export class LocalePathService {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  private readonly localeSet = new Set<string>(LOCALES.map(l => l.locale));

  private isKnownLocale(seg: string | undefined | null): boolean {
    if (!seg) return false;
    return LOCALES.some(l => l.locale === seg);
  }

  switchLocale(currentPath: string, targetLocale: string): string {
    const pathOnly = (currentPath || '/').split('?')[0].split('#')[0];

    // garde l’info "slash final"
    const hasTrailingSlash = pathOnly.endsWith('/');

    const parts = pathOnly.split('/').filter(Boolean);
    const first = parts[0];

    let rest: string[] = [];
    if (first && this.localeSet.has(first)) rest = parts.slice(1);
    else rest = parts;

    // Si on est sur la home => /xx/
    if (rest.length === 0) return `/${targetLocale}/`;

    // Sur une page interne : on garde le trailing slash si présent
    const joined = `/${targetLocale}/${rest.join('/')}`;
    return hasTrailingSlash ? `${joined}/` : joined;
  }

  /**
   * Retourne un tableau routerLink compatible :
   * - prod (url prefixée): /{locale}/{path}
   * - local dev (sans prefix): /{path}
   *
   * path: "privacy-policy" (sans slash)
   */
  link(path: string): any[] {
    const clean = (path ?? '').replace(/^\/+/, '');
    if (!clean) return ['/'];

    if (!isPlatformBrowser(this.platformId)) {
      // SSR: on ne peut pas lire location.pathname.
      // On renvoie un lien non préfixé : OK en rendu,
      // et le client corrigera au clic / après hydration.
      return ['/', clean];
    }

    const first = location.pathname.split('/').filter(Boolean)[0] ?? null;
    const loc = this.isKnownLocale(first) ? first : null;

    return loc ? ['/', loc, clean] : ['/', clean];
  }

  /**
   * Variante qui retourne une URL string (utile pour href)
   */
  href(path: string): string {
    const parts = this.link(path);
    return parts.join('/').replace(/\/{2,}/g, '/');
  }
}
