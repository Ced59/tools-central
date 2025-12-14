import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/pages/home/home.component').then(m => m.HomeComponent) },

  { path: 'categories', loadComponent: () => import('./components/pages/categories/categories.component').then(m => m.CategoriesComponent) },

  // Outil atomique (wrapper) - 3 segments
  {
    path: 'categories/:idCategory/:idGroup/:idTool',
    loadComponent: () => import('./components/pages/tools/tool/tool.component').then(m => m.ToolComponent),
  },

  // Liste des tools atomiques d’un group (sous-catégorie) - 2 segments
  {
    path: 'categories/:idCategory/:idGroup',
    loadComponent: () => import('./components/pages/tool-group/tool-group.component').then(m => m.ToolGroupComponent),
  },

  // Liste des groups d’une catégorie - 1 segment
  {
    path: 'categories/:idCategory',
    loadComponent: () => import('./components/pages/category/category.component').then(m => m.CategoryComponent),
  },

  { path: '**', redirectTo: '' },
];
