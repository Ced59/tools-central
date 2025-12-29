import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import {HreflangEntry, SeoLinksService} from './seo-links.service';
import { LOCALES } from '../../i18n/locales.generated';

export type SeoConfig = {
  title: string;
  description: string;
  ogImageAbs?: string;        // image absolue (idéalement 1200x630)
  robots?: string;

  // Optionnel : si tu veux forcer une card différente
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;       // ex: "@toolscentral"
  twitterCreator?: string;    // ex: "@ced"
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly baseUrl = 'https://tools-central.com'; // sans slash final
  private readonly defaultLocale = 'fr';
  private readonly localeSet = new Set<string>(LOCALES.map(l => l.locale));

  // Canonical calculé sur la dernière navigation (source de vérité pour og/twitter:url)
  private lastCanonicalAbs = `${this.baseUrl}/`;

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

  /**
   * Appelée par tes pages (outil/catégorie/home) pour poser title/description/etc.
   * Robustesse: remove + add => aucun doublon => scrapers lisent la bonne balise.
   */
  setPageSeo(cfg: SeoConfig): void {
    // Title
    this.title.setTitle(cfg.title);

    // Basic metas
    this.setMetaName('description', cfg.description);
    this.setMetaName('robots', cfg.robots ?? 'index,follow');

    // OpenGraph
    this.setMetaProperty('og:type', 'website');
    this.setMetaProperty('og:title', cfg.title);
    this.setMetaProperty('og:description', cfg.description);
    this.setMetaProperty('og:url', this.lastCanonicalAbs);

    if (cfg.ogImageAbs) {
      this.setMetaProperty('og:image', cfg.ogImageAbs);
      // Bonus souvent utile :
      // this.setMetaProperty('og:image:width', '1200');
      // this.setMetaProperty('og:image:height', '630');
    }

    // Twitter Cards
    const card =
      cfg.twitterCard ??
      (cfg.ogImageAbs ? 'summary_large_image' : 'summary');

    this.setMetaName('twitter:card', card);
    this.setMetaName('twitter:title', cfg.title);
    this.setMetaName('twitter:description', cfg.description);
    this.setMetaName('twitter:url', this.lastCanonicalAbs);

    if (cfg.twitterSite) this.setMetaName('twitter:site', cfg.twitterSite);
    if (cfg.twitterCreator) this.setMetaName('twitter:creator', cfg.twitterCreator);

    if (cfg.ogImageAbs) {
      this.setMetaName('twitter:image', cfg.ogImageAbs);
      // (optionnel) alt
      // this.setMetaName('twitter:image:alt', cfg.title);
    }
  }

  private applyForUrl(rawUrl: string): void {
    const canonicalPath = this.normalizeCanonicalPath(rawUrl);
    const canonicalAbs = this.toAbsUrl(canonicalPath);

    this.lastCanonicalAbs = canonicalAbs;

    // canonical
    this.links.setCanonical(canonicalAbs);

    // hreflang (+ x-default)
    const { restPath } = this.splitLocaleFromPath(canonicalPath);

    const entries: HreflangEntry[] = LOCALES.map(l => ({
      hreflang: String(l.locale), // force string => compatible x-default
      hrefAbs: this.toAbsUrl(this.buildLocalePath(String(l.locale), restPath))
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

  // ----------------------------
  // Meta helpers (no duplicates)
  // ----------------------------
  private setMetaName(name: string, content: string): void {
    // Supprime TOUTES les occurrences (y compris celles injectées ailleurs)
    this.removeAllMeta(`meta[name="${cssEscapeAttr(name)}"]`);
    // Ajoute une seule balise (force = true si une existe, mais on a déjà purgé)
    this.meta.addTag({ name, content }, true);
  }

  private setMetaProperty(property: string, content: string): void {
    this.removeAllMeta(`meta[property="${cssEscapeAttr(property)}"]`);
    this.meta.addTag({ property, content }, true);
  }

  private removeAllMeta(selector: string): void {
    const nodes = Array.from(this.doc.head.querySelectorAll(selector));
    for (const n of nodes) n.remove();
  }

  // ----------------------------
  // Canonical + locale helpers
  // ----------------------------
  private normalizeCanonicalPath(url: string): string {
    const pathOnly = stripQueryAndHash(url);
    const cleaned = normalizeSlashes(ensureLeadingSlash(pathOnly));

    const { locale, restPath } = this.splitLocaleFromPath(cleaned);

    // fallback SSG: si pas de locale dans l’URL router, on la prend dans <base href="/xx/">
    const baseLocale = this.getLocaleFromBaseHref();
    const effectiveLocale = locale ?? baseLocale ?? this.defaultLocale;

    // force trailing slash sur racine locale
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

// ----------------------------
// utils
// ----------------------------
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
  // escape minimal pour attributs dans selector
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
