export interface LocalePublishedTool {
  available: boolean;
  reviewedLocales?: readonly string[];
}

export function isToolPublishedForLocale(
  tool: LocalePublishedTool,
  locale: string,
): boolean {
  if (!tool.available) return false;
  if (!tool.reviewedLocales) return true;

  const normalizedLocale = locale.replace(/_/gu, '-').toLowerCase();
  return tool.reviewedLocales.some((reviewedLocale) => {
    const normalizedReviewedLocale = reviewedLocale.toLowerCase();
    return normalizedLocale === normalizedReviewedLocale
      || (!normalizedReviewedLocale.includes('-')
        && normalizedLocale.startsWith(`${normalizedReviewedLocale}-`));
  });
}
