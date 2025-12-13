import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { SeoLinksService } from './seo-links.service';
import { LOCALES } from '../../i18n/locales.generated';

type SeoConfig = {
  title: string;
  description: string;
  // optionnel si tu veux varier OG image par page
  ogImageAbs?: string;
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly baseUrl = 'https://tools-central.com'; // ⚠️ ton domaine canonique
  private readonly defaultLocale = 'fr';

  constructor(
    private router: Router,
    private title: Title,
    private meta: Meta,
    private links: SeoLinksService,
    @Inject(DOCUMENT) private doc: Document,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
  }

  /**
   * Appelle ça 1 fois au boot (AppComponent) pour activer l’auto-update SEO à chaque navigation.
   */
  init(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd)
      )
      .subscribe(() => {
        // On calcule canonical/hreflang à chaque navigation (SSR ok)
        const urlPath = this.router.url.split('?')[0].split('#')[0];
        this.applyLinks(urlPath);
      });
  }

  /**
   * À appeler depuis chaque page (ou depuis un resolver/route data) pour poser title/description traduits.
   */
  setPageSeo(cfg: SeoConfig): void {
    this.title.setTitle(cfg.title);

    this.meta.updateTag({name: 'description', content: cfg.description});

    // OpenGraph aligné
    this.meta.updateTag({property: 'og:title', content: cfg.title});
    this.meta.updateTag({property: 'og:description', content: cfg.description});

    // og:url = canonical
    const urlPath = this.router.url.split('?')[0].split('#')[0];
    const canonical = this.toAbsUrl(this.normalizeCanonical(urlPath));
    this.meta.updateTag({property: 'og:url', content: canonical});

    if (cfg.ogImageAbs) {
      this.meta.updateTag({property: 'og:image', content: cfg.ogImageAbs});
    }

    // Lang html (utile)
    const currentLocale = this.getLocaleFromPath(urlPath) ?? this.defaultLocale;
    if (isPlatformBrowser(this.platformId)) {
      this.doc.documentElement.lang = currentLocale;
    }
  }

  private applyLinks(currentPath: string): void {
    const canonicalPath = this.normalizeCanonical(currentPath);
    const canonicalAbs = this.toAbsUrl(canonicalPath);
    this.links.setCanonical(canonicalAbs);

    const {restPath} = this.splitLocale(currentPath);
    const rest = restPath; // sans locale, sans leading slash

    const hreflangs = LOCALES.map(l => ({
      hreflang: l.locale as string,
      hrefAbs: this.toAbsUrl(this.buildLocalePath(l.locale, rest))
    }));

    const xDefaultPath = this.buildXDefaultPath(rest);
    hreflangs.push({hreflang: 'x-default', hrefAbs: this.toAbsUrl(xDefaultPath)});

    this.links.setHreflangs(hreflangs);
  }

  /** Normalise canonical: assure /{locale}/ pour home, conserve le reste sans bricoler les slashes */
  private normalizeCanonical(path: string): string {
    const cleaned = ensureLeadingSlash(path);

    const {locale, restPath} = this.splitLocale(cleaned);
    const effectiveLocale = locale ?? this.defaultLocale;

    // Home locale => "/fr/"
    if (!restPath) return `/${effectiveLocale}/`;

    return `/${effectiveLocale}/${restPath}`;
  }

  private buildLocalePath(locale: string, restPath: string): string {
    if (!restPath) return `/${locale}/`;
    return `/${locale}/${restPath}`;
  }

  private buildXDefaultPath(restPath: string): string {
    // Domaine nu
    if (!restPath) return `/`;
    return `/${restPath}`;
  }

  private toAbsUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private getLocaleFromPath(path: string): string | null {
    return this.splitLocale(path).locale;
  }

  private splitLocale(path: string): { locale: string | null; restPath: string } {
    const p = ensureLeadingSlash(path);
    const parts = p.split('/').filter(Boolean);
    const first = parts[0] ?? '';

    const localesSet = new Set<string>(LOCALES.map(l => l.locale));
    const hasLocale = localesSet.has(first);

    if (!hasLocale) {
      return {locale: null, restPath: parts.join('/')};
    }

    const rest = parts.slice(1).join('/');
    return {locale: first, restPath: rest};
  }
}

function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : '/' + path;
}
