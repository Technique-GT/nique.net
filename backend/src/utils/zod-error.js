"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeZodError = void 0;
const formatPath = (path) => {
    if (!path.length)
        return '<root>';
    return path
        .map((p) => (typeof p === 'number' ? `[${p}]` : p))
        .join('.')
        .replace(/\.\[/g, '[');
};
const issueKey = (issue) => {
    return `${issue.code}|${issue.path}|${issue.message}|${issue.expected ?? ''}|${issue.received ?? ''}`;
};
const normalizeOne = (issue) => {
    const safePath = issue.path.filter((p) => typeof p === 'string' || typeof p === 'number');
    const base = {
        path: formatPath(safePath),
        message: issue.message,
        code: issue.code,
    };
    // Some issues include received/expected
    const anyIssue = issue;
    if (typeof anyIssue.expected === 'string')
        base.expected = anyIssue.expected;
    if (typeof anyIssue.received === 'string')
        base.received = anyIssue.received;
    return base;
};
const flattenIssues = (issues) => {
    const out = [];
    for (const issue of issues) {
        // Unwrap union errors to show the underlying problems.
        if (issue.code === 'invalid_union' && issue.unionErrors) {
            for (const unionErr of issue.unionErrors) {
                out.push(...flattenIssues(unionErr.issues));
            }
            continue;
        }
        // Unwrap nested errors if present.
        const anyIssue = issue;
        if (anyIssue?.argumentsError?.issues) {
            out.push(...flattenIssues(anyIssue.argumentsError.issues));
            continue;
        }
        if (anyIssue?.returnTypeError?.issues) {
            out.push(...flattenIssues(anyIssue.returnTypeError.issues));
            continue;
        }
        out.push(issue);
    }
    return out;
};
const normalizeZodError = (err) => {
    const flattened = flattenIssues(err.issues);
    // Normalize and dedupe
    const normalized = flattened.map(normalizeOne);
    const seen = new Set();
    const deduped = [];
    for (const issue of normalized) {
        const key = issueKey(issue);
        if (seen.has(key))
            continue;
        seen.add(key);
        deduped.push(issue);
    }
    // Sort for stable output
    deduped.sort((a, b) => (a.path === b.path ? a.code.localeCompare(b.code) : a.path.localeCompare(b.path)));
    return deduped;
};
exports.normalizeZodError = normalizeZodError;
