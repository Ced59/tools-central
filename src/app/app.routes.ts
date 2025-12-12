import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/pages/home/home.component').then(m => m.HomeComponent) },

  { path: 'categories', loadComponent: () => import('./components/pages/categories/categories.component').then(m => m.CategoriesComponent) },

  // Outil (le wrapper)
  { path: 'categories/:idCategory/:idTool', loadComponent: () => import('./components/pages/tools/tool/tool.component').then(m => m.ToolComponent) },

  // Liste des tools d’une catégorie
  {
    path: 'categories/:idCategory',
    loadComponent: () =>
      import('./components/pages/category/category.component').then(m => m.CategoryComponent),
  },

  { path: '**', redirectTo: '' },
];
