export const ROBOTS_TXT_MAX_BYTES = 500 * 1024;

export type RobotsDirective = 'allow' | 'disallow';
export type RobotsIssueSeverity = 'error' | 'warning' | 'info';

export type RobotsIssueCode =
  | 'file-too-large'
  | 'bom-ignored'
  | 'invalid-control-character'
  | 'html-content'
  | 'invalid-line'
  | 'empty-user-agent'
  | 'invalid-user-agent'
  | 'orphan-rule'
  | 'empty-rule-ignored'
  | 'invalid-rule-path'
  | 'invalid-dollar-position'
  | 'invalid-sitemap'
  | 'unsupported-crawl-delay'
  | 'unknown-directive'
  | 'duplicate-rule'
  | 'duplicate-sitemap'
  | 'missing-user-agent'
  | 'issues-truncated';

export interface RobotsIssue {
  code: RobotsIssueCode;
  severity: RobotsIssueSeverity;
  line: number | null;
  detail?: string;
}

export interface RobotsRule {
  directive: RobotsDirective;
  path: string;
  line: number;
}

export interface RobotsGroup {
  userAgents: string[];
  rules: RobotsRule[];
  line: number;
}

export interface RobotsDocument {
  groups: RobotsGroup[];
  sitemaps: string[];
  issues: RobotsIssue[];
  sourceBytes: number;
  analyzedBytes: number;
  lineCount: number;
}

export interface RobotsBuilderSettings {
  siteUrl: string;
  userAgent: string;
  allowPaths: string[];
  disallowPaths: string[];
  includeSitemap: boolean;
}

export interface RobotsGeneration {
  content: string;
  siteValid: boolean;
  userAgentValid: boolean;
}

export type RobotsDecisionReason =
  | 'matched-rule'
  | 'no-matching-rule'
  | 'robots-file'
  | 'invalid-site-url'
  | 'invalid-test-url'
  | 'different-origin'
  | 'invalid-test-agent';

export interface RobotsAccessDecision {
  valid: boolean;
  allowed: boolean | null;
  reason: RobotsDecisionReason;
  targetPath: string;
  matchedUserAgents: string[];
  matchedRule: RobotsRule | null;
}

type PendingGroup = {
  userAgents: string[];
  rules: RobotsRule[];
  line: number;
};

const MAX_REPORTED_ISSUES = 200;
const PRODUCT_TOKEN_PATTERN = /^[A-Za-z_-]+$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;
const HTML_PATTERN = /^\s*(?:<!doctype\s+html|<html\b)/iu;
const UNRESERVED_ASCII_PATTERN = /^[A-Za-z0-9._~-]$/;

export function parseRobotsTxt(source: string): RobotsDocument {
  const sourceBytes = utf8ByteLength(source);
  const analyzedSource = truncateUtf8(source, ROBOTS_TXT_MAX_BYTES);
  const analyzedBytes = utf8ByteLength(analyzedSource);
  const sourceWithoutBom = analyzedSource.replace(/^\ufeff/, '');
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  const issues: RobotsIssue[] = [];
  const lines = sourceWithoutBom.split(/\r\n|\n|\r/);
  let pending: PendingGroup | null = null;
  const addIssue = (issue: RobotsIssue): void => {
    if (issues.length < MAX_REPORTED_ISSUES) {
      issues.push(issue);
      return;
    }
    if (!issues.some(current => current.code === 'issues-truncated')) {
      issues.push({ code: 'issues-truncated', severity: 'warning', line: null });
    }
  };

  const commitPending = (): void => {
    if (!pending?.userAgents.length) {
      pending = null;
      return;
    }
    groups.push({
      userAgents: [...pending.userAgents],
      rules: [...pending.rules],
      line: pending.line,
    });
    pending = null;
  };

  if (sourceBytes > ROBOTS_TXT_MAX_BYTES) {
    addIssue({ code: 'file-too-large', severity: 'warning', line: null });
  }
  if (source.startsWith('\ufeff')) {
    addIssue({ code: 'bom-ignored', severity: 'info', line: 1 });
  }
  if (HTML_PATTERN.test(sourceWithoutBom)) {
    addIssue({ code: 'html-content', severity: 'error', line: 1 });
  }

  lines.forEach((rawLine, index) => {
    const line = index + 1;
    if (CONTROL_CHARACTER_PATTERN.test(rawLine)) {
      addIssue({ code: 'invalid-control-character', severity: 'error', line });
      return;
    }

    const withoutComment = trimAsciiWhitespace(rawLine.split('#', 1)[0]);
    if (!withoutComment) return;

    const separator = withoutComment.indexOf(':');
    if (separator < 0) {
      addIssue({ code: 'invalid-line', severity: 'error', line, detail: withoutComment });
      return;
    }

    const field = trimAsciiWhitespace(withoutComment.slice(0, separator)).toLowerCase();
    const value = trimAsciiWhitespace(withoutComment.slice(separator + 1));

    if (field === 'user-agent') {
      if (pending?.rules.length) commitPending();
      pending ??= { userAgents: [], rules: [], line };

      if (!value) {
        addIssue({ code: 'empty-user-agent', severity: 'error', line });
      } else if (!isValidProductToken(value)) {
        addIssue({ code: 'invalid-user-agent', severity: 'error', line, detail: value });
      } else if (!pending.userAgents.some(agent => agent.toLowerCase() === value.toLowerCase())) {
        pending.userAgents.push(value);
      }
      return;
    }

    if (field === 'allow' || field === 'disallow') {
      if (!pending?.userAgents.length) {
        addIssue({ code: 'orphan-rule', severity: 'error', line, detail: field });
        return;
      }
      if (!value) {
        addIssue({ code: 'empty-rule-ignored', severity: 'info', line, detail: field });
        return;
      }
      if (!value.startsWith('/') || /[ \t]/u.test(value)) {
        addIssue({ code: 'invalid-rule-path', severity: 'error', line, detail: value });
        return;
      }
      if (value.includes('$') && (!value.endsWith('$') || value.slice(0, -1).includes('$'))) {
        addIssue({ code: 'invalid-dollar-position', severity: 'error', line, detail: value });
        return;
      }

      const duplicate = pending.rules.some(rule => rule.directive === field && rule.path === value);
      if (duplicate) {
        addIssue({ code: 'duplicate-rule', severity: 'warning', line, detail: value });
        return;
      }
      pending.rules.push({ directive: field, path: value, line });
      return;
    }

    if (field === 'sitemap') {
      if (!isAbsoluteHttpUrl(value)) {
        addIssue({ code: 'invalid-sitemap', severity: 'error', line, detail: value });
      } else if (sitemaps.includes(value)) {
        addIssue({ code: 'duplicate-sitemap', severity: 'warning', line, detail: value });
      } else {
        sitemaps.push(value);
      }
      return;
    }

    if (field === 'crawl-delay') {
      addIssue({ code: 'unsupported-crawl-delay', severity: 'warning', line, detail: value });
      return;
    }

    addIssue({ code: 'unknown-directive', severity: 'warning', line, detail: field });
  });

  commitPending();
  if (!groups.length) {
    addIssue({ code: 'missing-user-agent', severity: 'error', line: null });
  }
  return {
    groups,
    sitemaps,
    issues,
    sourceBytes,
    analyzedBytes,
    lineCount: lines.length,
  };
}

export function generateRobotsTxt(settings: RobotsBuilderSettings): RobotsGeneration {
  const candidateUserAgent = trimAsciiWhitespace(settings.userAgent);
  const userAgentValid = isValidProductToken(candidateUserAgent);
  const userAgent = userAgentValid ? candidateUserAgent : '*';
  const allowPaths = uniquePaths(settings.allowPaths);
  const disallowPaths = uniquePaths(settings.disallowPaths);
  const siteOrigin = parseHttpOrigin(settings.siteUrl);
  const lines = [`User-agent: ${userAgent}`];

  for (const path of allowPaths) lines.push(`Allow: ${path}`);
  for (const path of disallowPaths) lines.push(`Disallow: ${path}`);

  if (settings.includeSitemap && siteOrigin) {
    lines.push('', `Sitemap: ${siteOrigin}/sitemap.xml`);
  }

  return {
    content: `${lines.join('\n')}\n`,
    siteValid: siteOrigin !== null,
    userAgentValid,
  };
}

export function evaluateRobotsAccess(
  document: RobotsDocument,
  siteUrl: string,
  userAgent: string,
  targetUrl: string,
): RobotsAccessDecision {
  const siteOrigin = parseHttpOrigin(siteUrl);
  if (!siteOrigin) return invalidDecision('invalid-site-url');

  const agent = trimAsciiWhitespace(userAgent);
  if (!isValidProductToken(agent) || agent === '*') {
    return invalidDecision('invalid-test-agent');
  }

  const parsedTarget = parseTargetUrl(targetUrl, siteOrigin);
  if (!parsedTarget) return invalidDecision('invalid-test-url');
  if (parsedTarget.origin !== siteOrigin) return invalidDecision('different-origin');

  const targetPath = canonicalizePercentEncoding(`${parsedTarget.pathname}${parsedTarget.search}`);
  if (parsedTarget.pathname === '/robots.txt') {
    return {
      valid: true,
      allowed: true,
      reason: 'robots-file',
      targetPath,
      matchedUserAgents: [],
      matchedRule: null,
    };
  }

  const normalizedAgent = agent.toLowerCase();
  const exactGroups = document.groups.filter(group =>
    group.userAgents.some(groupAgent => groupAgent !== '*' && groupAgent.toLowerCase() === normalizedAgent),
  );
  const applicableGroups = exactGroups.length
    ? exactGroups
    : document.groups.filter(group => group.userAgents.includes('*'));
  const matchedUserAgents = exactGroups.length ? [agent] : (applicableGroups.length ? ['*'] : []);
  const matchingRules = applicableGroups
    .flatMap(group => group.rules)
    .filter(rule => ruleMatchesPath(rule.path, targetPath));

  if (!matchingRules.length) {
    return {
      valid: true,
      allowed: true,
      reason: 'no-matching-rule',
      targetPath,
      matchedUserAgents,
      matchedRule: null,
    };
  }

  matchingRules.sort((left, right) => {
    const specificityDifference = ruleSpecificity(right.path) - ruleSpecificity(left.path);
    if (specificityDifference) return specificityDifference;
    if (left.directive === right.directive) return left.line - right.line;
    return left.directive === 'allow' ? -1 : 1;
  });
  const matchedRule = matchingRules[0];

  return {
    valid: true,
    allowed: matchedRule.directive === 'allow',
    reason: 'matched-rule',
    targetPath,
    matchedUserAgents,
    matchedRule,
  };
}

function invalidDecision(reason: RobotsDecisionReason): RobotsAccessDecision {
  return {
    valid: false,
    allowed: null,
    reason,
    targetPath: '',
    matchedUserAgents: [],
    matchedRule: null,
  };
}

function isValidProductToken(value: string): boolean {
  return value === '*' || PRODUCT_TOKEN_PATTERN.test(value);
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function parseHttpOrigin(value: string): string | null {
  try {
    const candidate = /^https?:\/\//iu.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function parseTargetUrl(value: string, baseOrigin: string): URL | null {
  try {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new URL(trimmed, `${baseOrigin}/`);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed : null;
  } catch {
    return null;
  }
}

function uniquePaths(paths: string[]): string[] {
  const result: string[] = [];
  for (const path of paths) {
    const normalized = normalizeBuilderPath(path);
    if (normalized && !result.includes(normalized)) result.push(normalized);
  }
  return result;
}

function normalizeBuilderPath(value: string): string {
  const trimmed = trimAsciiWhitespace(value);
  if (!trimmed) return '';
  const rooted = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return rooted.replace(/#/gu, '%23').replace(/[ \t]/gu, '%20');
}

function ruleMatchesPath(rulePath: string, targetPath: string): boolean {
  const exact = rulePath.endsWith('$');
  const rawPattern = exact ? rulePath.slice(0, -1) : rulePath;
  const pattern = canonicalizePercentEncoding(rawPattern);
  return wildcardMatch(pattern, targetPath, exact);
}

function wildcardMatch(pattern: string, target: string, exact: boolean): boolean {
  const effectivePattern = exact ? pattern : `${pattern}*`;
  let patternIndex = 0;
  let targetIndex = 0;
  let starIndex = -1;
  let checkpoint = -1;

  while (targetIndex < target.length) {
    if (effectivePattern[patternIndex] === target[targetIndex] && effectivePattern[patternIndex] !== '*') {
      patternIndex += 1;
      targetIndex += 1;
    } else if (effectivePattern[patternIndex] === '*') {
      starIndex = patternIndex;
      checkpoint = targetIndex;
      patternIndex += 1;
    } else if (starIndex >= 0) {
      patternIndex = starIndex + 1;
      checkpoint += 1;
      targetIndex = checkpoint;
    } else {
      return false;
    }
  }

  while (effectivePattern[patternIndex] === '*') patternIndex += 1;
  return patternIndex === effectivePattern.length;
}

function ruleSpecificity(path: string): number {
  return utf8ByteLength(canonicalizePercentEncoding(path.replace(/\*|\$$/gu, '')));
}

function canonicalizePercentEncoding(value: string): string {
  let result = '';
  for (let index = 0; index < value.length;) {
    const character = value[index];
    const encodedPair = value.slice(index, index + 3);
    if (character === '%' && /^%[0-9a-f]{2}$/iu.test(encodedPair)) {
      const byte = Number.parseInt(encodedPair.slice(1), 16);
      const decoded = String.fromCharCode(byte);
      result += UNRESERVED_ASCII_PATTERN.test(decoded) ? decoded : `%${encodedPair.slice(1).toUpperCase()}`;
      index += 3;
      continue;
    }

    const codePoint = value.codePointAt(index) ?? 0;
    const completeCharacter = String.fromCodePoint(codePoint);
    result += codePoint > 0x7f ? encodeUtf8Character(completeCharacter) : completeCharacter;
    index += completeCharacter.length;
  }
  return result;
}

function truncateUtf8(value: string, maximumBytes: number): string {
  const characters: string[] = [];
  let bytes = 0;
  for (const character of value) {
    const characterBytes = utf8ByteLength(character);
    if (bytes + characterBytes > maximumBytes) break;
    characters.push(character);
    bytes += characterBytes;
  }
  return characters.join('');
}

function encodeUtf8Character(character: string): string {
  try {
    return encodeURIComponent(character).toUpperCase();
  } catch {
    return '%EF%BF%BD';
  }
}

function trimAsciiWhitespace(value: string): string {
  return value.replace(/^[ \t]+|[ \t]+$/g, '');
}

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 0x7f) bytes += 1;
    else if (codePoint <= 0x7ff) bytes += 2;
    else if (codePoint <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}
