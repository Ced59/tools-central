import { Component, Type, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgComponentOutlet, NgIf } from '@angular/common';
import { ToolRegistryService } from '../../../../core/tools/tool-registry.service';

@Component({
  standalone: true,
  imports: [NgIf, NgComponentOutlet],
  template: `
    <ng-container *ngIf="isLoading(); else loaded">
      <section class="loading">
        <div class="container">
          <h1 i18n>Chargement…</h1>
          <p i18n>Nous préparons l’outil.</p>
        </div>
      </section>
    </ng-container>

    <ng-template #loaded>
      <ng-container *ngIf="toolComponent(); else notFound">
        <!-- Chaque tool gère son propre layout -->
        <ng-container *ngComponentOutlet="toolComponent()"></ng-container>
      </ng-container>
    </ng-template>

    <ng-template #notFound>
      <section class="notfound">
        <div class="container">
          <h1 i18n>Outil indisponible</h1>
          <p i18n>Cet outil n'existe pas ou n'est pas encore disponible.</p>
        </div>
      </section>
    </ng-template>
  `,
  styles: [`
    .notfound, .loading { padding: 4rem 0; }
  `]
})
export class ToolComponent {
  toolComponent = signal<Type<unknown> | null>(null);
  isLoading = signal(true);

  constructor(route: ActivatedRoute, registry: ToolRegistryService) {
    // ✅ Fallback : selon ton app.routes.ts, les params peuvent changer de nom.
    const category =
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

    registry.loadToolComponent({ category, group, tool }).then(cmp => {
      this.toolComponent.set(cmp);
      this.isLoading.set(false);
    });
  }
}
