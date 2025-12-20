import type { CategoryId } from './categories';

export const routes = {
  categories: '/categories',
  category: (id: CategoryId | string) => `/categories/${id}`,
  group: (cat: CategoryId | string, group: string) => `/categories/${cat}/${group}`,
  tool: (cat: CategoryId | string, group: string, tool: string) =>
    `/categories/${cat}/${group}/${tool}`,
} as const;
