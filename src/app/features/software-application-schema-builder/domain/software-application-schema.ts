export const SOFTWARE_APPLICATION_MAX_URL_LENGTH = 2_048;
export const SOFTWARE_APPLICATION_MAX_NAME_LENGTH = 200;
export const SOFTWARE_APPLICATION_MAX_DESCRIPTION_LENGTH = 2_000;
export const SOFTWARE_APPLICATION_MAX_OPERATING_SYSTEM_LENGTH = 200;
export const SOFTWARE_APPLICATION_MAX_VERSION_LENGTH = 100;
export const SOFTWARE_APPLICATION_MAX_PRICE = 999_999_999.99;
export const SOFTWARE_APPLICATION_MAX_RATING_COUNT = 9_007_199_254_740_991;

// SIX ISO 4217 Maintenance Agency, List One (current currencies and funds), published 2026-01-01.
// https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml
const ISO_4217_CURRENCY_CODES = new Set([
  'AED', 'AFN', 'ALL', 'AMD', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT',
  'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BOV', 'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD',
  'CAD', 'CDF', 'CHE', 'CHF', 'CHW', 'CLF', 'CLP', 'CNY', 'COP', 'COU', 'CRC', 'CUP',
  'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP',
  'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HTG', 'HUF',
  'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR',
  'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD',
  'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN',
  'MXV', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN',
  'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD',
  'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP',
  'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX',
  'USD', 'USN', 'UYI', 'UYU', 'UYW', 'UZS', 'VED', 'VES', 'VND', 'VUV', 'WST', 'XAD',
  'XAF', 'XAG', 'XAU', 'XBA', 'XBB', 'XBC', 'XBD', 'XCD', 'XCG', 'XDR', 'XOF', 'XPD',
  'XPF', 'XPT', 'XSU', 'XTS', 'XUA', 'XXX', 'YER', 'ZAR', 'ZMW', 'ZWG',
]);

export const SOFTWARE_APPLICATION_TYPES = [
  'SoftwareApplication',
  'WebApplication',
  'MobileApplication',
] as const;

export type SoftwareApplicationType = (typeof SOFTWARE_APPLICATION_TYPES)[number];

export const SOFTWARE_APPLICATION_CATEGORIES = [
  'GameApplication',
  'SocialNetworkingApplication',
  'TravelApplication',
  'ShoppingApplication',
  'SportsApplication',
  'LifestyleApplication',
  'BusinessApplication',
  'DesignApplication',
  'DeveloperApplication',
  'DriverApplication',
  'EducationalApplication',
  'HealthApplication',
  'FinanceApplication',
  'SecurityApplication',
  'BrowserApplication',
  'CommunicationApplication',
  'DesktopEnhancementApplication',
  'EntertainmentApplication',
  'MultimediaApplication',
  'HomeApplication',
  'UtilitiesApplication',
  'ReferenceApplication',
] as const;

export type SoftwareApplicationCategory = (typeof SOFTWARE_APPLICATION_CATEGORIES)[number];

export interface SoftwareApplicationSchemaInput {
  type: SoftwareApplicationType;
  name: string;
  description: string;
  url: string;
  screenshotUrl: string;
  applicationCategory: SoftwareApplicationCategory | '';
  operatingSystem: string;
  softwareVersion: string;
  price: string;
  priceCurrency: string;
  includeAggregateRating: boolean;
  ratingValue: string;
  ratingCount: string;
  bestRating: string;
  worstRating: string;
}

export type SoftwareApplicationSchemaIssueSeverity = 'error' | 'warning' | 'info';

export type SoftwareApplicationSchemaIssueCode =
  | 'missing-name'
  | 'name-too-long'
  | 'description-too-long'
  | 'operating-system-too-long'
  | 'version-too-long'
  | 'invalid-url'
  | 'url-credentials'
  | 'url-fragment'
  | 'invalid-screenshot-url'
  | 'screenshot-url-credentials'
  | 'invalid-price'
  | 'price-too-large'
  | 'missing-price-currency'
  | 'invalid-price-currency'
  | 'missing-aggregate-rating'
  | 'invalid-rating-value'
  | 'invalid-rating-count'
  | 'invalid-rating-scale'
  | 'rating-out-of-range'
  | 'missing-application-category'
  | 'missing-operating-system';

export type SoftwareApplicationSchemaField =
  | 'name'
  | 'description'
  | 'url'
  | 'screenshotUrl'
  | 'applicationCategory'
  | 'operatingSystem'
  | 'softwareVersion'
  | 'price'
  | 'priceCurrency'
  | 'ratingValue'
  | 'ratingCount'
  | 'ratingScale';

export interface SoftwareApplicationSchemaIssue {
  code: SoftwareApplicationSchemaIssueCode;
  severity: SoftwareApplicationSchemaIssueSeverity;
  field: SoftwareApplicationSchemaField;
  detail: string;
}

export type SoftwareApplicationSchemaState = 'invalid' | 'schema-valid' | 'google-ready';

export interface SoftwareApplicationSchemaResult {
  schema: Readonly<Record<string, unknown>> | null;
  jsonLd: string;
  scriptTag: string;
  issues: SoftwareApplicationSchemaIssue[];
  state: SoftwareApplicationSchemaState;
}

interface ValidatedAggregateRating {
  ratingValue: number;
  ratingCount: number;
  bestRating: number;
  worstRating: number;
}

export function buildSoftwareApplicationSchema(input: SoftwareApplicationSchemaInput): SoftwareApplicationSchemaResult {
  const issues: SoftwareApplicationSchemaIssue[] = [];
  const name = input.name.trim();
  const description = input.description.trim();
  const operatingSystem = input.operatingSystem.trim();
  const softwareVersion = input.softwareVersion.trim();

  if (!name) issues.push(issue('missing-name', 'error', 'name'));
  else if (name.length > SOFTWARE_APPLICATION_MAX_NAME_LENGTH) {
    issues.push(issue('name-too-long', 'error', 'name', String(name.length)));
  }
  if (description.length > SOFTWARE_APPLICATION_MAX_DESCRIPTION_LENGTH) {
    issues.push(issue('description-too-long', 'error', 'description', String(description.length)));
  }
  if (operatingSystem.length > SOFTWARE_APPLICATION_MAX_OPERATING_SYSTEM_LENGTH) {
    issues.push(issue('operating-system-too-long', 'error', 'operatingSystem', String(operatingSystem.length)));
  }
  if (softwareVersion.length > SOFTWARE_APPLICATION_MAX_VERSION_LENGTH) {
    issues.push(issue('version-too-long', 'error', 'softwareVersion', String(softwareVersion.length)));
  }

  const url = validateUrl(input.url, 'url', issues);
  const screenshotUrl = validateUrl(input.screenshotUrl, 'screenshotUrl', issues);
  const price = parseDecimal(input.price, 2);
  if (price === null || price < 0) issues.push(issue('invalid-price', 'error', 'price', input.price.trim()));
  else if (price > SOFTWARE_APPLICATION_MAX_PRICE) {
    issues.push(issue('price-too-large', 'error', 'price', input.price.trim()));
  }

  const priceCurrency = input.priceCurrency.trim().toUpperCase();
  if (priceCurrency && !ISO_4217_CURRENCY_CODES.has(priceCurrency)) {
    issues.push(issue('invalid-price-currency', 'error', 'priceCurrency', priceCurrency));
  } else if (price !== null && price > 0 && !priceCurrency) {
    issues.push(issue('missing-price-currency', 'warning', 'priceCurrency'));
  }

  if (!input.applicationCategory) {
    issues.push(issue('missing-application-category', 'warning', 'applicationCategory'));
  }
  if (!operatingSystem) issues.push(issue('missing-operating-system', 'warning', 'operatingSystem'));

  const aggregateRating = input.includeAggregateRating
    ? validateAggregateRating(input, issues)
    : null;
  if (!input.includeAggregateRating) {
    issues.push(issue('missing-aggregate-rating', 'warning', 'ratingValue'));
  }

  if (issues.some(item => item.severity === 'error')) {
    return { schema: null, jsonLd: '', scriptTag: '', issues, state: 'invalid' };
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': input.type,
    name,
  };
  if (description) schema['description'] = description;
  if (url) schema['url'] = url;
  if (screenshotUrl) schema['screenshot'] = screenshotUrl;
  if (input.applicationCategory) schema['applicationCategory'] = input.applicationCategory;
  if (operatingSystem) schema['operatingSystem'] = operatingSystem;
  if (softwareVersion) schema['softwareVersion'] = softwareVersion;
  schema['offers'] = {
    '@type': 'Offer',
    price,
    ...(priceCurrency ? { priceCurrency } : {}),
  };
  if (aggregateRating) {
    schema['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      ratingCount: aggregateRating.ratingCount,
      bestRating: aggregateRating.bestRating,
      worstRating: aggregateRating.worstRating,
    };
  }

  const jsonLd = JSON.stringify(schema, null, 2);
  const scriptSafeJson = jsonLd.replace(/</gu, '\\u003C');
  const state: SoftwareApplicationSchemaState = aggregateRating ? 'google-ready' : 'schema-valid';
  return {
    schema,
    jsonLd,
    scriptTag: `<script type="application/ld+json">\n${scriptSafeJson}\n</script>`,
    issues,
    state,
  };
}

function validateAggregateRating(
  input: SoftwareApplicationSchemaInput,
  issues: SoftwareApplicationSchemaIssue[],
): ValidatedAggregateRating | null {
  const ratingValue = parseDecimal(input.ratingValue, 2);
  const ratingCount = parseInteger(input.ratingCount);
  const bestRating = parseDecimal(input.bestRating, 2);
  const worstRating = parseDecimal(input.worstRating, 2);

  if (ratingValue === null) {
    issues.push(issue('invalid-rating-value', 'error', 'ratingValue', input.ratingValue.trim()));
  }
  if (ratingCount === null || ratingCount < 1 || ratingCount > SOFTWARE_APPLICATION_MAX_RATING_COUNT) {
    issues.push(issue('invalid-rating-count', 'error', 'ratingCount', input.ratingCount.trim()));
  }
  if (bestRating === null || worstRating === null || bestRating <= worstRating) {
    issues.push(issue('invalid-rating-scale', 'error', 'ratingScale', `${input.worstRating.trim()}–${input.bestRating.trim()}`));
  } else if (ratingValue !== null && (ratingValue < worstRating || ratingValue > bestRating)) {
    issues.push(issue('rating-out-of-range', 'error', 'ratingValue', input.ratingValue.trim()));
  }

  return ratingValue !== null && ratingCount !== null && ratingCount >= 1
    && ratingCount <= SOFTWARE_APPLICATION_MAX_RATING_COUNT && bestRating !== null
    && worstRating !== null && bestRating > worstRating
    && ratingValue >= worstRating && ratingValue <= bestRating
    ? { ratingValue, ratingCount, bestRating, worstRating }
    : null;
}

function validateUrl(
  source: string,
  field: 'url' | 'screenshotUrl',
  issues: SoftwareApplicationSchemaIssue[],
): string | null {
  const value = source.trim();
  if (!value) return null;
  if (value.length > SOFTWARE_APPLICATION_MAX_URL_LENGTH) {
    issues.push(issue(field === 'url' ? 'invalid-url' : 'invalid-screenshot-url', 'error', field, value));
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      issues.push(issue(field === 'url' ? 'invalid-url' : 'invalid-screenshot-url', 'error', field, value));
      return null;
    }
    if (url.username || url.password) {
      issues.push(issue(field === 'url' ? 'url-credentials' : 'screenshot-url-credentials', 'error', field, value));
      return null;
    }
    if (field === 'url' && url.hash) issues.push(issue('url-fragment', 'warning', field, url.hash));
    return url.href;
  } catch {
    issues.push(issue(field === 'url' ? 'invalid-url' : 'invalid-screenshot-url', 'error', field, value));
    return null;
  }
}

function parseDecimal(source: string, maximumDecimalPlaces: number): number | null {
  const value = source.trim();
  const pattern = new RegExp(`^(?:0|[1-9]\\d*)(?:[.,]\\d{1,${String(maximumDecimalPlaces)}})?$`, 'u');
  if (!pattern.test(value)) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(source: string): number | null {
  const value = source.trim();
  if (!/^(?:0|[1-9]\d*)$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function issue(
  code: SoftwareApplicationSchemaIssueCode,
  severity: SoftwareApplicationSchemaIssueSeverity,
  field: SoftwareApplicationSchemaField,
  detail = '',
): SoftwareApplicationSchemaIssue {
  return { code, severity, field, detail };
}
