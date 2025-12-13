import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SeoLinksService {
  constructor(@Inject(DOCUMENT) private doc: Document) {}

  setCanonical(hrefAbs: string): void {
    this.upsertLink({ rel: 'canonical', href: hrefAbs });
  }

  setHreflangs(entries: Array<{ hreflang: string; hrefAbs: string }>): void {
    // Supprime tous les alternates hreflang existants pour éviter duplication
    const existing = Array.from(this.doc.head.querySelectorAll('link[rel="alternate"][hreflang]'));
    for (const el of existing) el.remove();

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

// Escape minimal pour CSS selectors
function cssEscape(value: string): string {
  return value.replace(/"/g, '\\"');
}
