import { inject, LOCALE_ID } from '@angular/core';
import {
  PrerenderFallback,
  RenderMode,
  ServerRoute,
} from '@angular/ssr';
import { CATALOG } from './data/catalog';
import { isToolPublishedForLocale } from './data/catalog/publication';

function categoryParams(): Array<Record<string, string>> {
  return Object.entries(CATALOG)
    .filter(([, category]) => category.available)
    .map(([idCategory]) => ({ idCategory }));
}

function groupParams(): Array<Record<string, string>> {
  return Object.entries(CATALOG).flatMap(([idCategory, category]) => {
    if (!category.available) return [];

    return Object.entries(category.groups)
      .filter(([, group]) => group.available)
      .map(([idGroup]) => ({ idCategory, idGroup }));
  });
}

export function toolParams(locale: string): Array<Record<string, string>> {
  return Object.entries(CATALOG).flatMap(([idCategory, category]) => {
    if (!category.available) return [];

    return Object.entries(category.groups).flatMap(([idGroup, group]) => {
      if (!group.available) return [];

      return Object.values(group.subGroups).flatMap((subGroup) =>
        Object.entries(subGroup.tools)
          .filter(([, tool]) => isToolPublishedForLocale(tool, locale) && tool.loadComponent)
          .map(([idTool]) => ({ idCategory, idGroup, idTool })),
      );
    });
  });
}

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'categories', renderMode: RenderMode.Prerender },
  { path: 'legal-notice', renderMode: RenderMode.Prerender },
  { path: 'privacy-policy', renderMode: RenderMode.Prerender },
  { path: 'cookies-policy', renderMode: RenderMode.Prerender },
  { path: '404', renderMode: RenderMode.Prerender },
  {
    path: 'categories/:idCategory/:idGroup/:idTool',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    getPrerenderParams: async () => toolParams(inject(LOCALE_ID)),
  },
  {
    path: 'categories/:idCategory/:idGroup',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    getPrerenderParams: async () => groupParams(),
  },
  {
    path: 'categories/:idCategory',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    getPrerenderParams: async () => categoryParams(),
  },
  { path: '**', renderMode: RenderMode.Client },
];
