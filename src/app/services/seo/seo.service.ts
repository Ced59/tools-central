import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { SeoLinksService } from './seo-links.service';
import { LOCALES } from '../../i18n/locales.generated';

export type SeoConfig = {
  title: string;
  description: string;

  // Optionnel
  ogImageAbs?: string;

  // Optionnel (par défaut: index,follow)
  robots?: string;
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  /** ⚠️ Mets ton domaine canonique UNIQUE ici (sans slash final) */
  private readonly baseUrl = 'https://tools-central.com';
  private readonly defaultLocale = 'fr';

  private readonly localeSet = new Set<string>(LOCALES.map(l => l.locale));

  constructor(
    private router: Router,
    private title: Title,
    private meta: Meta,
    private links: SeoLinksService,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  /**
   * Appelle 1 fois au boot (AppComponent) :
   * - pose canonical/hreflang + html[lang] dès l'URL courante
   * - puis à chaque NavigationEnd
   */
  init(): void {
    // 1) URL initiale (important en SSR/prerender)
    this.applyForUrl(this.router.url);

    // 2) Navigations SPA
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.applyForUrl(e.urlAfterRedirects ?? e.url));
  }

  /**
   * Appelle depuis une page (Home, Category, Tool...) pour title/description traduits.
   * Ex: this.seo.setPageSeo({ title: $localize`...`, description: $localize`...` })
   */
  setPageSeo(cfg: SeoConfig): void {
    // title + description
    this.title.setTitle(cfg.title);
    this.meta.updateTag({ name: 'description', content: cfg.description });

    // robots (facultatif)
    this.meta.updateTag({ name: 'robots', content: cfg.robots ?? 'index,follow' });

    // OG (fallback + partage)
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: cfg.title });
    this.meta.updateTag({ property: 'og:description', content: cfg.description });

    if (cfg.ogImageAbs) {
      this.meta.updateTag({ property: 'og:image', content: cfg.ogImageAbs });
    }

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: cfg.title });
    this.meta.updateTag({ name: 'twitter:description', content: cfg.description });
    if (cfg.ogImageAbs) this.meta.updateTag({ name: 'twitter:image', content: cfg.ogImageAbs });


    // og:url aligné sur canonical (calculé depuis l'URL courante)
    const canonicalAbs = this.toAbsUrl(this.normalizeCanonicalPath(this.router.url));
    this.meta.updateTag({ property: 'og:url', content: canonicalAbs });
  }

  // -------------------------
  // Internals
  // -------------------------

  private applyForUrl(rawUrl: string): void {
    const canonicalPath = this.normalizeCanonicalPath(rawUrl);
    const canonicalAbs = this.toAbsUrl(canonicalPath);

    // canonical
    this.links.setCanonical(canonicalAbs);

    // hreflang
    const { restPath } = this.splitLocaleFromPath(canonicalPath);

    const entries = LOCALES.map(l => ({
      hreflang: l.locale,
      hrefAbs: this.toAbsUrl(this.buildLocalePath(l.locale, restPath))
    }));

    // x-default : domaine nu (ok même si redirige vers /fr/)
    entries.push({
      hreflang: 'x-default' as any,
      hrefAbs: this.toAbsUrl(this.buildXDefaultPath(restPath))
    });

    this.links.setHreflangs(entries);

    // html lang (SSR + browser) ✅
    const currentLocale = this.splitLocaleFromPath(canonicalPath).locale ?? this.defaultLocale;
    this.doc.documentElement.lang = currentLocale;
  }

  /**
   * Normalise le chemin canonique:
   * - retire query/hash
   * - assure un /{locale}/... (locale par défaut si absente)
   * - garde une forme stable (slashes propres)
   */
  private normalizeCanonicalPath(url: string): string {
    const pathOnly = stripQueryAndHash(url);
    const cleaned = normalizeSlashes(ensureLeadingSlash(pathOnly));

    const { locale, restPath } = this.splitLocaleFromPath(cleaned);
    const effectiveLocale = locale ?? this.defaultLocale;

    // home => "/{locale}/"
    if (!restPath) return `/${effectiveLocale}/`;

    // pas de trailing slash imposé ici (sauf home), pour coller à tes routes
    return `/${effectiveLocale}/${restPath}`;
  }

  private splitLocaleFromPath(path: string): { locale: string | null; restPath: string } {
    const p = normalizeSlashes(ensureLeadingSlash(stripQueryAndHash(path)));
    const parts = p.split('/').filter(Boolean);
    const first = parts[0] ?? '';

    if (!this.localeSet.has(first)) {
      return { locale: null, restPath: parts.join('/') };
    }

    return { locale: first, restPath: parts.slice(1).join('/') };
  }

  private buildLocalePath(locale: string, restPath: string): string {
    return restPath ? `/${locale}/${restPath}` : `/${locale}/`;
  }

  private buildXDefaultPath(restPath: string): string {
    // domaine nu (tu as un fallback /fr/ côté serveur)
    return restPath ? `/${restPath}` : `/`;
  }

  private toAbsUrl(path: string): string {
    const p = ensureLeadingSlash(path);
    return `${this.baseUrl}${p}`;
  }
}

function stripQueryAndHash(url: string): string {
  return url.split('?')[0].split('#')[0];
}

function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : '/' + path;
}

function normalizeSlashes(path: string): string {
  return path.replace(/\/{2,}/g, '/');
}
