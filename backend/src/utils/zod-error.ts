import { ZodError, ZodIssue } from 'zod';

export type NormalizedZodIssue = {
  path: string;
  message: string;
  code: string;
  expected?: string;
  received?: string;
};

const formatPath = (path: Array<string | number>): string => {
  if (!path.length) return '<root>';
  return path
    .map((p) => (typeof p === 'number' ? `[${p}]` : p))
    .join('.')
    .replace(/\.\[/g, '[');
};

const issueKey = (issue: NormalizedZodIssue) => {
  return `${issue.code}|${issue.path}|${issue.message}|${issue.expected ?? ''}|${issue.received ?? ''}`;
};

const normalizeOne = (issue: ZodIssue): NormalizedZodIssue => {
  const safePath = issue.path.filter((p): p is string | number => typeof p === 'string' || typeof p === 'number');

  const base: NormalizedZodIssue = {
    path: formatPath(safePath),
    message: issue.message,
    code: issue.code,
  };

  // Some issues include received/expected
  const anyIssue = issue as any;
  if (typeof anyIssue.expected === 'string') base.expected = anyIssue.expected;
  if (typeof anyIssue.received === 'string') base.received = anyIssue.received;

  return base;
};

const flattenIssues = (issues: ZodIssue[]): ZodIssue[] => {
  const out: ZodIssue[] = [];

  for (const issue of issues) {
    // Unwrap union errors to show the underlying problems.
    if (issue.code === 'invalid_union' && (issue as any).unionErrors) {
      for (const unionErr of (issue as any).unionErrors as ZodError[]) {
        out.push(...flattenIssues(unionErr.issues));
      }
      continue;
    }

    // Unwrap nested errors if present.
    const anyIssue = issue as any;
    if (anyIssue?.argumentsError?.issues) {
      out.push(...flattenIssues((anyIssue.argumentsError as ZodError).issues));
      continue;
    }

    if (anyIssue?.returnTypeError?.issues) {
      out.push(...flattenIssues((anyIssue.returnTypeError as ZodError).issues));
      continue;
    }

    out.push(issue);
  }

  return out;
};

export const normalizeZodError = (err: ZodError): NormalizedZodIssue[] => {
  const flattened = flattenIssues(err.issues);

  // Normalize and dedupe
  const normalized = flattened.map(normalizeOne);

  const seen = new Set<string>();
  const deduped: NormalizedZodIssue[] = [];
  for (const issue of normalized) {
    const key = issueKey(issue);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(issue);
  }

  // Sort for stable output
  deduped.sort((a, b) => (a.path === b.path ? a.code.localeCompare(b.code) : a.path.localeCompare(b.path)));

  return deduped;
};
