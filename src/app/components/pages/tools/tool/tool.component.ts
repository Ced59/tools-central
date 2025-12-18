import { Component, Type } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgComponentOutlet, NgIf } from '@angular/common';

import {ATOMIC_TOOLS} from "../../../../data/atomic-tools";
import {
  PercentageVariationToolComponent
} from "../math/percentages/percentage-variation-tool/percentage-variation-tool.component";
import {
  PercentageOfNumberToolComponent
} from "../math/percentages/percentage-of-number-tool/percentage-of-number-tool.component";
import {TextCaseToolComponent} from "../text/case/text-case-tool/text-case-tool.component";



// Registry: (categoryId/toolId) -> composant
// Registry: category -> group -> tool -> component
const TOOL_COMPONENTS: Record<string, Record<string, Record<string, Type<unknown>>>> = {
  math: {
    percentages: {
      'percentage-variation': PercentageVariationToolComponent,
      'percentage-of-number': PercentageOfNumberToolComponent
    },
  },
  text: {
    case: {
      'text-case': TextCaseToolComponent,
    },
  },
};

@Component({
  standalone: true,
  imports: [NgIf, NgComponentOutlet],
  template: `
    <ng-container *ngIf="toolComponent; else notFound">
      <!--
        Important: ne pas envelopper les tools dans un .container ici.
        Chaque tool gère son propre layout (hero full-bleed + contenu en .container).
      -->
      <ng-container *ngComponentOutlet="toolComponent"></ng-container>
    </ng-container>

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
    .notfound { padding: 4rem 0; }
  `]
})
export class ToolComponent {
  toolComponent: Type<unknown> | null = null;

  constructor(route: ActivatedRoute) {
    const idCategory = route.snapshot.paramMap.get('idCategory') ?? '';
    const idGroup = route.snapshot.paramMap.get('idGroup') ?? '';
    const idTool = route.snapshot.paramMap.get('idTool') ?? '';

    // 1️⃣ Vérifie que l’outil existe et est disponible
    const tool = ATOMIC_TOOLS.find(t =>
      t.category === idCategory &&
      t.group === idGroup &&
      t.id === idTool
    );

    if (!tool || !tool.available) {
      this.toolComponent = null;
      return;
    }

    // 2️⃣ Résout le composant métier réel
    this.toolComponent =
      TOOL_COMPONENTS[idCategory]?.[idGroup]?.[idTool] ?? null;
  }
}
