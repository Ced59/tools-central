import { Component, Type, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgComponentOutlet, NgIf } from '@angular/common';

import { ToolRegistryService } from '../../../../core/tools/tool-registry.service';

import { CATEGORIES, type CategoryId } from '../../../../data/categories';
import { routes } from '../../../../data/routes';

import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';
import { ToolEditorialSectionsComponent } from '../../../shared/tool-editorial-sections/tool-editorial-sections.component';
import {ToolEditorialService} from "../../../../core/tools/toll-editorial.service";

@Component({
  standalone: true,
  imports: [NgIf, NgComponentOutlet, RouterLink, ToolEditorialSectionsComponent],
  template: `
    <ng-container *ngIf="isLoading(); else loaded">
      <section class="state state-loading">
        <div class="container">
          <h1 i18n>Chargement…</h1>
          <p i18n>Nous préparons l’outil.</p>
        </div>
      </section>
    </ng-container>

    <ng-template #loaded>
      <ng-container *ngIf="toolComponent(); else notFound">
        <!-- Tool UI -->
        <ng-container *ngComponentOutlet="toolComponent()"></ng-container>

        <!-- Editorial global (1 seule intégration) -->
        <ng-container *ngIf="editorial() as ed">
          <div class="container tool-editorial-container">
            <tc-tool-editorial-sections [model]="ed"></tc-tool-editorial-sections>
          </div>
        </ng-container>
      </ng-container>
    </ng-template>

    <ng-template #notFound>
      <section class="state state-notfound">
        <div class="container">
          <h1 i18n>Outil indisponible</h1>
          <p i18n>Cet outil n'existe pas ou n'est pas encore disponible.</p>

          <div class="back-section">
            <a [routerLink]="backLink()" class="back-link">
              <i class="pi pi-arrow-left"></i>
              <span i18n>Retour</span>
            </a>
          </div>
        </div>
      </section>
    </ng-template>
  `,
  styleUrl: './tool.component.scss',
})
export class ToolComponent {
  toolComponent = signal<Type<unknown> | null>(null);
  editorial = signal<ToolEditorialModel | null>(null);
  isLoading = signal(true);

  private categoryId = '';
  private groupId = '';
  private toolId = '';

  constructor(
    route: ActivatedRoute,
    registry: ToolRegistryService,
    editorialService: ToolEditorialService
  ) {
    const categoryRaw =
      route.snapshot.paramMap.get('idCategory') ??
      route.snapshot.paramMap.get('category') ??
      route.snapshot.paramMap.get('cat') ??
      '';

    const group =
      route.snapshot.paramMap.get('idGroup') ??
      route.snapshot.paramMap.get('group') ??
      '';

    const tool =
      route.snapshot.paramMap.get('idTool') ??
      route.snapshot.paramMap.get('tool') ??
      '';

    this.categoryId = categoryRaw;
    this.groupId = group;
    this.toolId = tool;

    const category = this.toCategoryId(categoryRaw);

    if (!category || !group || !tool) {
      this.toolComponent.set(null);
      this.editorial.set(null);
      this.isLoading.set(false);
      return;
    }

    Promise.all([
      registry.loadToolComponent({ category, group, tool }),
      editorialService.loadEditorial({ category, group, tool }),
    ])
      .then(([cmp, ed]) => {
        this.toolComponent.set(cmp);
        this.editorial.set(ed);
        this.isLoading.set(false);
      })
      .catch(() => {
        this.toolComponent.set(null);
        this.editorial.set(null);
        this.isLoading.set(false);
      });
  }

  backLink(): string {
    if (this.categoryId && this.groupId) return routes.group(this.categoryId, this.groupId);
    if (this.categoryId) return routes.category(this.categoryId);
    return '/';
  }

  private toCategoryId(v: string): CategoryId | null {
    return CATEGORIES.some(c => c.id === v) ? (v as CategoryId) : null;
  }
}
