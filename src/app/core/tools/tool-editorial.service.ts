import { Injectable } from '@angular/core';

import type { ToolEditorialModel } from '../../models/tool-editorial/tool-editorial.model';
import { EDITORIAL_REGISTRY } from '../../data/editorials/editorials.registry';

@Injectable({ providedIn: 'root' })
export class ToolEditorialService {
  async loadEditorial(params: { category: string; group: string; tool: string }): Promise<ToolEditorialModel | null> {
    const key = `${params.category}/${params.group}/${params.tool}`;
    const entry = EDITORIAL_REGISTRY[key];

    // 1) Pas d'éditorial référencé
    if (!entry) return null;

    // 2) Présent mais non prêt (editorialReady=false => registry.available=false)
    if (!entry.available) return null;

    try {
      const mod = await entry.load();

      // sécurité : module mal formé / absent
      if (!mod?.editorial) return null;

      return mod.editorial;
    } catch {
      // chunk manquant / erreur import => on n'affiche pas
      return null;
    }
  }
}
