export type SerpDevice = 'desktop' | 'mobile';

export type SerpLengthStatus =
  | 'missing'
  | 'concise'
  | 'balanced'
  | 'likely-truncated';

export type SerpRecommendation =
  | 'title-missing'
  | 'title-short'
  | 'title-long'
  | 'description-missing'
  | 'description-short'
  | 'description-long'
  | 'url-invalid'
  | 'ready';

export interface SerpSnippetInput {
  siteName: string;
  url: string;
  title: string;
  description: string;
  device: SerpDevice;
}

export interface SerpFieldAnalysis {
  characters: number;
  estimatedPixels: number;
  maximumPixels: number;
  usageRatio: number;
  status: SerpLengthStatus;
  preview: string;
}

export interface SerpSnippetAnalysis {
  siteName: string;
  siteInitial: string;
  displayUrl: string;
  urlValid: boolean;
  title: SerpFieldAnalysis;
  description: SerpFieldAnalysis;
  recommendations: SerpRecommendation[];
}

type DeviceLimits = {
  title: { concise: number; maximum: number };
  description: { concise: number; maximum: number };
};

const LIMITS: Record<SerpDevice, DeviceLimits> = {
  desktop: {
    title: { concise: 250, maximum: 580 },
    description: { concise: 420, maximum: 920 },
  },
  mobile: {
    title: { concise: 220, maximum: 520 },
    description: { concise: 320, maximum: 680 },
  },
};

const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const WIDE_CYRILLIC_GLYPHS = new Set(Array.from('ЖМФШЩЪЫЮжмфшщъыю'));

export function analyzeSerpSnippet(input: SerpSnippetInput): SerpSnippetAnalysis {
  const siteName = normalizeCollapsibleWhitespace(input.siteName);
  const title = normalizeCollapsibleWhitespace(input.title);
  const description = normalizeCollapsibleWhitespace(input.description);
  const parsedUrl = parseDisplayUrl(input.url);
  const limits = LIMITS[input.device];
  const titleAnalysis = analyzeField(title, limits.title, 20);
  const descriptionAnalysis = analyzeField(description, limits.description, 14);
  const recommendations = buildRecommendations(
    titleAnalysis.status,
    descriptionAnalysis.status,
    parsedUrl.valid,
  );

  return {
    siteName,
    siteInitial: segmentGraphemes(siteName)[0] ?? '',
    displayUrl: parsedUrl.display,
    urlValid: parsedUrl.valid,
    title: titleAnalysis,
    description: descriptionAnalysis,
    recommendations,
  };
}

function normalizeCollapsibleWhitespace(value: string): string {
  return value.replace(/[ \t\n\f\r]+/g, ' ').replace(/^ +| +$/g, '');
}

function analyzeField(
  value: string,
  limits: { concise: number; maximum: number },
  fontSize: number,
): SerpFieldAnalysis {
  const estimatedPixels = estimateTextWidth(value, fontSize);
  const status = getStatus(value, estimatedPixels, limits);

  return {
    characters: segmentGraphemes(value).length,
    estimatedPixels,
    maximumPixels: limits.maximum,
    usageRatio: value ? Math.min(estimatedPixels / limits.maximum, 1) : 0,
    status,
    preview: truncateToWidth(value, limits.maximum, fontSize),
  };
}

function getStatus(
  value: string,
  estimatedPixels: number,
  limits: { concise: number; maximum: number },
): SerpLengthStatus {
  if (!value) return 'missing';
  if (estimatedPixels > limits.maximum) return 'likely-truncated';
  if (estimatedPixels < limits.concise) return 'concise';
  return 'balanced';
}

function buildRecommendations(
  titleStatus: SerpLengthStatus,
  descriptionStatus: SerpLengthStatus,
  urlValid: boolean,
): SerpRecommendation[] {
  const recommendations: SerpRecommendation[] = [];

  if (titleStatus === 'missing') recommendations.push('title-missing');
  if (titleStatus === 'concise') recommendations.push('title-short');
  if (titleStatus === 'likely-truncated') recommendations.push('title-long');
  if (descriptionStatus === 'missing') recommendations.push('description-missing');
  if (descriptionStatus === 'concise') recommendations.push('description-short');
  if (descriptionStatus === 'likely-truncated') recommendations.push('description-long');
  if (!urlValid) recommendations.push('url-invalid');
  if (!recommendations.length) recommendations.push('ready');

  return recommendations;
}

function parseDisplayUrl(rawUrl: string): { display: string; valid: boolean } {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { display: '', valid: false };

  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    const hostname = parsed.hostname.replace(/\.$/, '');
    if (!['http:', 'https:'].includes(parsed.protocol) || !isValidDomainName(hostname)) {
      return { display: trimmed, valid: false };
    }

    const host = hostname.replace(/^www\./i, '');
    const path = parsed.pathname
      .split('/')
      .filter(Boolean)
      .map(decodePathSegment)
      .map(segment => segment.replace(/[-_]+/g, ' '))
      .join(' › ');

    return {
      display: path ? `${host} › ${path}` : host,
      valid: true,
    };
  } catch {
    return { display: trimmed, valid: false };
  }
}

function isValidDomainName(hostname: string): boolean {
  if (hostname.length > 253) return false;

  const labels = hostname.split('.');
  return labels.length >= 2 && labels.every(label => (
    label.length >= 1
    && label.length <= 63
    && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
  ));
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Stable, SSR-safe approximation of Arial text width. The browser preview uses
 * the same scale, so the result stays deterministic across locales and devices.
 */
export function estimateTextWidth(value: string, fontSize: number): number {
  return Math.round(estimateTextWidthEm(value) * fontSize * 1.04);
}

function estimateTextWidthEm(value: string): number {
  let em = 0;
  for (const grapheme of segmentGraphemes(value)) {
    em += estimateGraphemeWidthEm(grapheme);
  }
  return em;
}

function estimateGraphemeWidthEm(grapheme: string): number {
  if (/\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(grapheme)) return 1;
  if (isEastAsianFullWidth(grapheme)) return 1;

  let em = 0;
  for (const character of grapheme) {
    if (/\p{Mark}|\u200d|\ufe0f/u.test(character)) continue;
    if (/\s/u.test(character)) em += 0.28;
    else if (/[ilI1|.,'`:;]/u.test(character)) em += 0.3;
    else if (WIDE_CYRILLIC_GLYPHS.has(character)) em += 0.92;
    else if (/[mwMW@%#&]/u.test(character)) em += 0.86;
    else if (/\p{Script=Cyrillic}/u.test(character)) em += /\p{Uppercase_Letter}/u.test(character) ? 0.68 : 0.56;
    else if (/[A-ZÀ-Þ]/u.test(character)) em += 0.66;
    else if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(character)) em += 1;
    else em += 0.52;
  }
  return em;
}

function isEastAsianFullWidth(grapheme: string): boolean {
  return Array.from(grapheme).some(character => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint >= 0x1100 && (
      codePoint <= 0x115f
      || codePoint === 0x2329
      || codePoint === 0x232a
      || (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f)
      || (codePoint >= 0xac00 && codePoint <= 0xd7a3)
      || (codePoint >= 0xf900 && codePoint <= 0xfaff)
      || (codePoint >= 0xfe10 && codePoint <= 0xfe19)
      || (codePoint >= 0xfe30 && codePoint <= 0xfe6f)
      || (codePoint >= 0xff01 && codePoint <= 0xff60)
      || (codePoint >= 0xffe0 && codePoint <= 0xffe6)
      || (codePoint >= 0x1b000 && codePoint <= 0x1b001)
      || (codePoint >= 0x1f200 && codePoint <= 0x1f251)
      || (codePoint >= 0x20000 && codePoint <= 0x3fffd)
    );
  });
}

function truncateToWidth(value: string, maximumPixels: number, fontSize: number): string {
  if (estimateTextWidth(value, fontSize) <= maximumPixels) return value;

  const ellipsis = '…';
  const maximumEm = maximumPixels / (fontSize * 1.04);
  const availableEm = Math.max(0, maximumEm - estimateTextWidthEm(ellipsis));
  const accepted: string[] = [];
  let usedEm = 0;

  for (const grapheme of segmentGraphemes(value)) {
    const graphemeEm = estimateGraphemeWidthEm(grapheme);
    if (usedEm + graphemeEm > availableEm) break;
    accepted.push(grapheme);
    usedEm += graphemeEm;
  }

  return `${accepted.join('').replace(/ +$/g, '')}${ellipsis}`;
}

function segmentGraphemes(value: string): string[] {
  return Array.from(GRAPHEME_SEGMENTER.segment(value), segment => segment.segment);
}
