import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type HreflangEntry = { hreflang: string; hrefAbs: string };

@Injectable({ providedIn: 'root' })
export class SeoLinksService {
  constructor(@Inject(DOCUMENT) private doc: Document) {}

  setCanonical(hrefAbs: string): void {
    this.upsertLink({ rel: 'canonical', href: hrefAbs });
  }

  setHreflangs(entries: ReadonlyArray<HreflangEntry>): void {
    // On retire tous les alternates existants
    const existing = Array.from(this.doc.head.querySelectorAll('link[rel="alternate"][hreflang]'));
    for (const el of existing) el.remove();

    // Puis on réinjecte la liste complète (stable)
    for (const e of entries) {
      this.upsertLink({ rel: 'alternate', href: e.hrefAbs, hreflang: e.hreflang });
    }
  }

  private upsertLink(attrs: { rel: string; href: string; hreflang?: string }): void {
    const selector =
      attrs.rel === 'alternate' && attrs.hreflang
        ? `link[rel="alternate"][hreflang="${cssEscape(attrs.hreflang)}"]`
        : `link[rel="${cssEscape(attrs.rel)}"]`;

    let link = this.doc.head.querySelector(selector) as HTMLLinkElement | null;
    if (!link) {
      link = this.doc.createElement('link');
      this.doc.head.appendChild(link);
    }

    link.setAttribute('rel', attrs.rel);
    link.setAttribute('href', attrs.href);
    if (attrs.hreflang) link.setAttribute('hreflang', attrs.hreflang);
  }
}

function cssEscape(value: string): string {
  return value.replace(/"/g, '\\"');
}
