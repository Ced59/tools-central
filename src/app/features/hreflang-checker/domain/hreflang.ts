export const HREFLANG_MAX_SOURCE_CHARACTERS = 1_000_000;
export const HREFLANG_MAX_PAGES = 200;
export const HREFLANG_MAX_ALTERNATES_PER_PAGE = 100;

export type HreflangIssueSeverity = 'error' | 'warning' | 'info';

export type HreflangIssueCode =
  | 'source-too-large'
  | 'invalid-line'
  | 'missing-code'
  | 'invalid-code'
  | 'noncanonical-code'
  | 'missing-url'
  | 'invalid-url'
  | 'url-credentials'
  | 'url-fragment'
  | 'duplicate-code'
  | 'too-many-alternates'
  | 'missing-current-url'
  | 'invalid-current-url'
  | 'missing-self-reference'
  | 'missing-x-default'
  | 'missing-language-fallback'
  | 'same-url-multiple-codes'
  | 'invalid-page-header'
  | 'missing-canonical'
  | 'invalid-canonical'
  | 'canonical-mismatch'
  | 'empty-audit'
  | 'alternate-before-page'
  | 'duplicate-page'
  | 'too-many-pages'
  | 'target-page-not-provided'
  | 'missing-return-link'
  | 'inconsistent-set'
  | 'issues-truncated';

export interface HreflangIssue {
  code: HreflangIssueCode;
  severity: HreflangIssueSeverity;
  line: number | null;
  detail?: string;
  pageUrl?: string;
}

export interface HreflangEntry {
  code: string;
  url: string;
  line: number;
}

export interface HreflangSetAnalysis {
  currentUrl: string | null;
  entries: HreflangEntry[];
  issues: HreflangIssue[];
}

export interface HreflangOutputs {
  html: string;
  httpHeader: string;
  sitemapXml: string;
}

export interface HreflangAuditPage {
  url: string;
  canonicalUrl: string | null;
  line: number;
  entries: HreflangEntry[];
}

export interface HreflangAudit {
  pages: HreflangAuditPage[];
  linkCount: number;
  issues: HreflangIssue[];
}

type IssueSink = (issue: HreflangIssue) => void;

const MAX_REPORTED_ISSUES = 200;
const LANGUAGE_CODES = new Set(
  'aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu'.split(' '),
);
const REGION_CODES = new Set(
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' '),
);
// ISO 15924 registry snapshot, checked against the Unicode Registration Authority on 2026-09-14.
const SCRIPT_CODES = new Set(
  'Adlm Afak Aghb Ahom Arab Aran Armi Armn Avst Bali Bamu Bass Batk Beng Berf Bhks Blis Bopo Brah Brai Bugi Buhd Cakm Cans Cari Cham Cher Chis Chrs Cirt Copt Cpmn Cprt Cyrl Cyrs Deva Diak Dogr Dsrt Dupl Egyd Egyh Egyp Elba Elym Ethi Gara Geok Geor Glag Gong Gonm Goth Gran Grek Gujr Gukh Guru Hanb Hang Hani Hano Hans Hant Hatr Hebr Hira Hluw Hmng Hmnp Hntl Hrkt Hung Inds Ital Jamo Java Jpan Jurc Kali Kana Kawi Khar Khmr Khoj Kitl Kits Knda Kore Kpel Krai Kthi Lana Laoo Latf Latg Latn Leke Lepc Limb Lina Linb Lisu Loma Lyci Lydi Mahj Maka Mand Mani Marc Maya Medf Mend Merc Mero Mlym Modi Mong Moon Mroo Mtei Mult Mymr Nagm Nand Narb Nbat Newa Nkdb Nkgb Nkoo Nshu Ogam Olck Onao Orkh Orya Osge Osma Ougr Palm Pauc Pcun Pelm Perm Phag Phli Phlp Phlv Phnx Plrd Piqd Prti Psin Qaaa Qabx Ranj Rjng Rohg Roro Runr Samr Sara Sarb Saur Seal Sgnw Shaw Shrd Shui Sidd Sidt Sind Sinh Sogd Sogo Sora Soyo Sund Sunu Sylo Syrc Syre Syrj Syrn Tagb Takr Tale Talu Taml Tang Tavt Tayo Telu Teng Tfng Tglg Thaa Thai Tibt Tirh Tnsa Todr Tols Toto Tutg Ugar Vaii Visp Vith Wara Wcho Wole Xpeo Xsux Yezi Yiii Zanb Zinh Zmth Zsye Zsym Zxxx Zyyy Zzzz'.split(' '),
);
const CODE_PATTERN = /^([A-Za-z]{2})(?:-([A-Za-z]{4}))?(?:-([A-Za-z]{2}))?$/u;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;

export function analyzeHreflangSet(currentUrlSource: string, source: string): HreflangSetAnalysis {
  const issues: HreflangIssue[] = [];
  const addIssue = createIssueSink(issues);
  const limitedSource = limitSource(source, addIssue);
  const currentUrl = parsePageUrl(currentUrlSource, 0, addIssue, 'current');
  const entries = parseEntries(limitedSource.split(/\r\n|\n|\r/u), 1, addIssue);

  validateSet(currentUrl, entries, addIssue);
  return { currentUrl, entries, issues };
}

export function generateHreflangOutputs(analysis: HreflangSetAnalysis): HreflangOutputs {
  const html = analysis.entries
    .map(entry => `<link rel="alternate" hreflang="${escapeAttribute(entry.code)}" href="${escapeAttribute(entry.url)}" />`)
    .join('\n');
  const httpHeader = analysis.entries.length
    ? `Link: ${analysis.entries
      .map(entry => `<${entry.url}>; rel="alternate"; hreflang="${entry.code}"`)
      .join(',\n      ')}`
    : '';
  const sitemapLinks = analysis.entries
    .map(entry => `  <xhtml:link rel="alternate" hreflang="${escapeAttribute(entry.code)}" href="${escapeAttribute(entry.url)}" />`)
    .join('\n');
  const sitemapXml = analysis.currentUrl && sitemapLinks
    ? `<url>\n  <loc>${escapeText(analysis.currentUrl)}</loc>\n${sitemapLinks}\n</url>`
    : '';

  return { html, httpHeader, sitemapXml };
}

export function analyzeHreflangAudit(source: string): HreflangAudit {
  const issues: HreflangIssue[] = [];
  const addIssue = createIssueSink(issues);
  const lines = limitSource(source, addIssue).split(/\r\n|\n|\r/u);
  const pages: HreflangAuditPage[] = [];
  let currentPage: {
    url: string;
    canonicalUrl: string | null;
    line: number;
    entryLines: string[];
    firstEntryLine: number;
  } | null = null;

  const commitPage = (): void => {
    if (!currentPage) return;
    const page = currentPage;
    const entries = parseEntries(page.entryLines, page.firstEntryLine, issue => {
      addIssue({ ...issue, pageUrl: page.url });
    });
    if (entries.length > HREFLANG_MAX_ALTERNATES_PER_PAGE) {
      addIssue({
        code: 'too-many-alternates',
        severity: 'error',
        line: currentPage.line,
        detail: String(entries.length),
        pageUrl: currentPage.url,
      });
      entries.length = HREFLANG_MAX_ALTERNATES_PER_PAGE;
    }
    validateSet(page.url, entries, issue => {
      addIssue({ ...issue, pageUrl: page.url });
    });
    pages.push({
      url: currentPage.url,
      canonicalUrl: currentPage.canonicalUrl,
      line: currentPage.line,
      entries,
    });
    currentPage = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = index + 1;
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed === '---') {
      if (currentPage) currentPage.entryLines.push(rawLine);
      continue;
    }

    const pageMatch = /^PAGE\s+(.+)$/iu.exec(trimmed);
    if (pageMatch) {
      commitPage();
      if (pages.length >= HREFLANG_MAX_PAGES) {
        addIssue({ code: 'too-many-pages', severity: 'error', line, detail: String(HREFLANG_MAX_PAGES) });
        break;
      }
      const [pageUrlSource, canonicalSource] = splitHeader(pageMatch[1]);
      const pageUrl = parsePageUrl(pageUrlSource, line, addIssue, 'page');
      let canonicalUrl: string | null = null;
      if (!canonicalSource) {
        addIssue({ code: 'missing-canonical', severity: 'warning', line, detail: pageUrlSource.trim() });
      } else {
        canonicalUrl = parseCanonicalUrl(canonicalSource, line, addIssue);
        if (pageUrl && canonicalUrl && pageUrl !== canonicalUrl) {
          addIssue({
            code: 'canonical-mismatch',
            severity: 'warning',
            line,
            detail: canonicalUrl,
            pageUrl,
          });
        }
      }
      if (pageUrl) {
        currentPage = { url: pageUrl, canonicalUrl, line, entryLines: [], firstEntryLine: line + 1 };
      }
      continue;
    }

    if (/^PAGE(?:\s|$)/iu.test(trimmed)) {
      commitPage();
      addIssue({ code: 'invalid-page-header', severity: 'error', line, detail: trimmed });
      continue;
    }

    if (!currentPage) {
      addIssue({ code: 'alternate-before-page', severity: 'error', line, detail: trimmed });
      continue;
    }
    currentPage.entryLines.push(rawLine);
  }
  commitPage();

  if (!pages.length) {
    addIssue({ code: 'empty-audit', severity: 'error', line: null });
  }

  const uniquePages = new Map<string, HreflangAuditPage>();
  for (const page of pages) {
    if (uniquePages.has(page.url)) {
      addIssue({ code: 'duplicate-page', severity: 'error', line: page.line, pageUrl: page.url });
    } else {
      uniquePages.set(page.url, page);
    }
  }

  const inconsistentPages = new Set<string>();
  const firstSignature = pageSignature(pages[0]);
  for (const page of pages.slice(1)) {
    if (pageSignature(page) !== firstSignature && !inconsistentPages.has(page.url)) {
      inconsistentPages.add(page.url);
      addIssue({ code: 'inconsistent-set', severity: 'warning', line: page.line, pageUrl: page.url });
    }
  }

  const missingTargets = new Set<string>();
  const missingReturns = new Set<string>();
  for (const page of pages) {
    for (const entry of page.entries) {
      const target = uniquePages.get(entry.url);
      if (!target) {
        if (!missingTargets.has(entry.url)) {
          missingTargets.add(entry.url);
          addIssue({
            code: 'target-page-not-provided',
            severity: 'warning',
            line: entry.line,
            detail: entry.url,
            pageUrl: page.url,
          });
        }
        continue;
      }
      if (target.url === page.url) continue;
      const pair = [page.url, target.url].sort().join('\n');
      if (!target.entries.some(targetEntry => targetEntry.url === page.url) && !missingReturns.has(pair)) {
        missingReturns.add(pair);
        addIssue({
          code: 'missing-return-link',
          severity: 'error',
          line: entry.line,
          detail: target.url,
          pageUrl: page.url,
        });
      }
    }
  }

  return {
    pages,
    linkCount: pages.reduce((total, page) => total + page.entries.length, 0),
    issues,
  };
}

function parseEntries(lines: string[], firstLine: number, addIssue: IssueSink): HreflangEntry[] {
  const entries: HreflangEntry[] = [];
  const codes = new Set<string>();
  const urls = new Map<string, string[]>();

  lines.forEach((rawLine, index) => {
    const line = firstLine + index;
    const value = rawLine.trim();
    if (!value || value === '---') return;
    if (CONTROL_CHARACTER_PATTERN.test(value)) {
      addIssue({ code: 'invalid-line', severity: 'error', line, detail: value });
      return;
    }
    const separator = value.indexOf('|');
    if (separator < 0) {
      addIssue({ code: 'invalid-line', severity: 'error', line, detail: value });
      return;
    }
    const codeSource = value.slice(0, separator).trim();
    const urlSource = value.slice(separator + 1).trim();
    if (!codeSource) {
      addIssue({ code: 'missing-code', severity: 'error', line });
      return;
    }
    if (!urlSource) {
      addIssue({ code: 'missing-url', severity: 'error', line, detail: codeSource });
      return;
    }
    const code = canonicalizeHreflang(codeSource);
    if (!code) {
      addIssue({ code: 'invalid-code', severity: 'error', line, detail: codeSource });
      return;
    }
    if (code !== codeSource) {
      addIssue({ code: 'noncanonical-code', severity: 'warning', line, detail: `${codeSource} → ${code}` });
    }
    const url = parseAlternateUrl(urlSource, line, addIssue);
    if (!url) return;
    if (codes.has(code.toLowerCase())) {
      addIssue({ code: 'duplicate-code', severity: 'error', line, detail: code });
      return;
    }
    codes.add(code.toLowerCase());
    entries.push({ code, url, line });
    const urlCodes = urls.get(url) ?? [];
    urlCodes.push(code);
    urls.set(url, urlCodes);
  });

  for (const [url, urlCodes] of urls) {
    if (urlCodes.length > 1) {
      addIssue({
        code: 'same-url-multiple-codes',
        severity: 'info',
        line: entries.find(entry => entry.url === url)?.line ?? null,
        detail: `${urlCodes.join(', ')} → ${url}`,
      });
    }
  }
  return entries;
}

function validateSet(currentUrl: string | null, entries: HreflangEntry[], addIssue: IssueSink): void {
  if (!entries.length) addIssue({ code: 'invalid-line', severity: 'error', line: null });
  if (entries.length > HREFLANG_MAX_ALTERNATES_PER_PAGE) {
    addIssue({
      code: 'too-many-alternates',
      severity: 'error',
      line: null,
      detail: String(entries.length),
    });
  }
  if (currentUrl && !entries.some(entry => entry.url === currentUrl)) {
    addIssue({ code: 'missing-self-reference', severity: 'error', line: null, detail: currentUrl });
  }
  if (!entries.some(entry => entry.code === 'x-default')) {
    addIssue({ code: 'missing-x-default', severity: 'info', line: null });
  }

  const codes = new Set(entries.map(entry => entry.code));
  const regionalLanguages = new Set(
    entries
      .filter(entry => entry.code !== 'x-default' && entry.code.split('-').length > 1)
      .map(entry => entry.code.split('-')[0]),
  );
  for (const language of regionalLanguages) {
    if (!codes.has(language)) {
      addIssue({ code: 'missing-language-fallback', severity: 'warning', line: null, detail: language });
    }
  }
}

function parsePageUrl(source: string, line: number, addIssue: IssueSink, kind: 'current' | 'page'): string | null {
  const trimmed = source.trim();
  if (!trimmed) {
    addIssue({
      code: kind === 'current' ? 'missing-current-url' : 'invalid-page-header',
      severity: 'error',
      line: line || null,
    });
    return null;
  }
  const url = parseUrl(trimmed);
  if (!url || url.username || url.password || url.hash) {
    addIssue({
      code: kind === 'current' ? 'invalid-current-url' : 'invalid-page-header',
      severity: 'error',
      line: line || null,
      detail: trimmed,
    });
    return null;
  }
  return url.href;
}

function parseAlternateUrl(source: string, line: number, addIssue: IssueSink): string | null {
  const url = parseUrl(source);
  if (!url) {
    addIssue({ code: 'invalid-url', severity: 'error', line, detail: source });
    return null;
  }
  if (url.username || url.password) {
    addIssue({ code: 'url-credentials', severity: 'error', line, detail: source });
    return null;
  }
  if (url.hash) {
    addIssue({ code: 'url-fragment', severity: 'error', line, detail: source });
    return null;
  }
  return url.href;
}

function parseCanonicalUrl(source: string, line: number, addIssue: IssueSink): string | null {
  const url = parseUrl(source.trim());
  if (!url || url.username || url.password || url.hash) {
    addIssue({ code: 'invalid-canonical', severity: 'error', line, detail: source.trim() });
    return null;
  }
  return url.href;
}

function parseUrl(source: string): URL | null {
  try {
    const url = new URL(source);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) ? url : null;
  } catch {
    return null;
  }
}

function canonicalizeHreflang(source: string): string | null {
  if (source.toLowerCase() === 'x-default') return 'x-default';
  const match = CODE_PATTERN.exec(source);
  if (!match) return null;
  const language = match[1].toLowerCase();
  const script = match[2] ? `${match[2][0].toUpperCase()}${match[2].slice(1).toLowerCase()}` : null;
  const region = match[3] ? match[3].toUpperCase() : null;
  if (
    !LANGUAGE_CODES.has(language)
    || (script && !isRegisteredScript(script))
    || (region && !REGION_CODES.has(region))
  ) return null;
  return [language, script, region].filter(Boolean).join('-');
}

function isRegisteredScript(script: string): boolean {
  return SCRIPT_CODES.has(script) || (script >= 'Qaaa' && script <= 'Qabx');
}

function createIssueSink(issues: HreflangIssue[]): IssueSink {
  return issue => {
    if (issues.length < MAX_REPORTED_ISSUES) {
      issues.push(issue);
      return;
    }
    if (!issues.some(current => current.code === 'issues-truncated')) {
      issues.push({ code: 'issues-truncated', severity: 'warning', line: null });
    }
  };
}

function limitSource(source: string, addIssue: IssueSink): string {
  if (source.length <= HREFLANG_MAX_SOURCE_CHARACTERS) return source;
  addIssue({
    code: 'source-too-large',
    severity: 'error',
    line: null,
    detail: String(HREFLANG_MAX_SOURCE_CHARACTERS),
  });
  return source.slice(0, HREFLANG_MAX_SOURCE_CHARACTERS);
}

function pageSignature(page: HreflangAuditPage | undefined): string {
  return page?.entries
    .map(entry => `${entry.code}\u0000${entry.url}`)
    .sort()
    .join('\u0001') ?? '';
}

function splitHeader(value: string): [string, string] {
  const separator = value.indexOf('|');
  return separator < 0
    ? [value, '']
    : [value.slice(0, separator), value.slice(separator + 1)];
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/"/gu, '&quot;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;');
}

function escapeText(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');
}
