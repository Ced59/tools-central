import type { ToolEditorialModel } from '../../models/tool-editorial/tool-editorial.model';

export type EditorialLoader = () => Promise<{ editorial: ToolEditorialModel; editorialReady?: boolean }>;

export interface EditorialRegistryEntry {
  available: boolean;
  load: EditorialLoader;
}

/**
 * AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
 * Run: npm run editorials:gen
 */
export const EDITORIAL_REGISTRY: Record<string, EditorialRegistryEntry> = {
  'dev/pdf/pdf-annotations-to-json': {
    available: true,
    load: () => import('./dev/pdf/pdf-annotations-to-json.editorial'),
  },
  'dev/pdf/pdf-attachments-extractor': {
    available: true,
    load: () => import('./dev/pdf/pdf-attachments-extractor.editorial'),
  },
  'dev/pdf/pdf-encryption-check': {
    available: true,
    load: () => import('./dev/pdf/pdf-encryption-check.editorial'),
  },
  'dev/pdf/pdf-flatten-forms': {
    available: true,
    load: () => import('./dev/pdf/pdf-flatten-forms.editorial'),
  },
  'dev/pdf/pdf-font-embedding-check': {
    available: true,
    load: () => import('./dev/pdf/pdf-font-embedding-check.editorial'),
  },
  'dev/pdf/pdf-fonts-to-json': {
    available: true,
    load: () => import('./dev/pdf/pdf-fonts-to-json.editorial'),
  },
  'dev/pdf/pdf-form-fields-to-json': {
    available: true,
    load: () => import('./dev/pdf/pdf-form-fields-to-json.editorial'),
  },
  'dev/pdf/pdf-images-to-json': {
    available: true,
    load: () => import('./dev/pdf/pdf-images-to-json.editorial'),
  },
  'dev/pdf/pdf-linearized-check': {
    available: true,
    load: () => import('./dev/pdf/pdf-linearized-check.editorial'),
  },
  'dev/pdf/pdf-links-extractor': {
    available: true,
    load: () => import('./dev/pdf/pdf-links-extractor.editorial'),
  },
  'dev/pdf/pdf-merge': {
    available: true,
    load: () => import('./dev/pdf/pdf-merge.editorial'),
  },
  'dev/pdf/pdf-metadata-to-json': {
    available: true,
    load: () => import('./dev/pdf/pdf-metadata-to-json.editorial'),
  },
  'dev/pdf/pdf-object-info-to-json': {
    available: true,
    load: () => import('./dev/pdf/pdf-object-info-to-json.editorial'),
  },
  'dev/pdf/pdf-outline-to-json': {
    available: true,
    load: () => import('./dev/pdf/pdf-outline-to-json.editorial'),
  },
  'dev/pdf/pdf-page-content-ops-to-json': {
    available: true,
    load: () => import('./dev/pdf/pdf-page-content-ops-to-json.editorial'),
  },
  'dev/pdf/pdf-pages-to-json': {
    available: true,
    load: () => import('./dev/pdf/pdf-pages-to-json.editorial'),
  },
  'dev/pdf/pdf-sanitize': {
    available: true,
    load: () => import('./dev/pdf/pdf-sanitize.editorial'),
  },
  'dev/pdf/pdf-scan-detector': {
    available: true,
    load: () => import('./dev/pdf/pdf-scan-detector.editorial'),
  },
  'dev/pdf/pdf-signatures-to-json': {
    available: true,
    load: () => import('./dev/pdf/pdf-signatures-to-json.editorial'),
  },
  'dev/pdf/pdf-split': {
    available: true,
    load: () => import('./dev/pdf/pdf-split.editorial'),
  },
  'dev/pdf/pdf-stream-decoder': {
    available: true,
    load: () => import('./dev/pdf/pdf-stream-decoder.editorial'),
  },
  'dev/pdf/pdf-text-structure-to-json': {
    available: true,
    load: () => import('./dev/pdf/pdf-text-structure-to-json.editorial'),
  },
  'dev/pdf/pdf-to-unicode-inspector': {
    available: true,
    load: () => import('./dev/pdf/pdf-to-unicode-inspector.editorial'),
  },
  'dev/pdf/pdf-xref-to-json': {
    available: true,
    load: () => import('./dev/pdf/pdf-xref-to-json.editorial'),
  },
  'math/fractions/decimal-to-fraction': {
    available: true,
    load: () => import('./math/fractions/decimal-to-fraction.editorial'),
  },
  'math/fractions/fraction-add': {
    available: true,
    load: () => import('./math/fractions/fraction-add.editorial'),
  },
  'math/fractions/fraction-compare': {
    available: true,
    load: () => import('./math/fractions/fraction-compare.editorial'),
  },
  'math/fractions/fraction-simplify': {
    available: true,
    load: () => import('./math/fractions/fraction-simplify.editorial'),
  },
  'math/fractions/fraction-to-decimal': {
    available: true,
    load: () => import('./math/fractions/fraction-to-decimal.editorial'),
  },
  'math/fractions/fraction-to-percent': {
    available: true,
    load: () => import('./math/fractions/fraction-to-percent.editorial'),
  },
  'math/fractions/fractions-percent-to-fraction': {
    available: true,
    load: () => import('./math/fractions/fractions-percent-to-fraction.editorial'),
  },
  'math/percentages/decimal-to-percent': {
    available: true,
    load: () => import('./math/percentages/decimal-to-percent.editorial'),
  },
  'math/percentages/difference-relative': {
    available: true,
    load: () => import('./math/percentages/difference-relative.editorial'),
  },
  'math/percentages/percent-coefficient-converter': {
    available: true,
    load: () => import('./math/percentages/percent-coefficient-converter.editorial'),
  },
  'math/percentages/percent-to-fraction': {
    available: true,
    load: () => import('./math/percentages/percent-to-fraction.editorial'),
  },
  'math/percentages/percentage-applied-rate': {
    available: true,
    load: () => import('./math/percentages/percentage-applied-rate.editorial'),
  },
  'math/percentages/percentage-compare': {
    available: true,
    load: () => import('./math/percentages/percentage-compare.editorial'),
  },
  'math/percentages/percentage-composition': {
    available: true,
    load: () => import('./math/percentages/percentage-composition.editorial'),
  },
  'math/percentages/percentage-course': {
    available: true,
    load: () => import('./math/percentages/percentage-course.editorial'),
  },
  'math/percentages/percentage-cumulative-vs-naive': {
    available: true,
    load: () => import('./math/percentages/percentage-cumulative-vs-naive.editorial'),
  },
  'math/percentages/percentage-equivalent': {
    available: true,
    load: () => import('./math/percentages/percentage-equivalent.editorial'),
  },
  'math/percentages/percentage-error': {
    available: true,
    load: () => import('./math/percentages/percentage-error.editorial'),
  },
  'math/percentages/percentage-exercises-generator': {
    available: true,
    load: () => import('./math/percentages/percentage-exercises-generator.editorial'),
  },
  'math/percentages/percentage-increase-decrease': {
    available: true,
    load: () => import('./math/percentages/percentage-increase-decrease.editorial'),
  },
  'math/percentages/percentage-limits': {
    available: true,
    load: () => import('./math/percentages/percentage-limits.editorial'),
  },
  'math/percentages/percentage-missing': {
    available: true,
    load: () => import('./math/percentages/percentage-missing.editorial'),
  },
  'math/percentages/percentage-of-number': {
    available: true,
    load: () => import('./math/percentages/percentage-of-number.editorial'),
  },
  'math/percentages/percentage-of-total': {
    available: true,
    load: () => import('./math/percentages/percentage-of-total.editorial'),
  },
  'math/percentages/percentage-part-of-total': {
    available: true,
    load: () => import('./math/percentages/percentage-part-of-total.editorial'),
  },
  'math/percentages/percentage-points': {
    available: true,
    load: () => import('./math/percentages/percentage-points.editorial'),
  },
  'math/percentages/percentage-ratio': {
    available: true,
    load: () => import('./math/percentages/percentage-ratio.editorial'),
  },
  'math/percentages/percentage-relative-difference': {
    available: true,
    load: () => import('./math/percentages/percentage-relative-difference.editorial'),
  },
  'math/percentages/percentage-reverse': {
    available: true,
    load: () => import('./math/percentages/percentage-reverse.editorial'),
  },
  'math/percentages/percentage-share-of-total': {
    available: true,
    load: () => import('./math/percentages/percentage-share-of-total.editorial'),
  },
  'math/percentages/percentage-successive': {
    available: true,
    load: () => import('./math/percentages/percentage-successive.editorial'),
  },
  'math/percentages/percentage-variation': {
    available: true,
    load: () => import('./math/percentages/percentage-variation.editorial'),
  },
  'math/percentages/percentage-weighted': {
    available: true,
    load: () => import('./math/percentages/percentage-weighted.editorial'),
  },
  'math/percentages/percentage-what-percent': {
    available: true,
    load: () => import('./math/percentages/percentage-what-percent.editorial'),
  },
  'math/ratios/direct-proportionality': {
    available: true,
    load: () => import('./math/ratios/direct-proportionality.editorial'),
  },
  'math/ratios/inverse-proportionality': {
    available: true,
    load: () => import('./math/ratios/inverse-proportionality.editorial'),
  },
  'math/ratios/proportion-a-over-b-equals-c-over-d': {
    available: true,
    load: () => import('./math/ratios/proportion-a-over-b-equals-c-over-d.editorial'),
  },
  'math/ratios/proportional-share': {
    available: true,
    load: () => import('./math/ratios/proportional-share.editorial'),
  },
  'math/ratios/proportionality-check': {
    available: true,
    load: () => import('./math/ratios/proportionality-check.editorial'),
  },
  'math/ratios/ratio-calculator': {
    available: true,
    load: () => import('./math/ratios/ratio-calculator.editorial'),
  },
  'math/ratios/ratio-compare': {
    available: true,
    load: () => import('./math/ratios/ratio-compare.editorial'),
  },
  'math/ratios/ratio-equivalent': {
    available: true,
    load: () => import('./math/ratios/ratio-equivalent.editorial'),
  },
  'math/ratios/ratio-missing': {
    available: true,
    load: () => import('./math/ratios/ratio-missing.editorial'),
  },
  'math/ratios/ratio-simplifier': {
    available: true,
    load: () => import('./math/ratios/ratio-simplifier.editorial'),
  },
  'math/ratios/ratio-to-fraction': {
    available: true,
    load: () => import('./math/ratios/ratio-to-fraction.editorial'),
  },
  'math/ratios/ratio-to-percent': {
    available: true,
    load: () => import('./math/ratios/ratio-to-percent.editorial'),
  },
  'math/rounding/absolute-vs-relative-difference': {
    available: true,
    load: () => import('./math/rounding/absolute-vs-relative-difference.editorial'),
  },
  'math/rounding/order-of-magnitude': {
    available: true,
    load: () => import('./math/rounding/order-of-magnitude.editorial'),
  },
  'math/rounding/round-tenth-hundredth': {
    available: true,
    load: () => import('./math/rounding/round-tenth-hundredth.editorial'),
  },
  'math/rounding/rounding-error': {
    available: true,
    load: () => import('./math/rounding/rounding-error.editorial'),
  },
  'math/rounding/significant-figures': {
    available: true,
    load: () => import('./math/rounding/significant-figures.editorial'),
  },
  'math/rounding/truncate': {
    available: false,
    load: () => import('./math/rounding/truncate.editorial'),
  },
  'math/rule-of-three/proportion-table-check': {
    available: true,
    load: () => import('./math/rule-of-three/proportion-table-check.editorial'),
  },
  'math/rule-of-three/proportion-table-complete': {
    available: true,
    load: () => import('./math/rule-of-three/proportion-table-complete.editorial'),
  },
  'math/rule-of-three/rule-of-three-course': {
    available: true,
    load: () => import('./math/rule-of-three/rule-of-three-course.editorial'),
  },
  'math/rule-of-three/rule-of-three-inverse': {
    available: true,
    load: () => import('./math/rule-of-three/rule-of-three-inverse.editorial'),
  },
  'math/rule-of-three/rule-of-three-missing-value': {
    available: true,
    load: () => import('./math/rule-of-three/rule-of-three-missing-value.editorial'),
  },
  'math/rule-of-three/rule-of-three-simple': {
    available: true,
    load: () => import('./math/rule-of-three/rule-of-three-simple.editorial'),
  },
  'math/rule-of-three/rule-of-three-table': {
    available: true,
    load: () => import('./math/rule-of-three/rule-of-three-table.editorial'),
  },
  'math/statistics/amplitude': {
    available: true,
    load: () => import('./math/statistics/amplitude.editorial'),
  },
  'math/statistics/mean': {
    available: true,
    load: () => import('./math/statistics/mean.editorial'),
  },
  'math/statistics/mean-course': {
    available: true,
    load: () => import('./math/statistics/mean-course.editorial'),
  },
  'math/statistics/mean-vs-median': {
    available: true,
    load: () => import('./math/statistics/mean-vs-median.editorial'),
  },
  'math/statistics/median': {
    available: true,
    load: () => import('./math/statistics/median.editorial'),
  },
  'math/statistics/median-course': {
    available: true,
    load: () => import('./math/statistics/median-course.editorial'),
  },
  'math/statistics/min-max': {
    available: true,
    load: () => import('./math/statistics/min-max.editorial'),
  },
  'math/statistics/misleading-mean': {
    available: true,
    load: () => import('./math/statistics/misleading-mean.editorial'),
  },
  'math/statistics/mode': {
    available: true,
    load: () => import('./math/statistics/mode.editorial'),
  },
  'math/statistics/outliers-effect': {
    available: true,
    load: () => import('./math/statistics/outliers-effect.editorial'),
  },
  'math/statistics/range': {
    available: true,
    load: () => import('./math/statistics/range.editorial'),
  },
  'math/statistics/weighted-mean': {
    available: true,
    load: () => import('./math/statistics/weighted-mean.editorial'),
  },
  'text/case/text-case': {
    available: true,
    load: () => import('./text/case/text-case.editorial'),
  },
  'text/writing/readability': {
    available: true,
    load: () => import('./text/writing/readability.editorial'),
  },
} as const;
