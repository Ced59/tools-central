import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { SeoService } from './seo.service';
import { CATEGORY_REGISTRY, type CategoryId } from '../../data/categories';
import { TOOL_GROUP_REGISTRY } from '../../data/tool-groups';
import {ATOMIC_TOOLS} from "../../data/atomic-tools";

type AutoSeo = { title: string; description: string; ogImageAbs?: string };

@Injectable({ providedIn: 'root' })
export class SeoAutoService {
  private router = inject(Router);
  private seo = inject(SeoService);

  // Optionnel : image OG par défaut (absolue)
  private readonly ogDefault = 'https://tools-central.com/assets/og/default.png';

  init(): void {
    // 1) init classique (canonical/hreflang + lang)
    this.seo.init();

    // 2) auto SEO sur chaque navigation
    this.applyForUrl(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.applyForUrl(e.urlAfterRedirects ?? e.url));
  }

  /**
   * Permet à une page de surcharger l’auto-SEO si nécessaire (optionnel)
   * Ex: pages "cours" détaillées, pages tool avec description dynamique, etc.
   */
  setManualSeo(seo: AutoSeo): void {
    this.seo.setPageSeo({
      ...seo,
      ogImageAbs: seo.ogImageAbs ?? this.ogDefault,
    });
  }

  private applyForUrl(rawUrl: string): void {
    const path = stripQueryAndHash(rawUrl);
    const seg = path.split('/').filter(Boolean);

    // Exemple routes:
    // /fr/categories/:cat
    // /fr/categories/:cat/:group
    // /fr/categories/:cat/:group/:tool
    //
    // Mais attention: ton SeoService normalise locale, donc ici on supporte avec ou sans locale
    const { rest } = stripLocale(seg);

    if (rest.length === 0) {
      // home locale (ex: /fr/)
      this.seo.setPageSeo({
        title: 'Tools Central – Outils en ligne gratuits',
        description: 'Outils gratuits en ligne : calculatrices, texte, PDF, développeur…',
        ogImageAbs: this.ogDefault,
      });
      return;
    }

    // Pages catégories/groupes/outils
    if (rest[0] !== 'categories') return;

    const cat = rest[1] as CategoryId | undefined;
    const group = rest[2] as string | undefined;
    const toolSlug = rest[3] as string | undefined;

    const auto = this.resolveAutoSeo(cat, group, toolSlug);
    if (!auto) return;

    this.seo.setPageSeo({
      title: auto.title,
      description: auto.description,
      ogImageAbs: auto.ogImageAbs ?? this.ogDefault,
    });
  }

  private resolveAutoSeo(
    cat?: CategoryId,
    group?: string,
    toolSlug?: string
  ): AutoSeo | null {
    if (!cat || !(cat in CATEGORY_REGISTRY)) return null;

    const catDef = CATEGORY_REGISTRY[cat];
    const catTitle = catDef.title;
    const catDesc = catDef.description;

    // /categories/:cat
    if (!group) {
      return {
        title: `${catTitle} – Tools Central`,
        description: catDesc,
      };
    }

    const groupDef = (TOOL_GROUP_REGISTRY as any)[cat]?.[group];
    // /categories/:cat/:group
    if (!toolSlug) {
      if (!groupDef) {
        return {
          title: `${catTitle} – Tools Central`,
          description: catDesc,
        };
      }
      return {
        title: `${groupDef.title} – ${catTitle} – Tools Central`,
        description: groupDef.description ?? catDesc,
      };
    }

    // /categories/:cat/:group/:tool
    // Ici: tes tools sont enregistrés par id (clé) et contiennent route + title/description.
    // On retrouve le tool via son slug dans l’URL.
    const tool = findToolBySlug(cat, group, toolSlug);
    if (!tool) {
      // fallback groupe
      if (groupDef) {
        return {
          title: `${groupDef.title} – ${catTitle} – Tools Central`,
          description: groupDef.description ?? catDesc,
        };
      }
      return {
        title: `${catTitle} – Tools Central`,
        description: catDesc,
      };
    }

    const groupTitle = groupDef?.title ?? catTitle;

    return {
      title: `${tool.title} – ${groupTitle} – Tools Central`,
      description: tool.description ?? (groupDef?.description ?? catDesc),
    };
  }
}

// -----------------------------
// helpers
// -----------------------------
function stripQueryAndHash(url: string): string {
  return url.split('?')[0].split('#')[0];
}

function stripLocale(segments: string[]): { locale: string | null; rest: string[] } {
  // LOCALES possibles: tu peux injecter LOCALES ici, mais sans dépendance on fait simple:
  // si 1er segment fait 2-5 chars et que le 2e est "categories", c’est probablement une locale.
  const first = segments[0] ?? '';
  const rest = segments.slice(0);

  const looksLikeLocale = /^[a-z]{2}(-[A-Za-z]+)?$/.test(first);
  if (looksLikeLocale && rest[1] === 'categories') {
    return { locale: first, rest: rest.slice(1) };
  }
  // cas: /fr/ (home)
  if (looksLikeLocale && rest.length === 1) {
    return { locale: first, rest: [] };
  }
  return { locale: null, rest };
}

function findToolBySlug(cat: string, group: string, toolSlug: string) {
  // On retrouve l’outil via sa route (single source)
  // Ex route: /categories/dev/pdf/pdf-metadata-to-json
  const target = `/categories/${cat}/${group}/${toolSlug}`;
  for (const key of Object.keys(ATOMIC_TOOLS) as Array<keyof typeof ATOMIC_TOOLS>) {
    const t = ATOMIC_TOOLS[key];
    if (t.route === target) return t;
  }
  return null;
}
