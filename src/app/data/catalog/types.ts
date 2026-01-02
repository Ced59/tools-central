import { Type } from '@angular/core';

// =============================================================================
// Types du catalogue unifié - Single Source of Truth
// =============================================================================

/**
 * Définition d'un outil dans le catalogue.
 */
export interface CatalogToolDefinition {
  title: string;
  description: string;
  icon: string;
  available: boolean;
  loadComponent?: () => Promise<Type<unknown>>;
}

/**
 * Définition d'un sous-groupe dans le catalogue.
 */
export interface CatalogSubGroupDefinition {
  title: string;
  description: string;
  order: number;
  tools: Record<string, CatalogToolDefinition>;
}

/**
 * Définition d'un groupe dans le catalogue.
 */
export interface CatalogGroupDefinition {
  title: string;
  description: string;
  icon: string;
  available: boolean;
  subGroups: Record<string, CatalogSubGroupDefinition>;
}

/**
 * Définition d'une catégorie dans le catalogue.
 */
export interface CatalogCategoryDefinition {
  title: string;
  description: string;
  icon: string;
  available: boolean;
  groups: Record<string, CatalogGroupDefinition>;
}

/**
 * Le catalogue complet.
 */
export type CatalogDefinition = Record<string, CatalogCategoryDefinition>;
