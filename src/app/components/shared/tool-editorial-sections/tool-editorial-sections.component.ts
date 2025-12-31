import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser, ViewportScroller } from '@angular/common';
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

  /** id de la section actuellement visible (pour highlight du sommaire) */
  activeSectionId: string | null = null;

  trackById = (_: number, s: EditorialSection) => s.id;

  private io: IntersectionObserver | null = null;
  private readonly observed = new Map<string, Element>();

  // Ajuste si tu as un header sticky (ex: 64/72/80)
  private readonly stickyHeaderOffsetPx = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private viewport: ViewportScroller,
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // offset scroll (si header sticky)
    this.viewport.setOffset([0, this.stickyHeaderOffsetPx]);

    // 1) Si on arrive avec un fragment, scroll proprement une fois le DOM prêt
    this.route.fragment.subscribe((frag) => {
      if (!frag) return;
      setTimeout(() => this.scrollTo(frag), 0);
    });

    // 2) Setup IntersectionObserver après rendu (DOM prêt)
    setTimeout(() => this.setupObserver(), 0);
  }

  ngOnDestroy(): void {
    this.teardownObserver();
  }

  /**
   * Click sommaire: navigation Angular (URL courante + fragment) + scroll fiable.
   * Important: preventDefault pour éviter le "base href" qui renvoie à la racine.
   */
  onTocClick(ev: MouseEvent, id: string): void {
    ev.preventDefault();

    // met à jour l'URL sans "polluer" l'historique
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

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // met à jour l'active immédiatement (UX)
    this.activeSectionId = id;
  }

  // ----------------------------
  // IntersectionObserver (bonus)
  // ----------------------------

  private setupObserver(): void {
    this.teardownObserver();

    const sections = this.model?.sections ?? [];
    if (!sections.length) return;

    // Root margin: on "remonte" la zone d'observation si header sticky
    const topMargin = -(this.stickyHeaderOffsetPx + 8);
    // On considère "actif" quand la section entre dans le viewport (top ~ 35%)
    const rootMargin = `${topMargin}px 0px -65% 0px`;

    this.io = new IntersectionObserver(
      (entries) => {
        // On garde les entrées visibles, on choisit celle la plus "haut" dans la page
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;

        // On privilégie celle qui a le plus grand intersectionRatio
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

    // Observe les sections existantes
    for (const s of sections) {
      const el = this.document.getElementById(s.id);
      if (!el) continue;
      this.io.observe(el);
      this.observed.set(s.id, el);
    }

    // Si rien n'est actif, on met le premier
    if (!this.activeSectionId && sections[0]) {
      this.activeSectionId = sections[0].id;
    }
  }

  private teardownObserver(): void {
    if (this.io) {
      this.io.disconnect();
      this.io = null;
    }
    this.observed.clear();
  }
}
