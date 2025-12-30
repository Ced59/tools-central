import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { SeoLinksService, type HreflangEntry } from './seo-links.service';
import { LOCALES } from '../../i18n/locales.generated';

export type SeoConfig = {
  title: string;
  description: string;
  ogImageAbs?: string;
  robots?: string;

  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  twitterCreator?: string;
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly baseUrl = 'https://tools-central.com';
  private readonly defaultLocale = 'fr';
  private readonly localeSet = new Set<string>(LOCALES.map(l => l.locale));

  /** Canonical absolu calculé à chaque navigation */
  private lastCanonicalAbs = `${this.baseUrl}/`;

  constructor(
    private router: Router,
    private title: Title,
    private meta: Meta,
    private links: SeoLinksService,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  /** À appeler UNE fois au boot */
  init(): void {
    this.applyForUrl(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.applyForUrl(e.urlAfterRedirects ?? e.url));
  }

  /** API publique utilisée par l’auto-SEO ou manuellement */
  setPageSeo(cfg: SeoConfig): void {
    this.title.setTitle(cfg.title);

    this.setMetaName('description', cfg.description);
    this.setMetaName('robots', cfg.robots ?? 'index,follow');

    // OpenGraph
    this.setMetaProperty('og:type', 'website');
    this.setMetaProperty('og:title', cfg.title);
    this.setMetaProperty('og:description', cfg.description);
    this.setMetaProperty('og:url', this.lastCanonicalAbs);

    if (cfg.ogImageAbs) {
      this.setMetaProperty('og:image', cfg.ogImageAbs);
    }

    // Twitter
    const card =
      cfg.twitterCard ??
      (cfg.ogImageAbs ? 'summary_large_image' : 'summary');

    this.setMetaName('twitter:card', card);
    this.setMetaName('twitter:title', cfg.title);
    this.setMetaName('twitter:description', cfg.description);
    this.setMetaName('twitter:url', this.lastCanonicalAbs);

    if (cfg.twitterSite) {
      this.setMetaName('twitter:site', cfg.twitterSite);
    }
    if (cfg.twitterCreator) {
      this.setMetaName('twitter:creator', cfg.twitterCreator);
    }
    if (cfg.ogImageAbs) {
      this.setMetaName('twitter:image', cfg.ogImageAbs);
    }
  }

  // ---------------------------------------------------------------------------
  // Canonical + hreflang (auto, jamais à appeler depuis les components)
  // ---------------------------------------------------------------------------
  private applyForUrl(rawUrl: string): void {
    const canonicalPath = this.normalizeCanonicalPath(rawUrl);
    const canonicalAbs = this.toAbsUrl(canonicalPath);

    this.lastCanonicalAbs = canonicalAbs;

    // canonical
    this.links.setCanonical(canonicalAbs);

    // hreflang (+ x-default)
    const { restPath } = this.splitLocaleFromPath(canonicalPath);

    const entries: HreflangEntry[] = LOCALES.map(l => ({
      hreflang: String(l.locale),
      hrefAbs: this.toAbsUrl(this.buildLocalePath(String(l.locale), restPath)),
    }));

    entries.push({
      hreflang: 'x-default',
      hrefAbs: this.toAbsUrl(this.buildXDefaultPath(restPath)),
    });

    this.links.setHreflangs(entries);

    // <html lang="">
    const currentLocale =
      this.splitLocaleFromPath(canonicalPath).locale ?? this.defaultLocale;
    this.doc.documentElement.lang = currentLocale;
  }

  // ---------------------------------------------------------------------------
  // Meta helpers (no duplicates, ever)
  // ---------------------------------------------------------------------------
  private setMetaName(name: string, content: string): void {
    this.removeAll(`meta[name="${cssEscapeAttr(name)}"]`);
    this.meta.addTag({ name, content }, true);
  }

  private setMetaProperty(property: string, content: string): void {
    this.removeAll(`meta[property="${cssEscapeAttr(property)}"]`);
    this.meta.addTag({ property, content }, true);
  }

  private removeAll(selector: string): void {
    const nodes = Array.from(this.doc.head.querySelectorAll(selector));
    for (const n of nodes) n.remove();
  }

  // ---------------------------------------------------------------------------
  // URL helpers
  // ---------------------------------------------------------------------------
  private normalizeCanonicalPath(url: string): string {
    const pathOnly = stripQueryAndHash(url);
    const cleaned = normalizeSlashes(ensureLeadingSlash(pathOnly));

    const { locale, restPath } = this.splitLocaleFromPath(cleaned);

    const baseLocale = this.getLocaleFromBaseHref();
    const effectiveLocale = locale ?? baseLocale ?? this.defaultLocale;

    if (!restPath) return `/${effectiveLocale}/`;
    return `/${effectiveLocale}/${restPath}`;
  }

  private getLocaleFromBaseHref(): string | null {
    const baseEl = this.doc.querySelector('base');
    const href = (baseEl?.getAttribute('href') ?? '').trim();
    const first = href.replace(/^\/+/, '').split('/')[0];
    return this.localeSet.has(first) ? first : null;
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
    return restPath ? `/${restPath}` : `/`;
  }

  private toAbsUrl(path: string): string {
    const p = ensureLeadingSlash(path);
    return `${this.baseUrl}${p}`;
  }
}

// ---------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------
function stripQueryAndHash(url: string): string {
  return url.split('?')[0].split('#')[0];
}
function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : '/' + path;
}
function normalizeSlashes(path: string): string {
  return path.replace(/\/{2,}/g, '/');
}
function cssEscapeAttr(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
