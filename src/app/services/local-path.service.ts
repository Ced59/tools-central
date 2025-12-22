import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LOCALES } from '../i18n/locales.generated';

@Injectable({ providedIn: 'root' })
export class LocalePathService {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  private isKnownLocale(seg: string | undefined | null): boolean {
    if (!seg) return false;
    return LOCALES.some(l => l.locale === seg);
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
