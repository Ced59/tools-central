import { Component, Type } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgComponentOutlet, NgIf } from '@angular/common';


import {PercentagesToolComponent} from "../math/percentages/percentages.component";
import {TOOLS} from "../../../../data/tools";


// Registry: (categoryId/toolId) -> composant
const TOOL_COMPONENTS: Record<string, Record<string, Type<unknown>>> = {
  math: {
    percentages: PercentagesToolComponent,
  },
};

@Component({
  standalone: true,
  imports: [NgIf, NgComponentOutlet],
  template: `
    <section class="tool-page">
      <div class="container">
        <ng-container *ngIf="toolComponent; else notFound">
          <ng-container *ngComponentOutlet="toolComponent"></ng-container>
        </ng-container>

        <ng-template #notFound>
          <h1 i18n>Outil indisponible</h1>
          <p i18n>Cet outil n'existe pas ou n'est pas encore disponible.</p>
        </ng-template>
      </div>
    </section>
  `,
  styles: [`
    .tool-page { padding: 4rem 0; }
  `]
})
export class ToolComponent {
  toolComponent: Type<unknown> | null = null;

  constructor(route: ActivatedRoute) {
    const idCategory = route.snapshot.paramMap.get('idCategory') ?? '';
    const idTool = route.snapshot.paramMap.get('idTool') ?? '';

    // Optionnel: vérifier l’existence dans TOOLS + available
    const tool = TOOLS.find(t => t.category === idCategory && t.id === idTool);
    if (!tool || !tool.available) {
      this.toolComponent = null;
      return;
    }

    this.toolComponent = TOOL_COMPONENTS[idCategory]?.[idTool] ?? null;
  }
}
