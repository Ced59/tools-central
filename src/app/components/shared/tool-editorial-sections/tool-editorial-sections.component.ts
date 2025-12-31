import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import type { ToolEditorialModel } from '../../../models/tool-editorial/tool-editorial.model';
import type { EditorialSection } from '../../../models/tool-editorial/editorial-section.model';

@Component({
  selector: 'tc-tool-editorial-sections',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tool-editorial-sections.component.html',
  styleUrls: ['./tool-editorial-sections.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolEditorialSectionsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) model!: ToolEditorialModel;

  activeSectionId: string | null = null;

  trackById = (_: number, s: EditorialSection) => s.id;

  private io: IntersectionObserver | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Si la page s'ouvre avec un fragment, scroll après rendu DOM
    this.route.fragment.subscribe((frag) => {
      if (!frag) return;
      setTimeout(() => this.scrollTo(frag), 0);
    });

    // Setup observer après rendu DOM
    setTimeout(() => this.setupObserver(), 0);

    // Optionnel: si resize (header height change), on re-setup l'observer
    // (ça évite un rootMargin erroné si le header change beaucoup)
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.removeEventListener('resize', this.onResize);
    this.teardownObserver();
  }

  onTocClick(ev: MouseEvent, id: string): void {
    ev.preventDefault();

    this.router.navigate([], {
      relativeTo: this.route,
      fragment: id,
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });

    this.scrollTo(id);
  }

  private scrollTo(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this.document.getElementById(id);
    if (!el) return;

    // scroll-margin-top (CSS) gère l'offset sticky header
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    this.activeSectionId = id;
  }

  // ----------------------------
  // IntersectionObserver highlight
  // ----------------------------

  private setupObserver(): void {
    this.teardownObserver();

    const sections = this.model?.sections ?? [];
    if (!sections.length) return;

    const headerOffset = this.readHeaderOffsetPx();
    const topMargin = -(headerOffset + 8);
    const rootMargin = `${topMargin}px 0px -65% 0px`;

    this.io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;

        // Choisit la section la plus "dominante" visuellement
        visible.sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        const id = (visible[0].target as HTMLElement).id;

        if (id && id !== this.activeSectionId) {
          this.activeSectionId = id;
        }
      },
      {
        root: null,
        threshold: [0.05, 0.15, 0.3, 0.6],
        rootMargin,
      }
    );

    for (const s of sections) {
      const el = this.document.getElementById(s.id);
      if (!el) continue;
      this.io.observe(el);
    }

    if (!this.activeSectionId && sections[0]) {
      this.activeSectionId = sections[0].id;
    }
  }

  private teardownObserver(): void {
    if (this.io) {
      this.io.disconnect();
      this.io = null;
    }
  }

  private readHeaderOffsetPx(): number {
    // Lit la variable CSS définie par AppComponent
    const raw = getComputedStyle(this.document.documentElement).getPropertyValue('--app-header-h').trim();
    const n = parseInt(raw.replace('px', ''), 10);
    return Number.isFinite(n) ? n : 0;
  }

  private onResize = () => {
    // Recalcule rootMargin si la hauteur de header change
    setTimeout(() => this.setupObserver(), 0);
  };
}
