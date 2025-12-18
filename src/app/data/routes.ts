export const routes = {
  categories: '/categories',
  category: (id: string) => `/categories/${id}`,
  group: (cat: string, group: string) => `/categories/${cat}/${group}`,
  tool: (cat: string, group: string, tool: string) => `/categories/${cat}/${group}/${tool}`,
} as const;
