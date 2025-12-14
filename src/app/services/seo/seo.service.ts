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
  ogImageAbs?: string;
  robots?: string;
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly baseUrl = 'https://tools-central.com'; // sans slash final
  private readonly defaultLocale = 'fr';
  private readonly localeSet = new Set<string>(LOCALES.map(l => l.locale));

  constructor(
    private router: Router,
    private title: Title,
    private meta: Meta,
    private links: SeoLinksService,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  init(): void {
    // Important en SSG : au boot on est souvent sur "/" côté router
    this.applyForUrl(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.applyForUrl(e.urlAfterRedirects ?? e.url));
  }

  setPageSeo(cfg: SeoConfig): void {
    this.title.setTitle(cfg.title);
    this.meta.updateTag({ name: 'description', content: cfg.description });
    this.meta.updateTag({ name: 'robots', content: cfg.robots ?? 'index,follow' });

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: cfg.title });
    this.meta.updateTag({ property: 'og:description', content: cfg.description });

    if (cfg.ogImageAbs) this.meta.updateTag({ property: 'og:image', content: cfg.ogImageAbs });

    // og:url aligné sur canonical calculé
    const canonicalAbs = this.toAbsUrl(this.normalizeCanonicalPath(this.router.url));
    this.meta.updateTag({ property: 'og:url', content: canonicalAbs });
  }

  private applyForUrl(rawUrl: string): void {
    const canonicalPath = this.normalizeCanonicalPath(rawUrl);
    const canonicalAbs = this.toAbsUrl(canonicalPath);

    // canonical
    this.links.setCanonical(canonicalAbs);

    // hreflang (+ x-default)
    const { restPath } = this.splitLocaleFromPath(canonicalPath);

    const entries: Array<{ hreflang: string; hrefAbs: string }> = LOCALES.map(l => ({
      hreflang: l.locale,
      hrefAbs: this.toAbsUrl(this.buildLocalePath(l.locale, restPath))
    }));

    entries.push({
      hreflang: 'x-default',
      hrefAbs: this.toAbsUrl(this.buildXDefaultPath(restPath))
    });

    this.links.setHreflangs(entries);

    // html[lang]
    const currentLocale = this.splitLocaleFromPath(canonicalPath).locale ?? this.defaultLocale;
    this.doc.documentElement.lang = currentLocale;
  }

  private normalizeCanonicalPath(url: string): string {
    const pathOnly = stripQueryAndHash(url);
    const cleaned = normalizeSlashes(ensureLeadingSlash(pathOnly));

    const { locale, restPath } = this.splitLocaleFromPath(cleaned);

    // ✅ fallback SSG: si pas de locale dans l’URL router, on la prend dans <base href="/xx/">
    const baseLocale = this.getLocaleFromBaseHref();
    const effectiveLocale = locale ?? baseLocale ?? this.defaultLocale;

    if (!restPath) return `/${effectiveLocale}/`;
    return `/${effectiveLocale}/${restPath}`;
  }

  private getLocaleFromBaseHref(): string | null {
    const baseEl = this.doc.querySelector('base');
    const href = (baseEl?.getAttribute('href') ?? '').trim(); // ex: "/af/"
    const first = href.replace(/^\/+/, '').split('/')[0];      // "af"
    return this.localeSet.has(first) ? first : null;
  }

  private splitLocaleFromPath(path: string): { locale: string | null; restPath: string } {
    const p = normalizeSlashes(ensureLeadingSlash(stripQueryAndHash(path)));
    const parts = p.split('/').filter(Boolean);
    const first = parts[0] ?? '';

    if (!this.localeSet.has(first)) return { locale: null, restPath: parts.join('/') };
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

function stripQueryAndHash(url: string): string {
  return url.split('?')[0].split('#')[0];
}
function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : '/' + path;
}
function normalizeSlashes(path: string): string {
  return path.replace(/\/{2,}/g, '/');
}
