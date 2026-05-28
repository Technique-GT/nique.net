import fs from 'node:fs/promises';
import path from 'node:path';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

interface RouteMount {
  basePath: string;
  filePath: string;
}

interface ParsedEndpoint {
  fullPath: string;
  method: HttpMethod;
  authRequired: boolean;
  adminRequired: boolean;
}

interface OpenApiPathOperation {
  tags: string[];
  summary: string;
  operationId: string;
  responses: Record<string, { description: string }>;
  parameters?: Array<{
    name: string;
    in: 'path';
    required: true;
    schema: { type: 'string' };
  }>;
  security?: Array<Record<string, []>>;
  description?: string;
  'x-required-role'?: 'admin';
}

interface OpenApiDocument {
  openapi: '3.0.3';
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  tags: Array<{
    name: string;
  }>;
  paths: Record<string, Partial<Record<HttpMethod, OpenApiPathOperation>>>;
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http';
        scheme: 'bearer';
        bearerFormat: 'JWT';
      };
      cookieAuth: {
        type: 'apiKey';
        in: 'cookie';
        name: 'jwt';
      };
    };
  };
}

const ROUTE_IMPORT_RE = /import\s+(\w+)\s+from\s+['"](\.\/routes\/[^'"]+)['"];/g;
const APP_USE_RE = /app\.use\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\);/g;
const ROUTER_USE_RE = /router\.use\(([\s\S]*?)\);/g;
const ROUTER_METHOD_RE = /router\.(get|post|put|patch|delete|head|options)\(\s*(['"`])([^'"`]+)\2\s*,([\s\S]*?)\);/g;
const PATH_PARAM_RE = /\{([^}]+)\}/g;

const HTTP_METHOD_ORDER: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
const AUTH_IDENTIFIERS = ['authMiddleware', 'protect'];
const ADMIN_IDENTIFIERS = ['adminMiddleware', 'requireAdmin'];

const run = async (): Promise<void> => {
  const backendRoot = process.cwd();
  const appFilePath = path.join(backendRoot, 'src', 'app.ts');
  const appFileContent = await fs.readFile(appFilePath, 'utf8');

  const routeFileByVar = parseRouteImports(appFileContent, appFilePath);
  const routeMounts = parseRouteMounts(appFileContent, routeFileByVar);

  const parsedEndpoints: ParsedEndpoint[] = [];
  for (const mount of routeMounts) {
    const fileContent = await fs.readFile(mount.filePath, 'utf8');
    parsedEndpoints.push(...parseEndpointsFromRouteFile(fileContent, mount.basePath));
  }

  // Include health checks declared directly in app.ts.
  parsedEndpoints.push(
    {
      method: 'get',
      fullPath: '/health',
      authRequired: false,
      adminRequired: false,
    },
    {
      method: 'get',
      fullPath: '/api/health',
      authRequired: false,
      adminRequired: false,
    },
    {
      method: 'get',
      fullPath: '/api/openapi.json',
      authRequired: false,
      adminRequired: false,
    },
  );

  const openApi = buildOpenApiDocument(parsedEndpoints);
  const outPath = path.join(backendRoot, 'openapi.json');
  await fs.writeFile(outPath, `${JSON.stringify(openApi, null, 2)}\n`, 'utf8');

  console.log(`Generated OpenAPI spec at ${outPath}`);
  console.log(`Discovered ${parsedEndpoints.length} endpoints`);
};

function parseRouteImports(appFileContent: string, appFilePath: string): Map<string, string> {
  const appDir = path.dirname(appFilePath);
  const routeFileByVar = new Map<string, string>();
  const matches = appFileContent.matchAll(ROUTE_IMPORT_RE);

  for (const match of matches) {
    const varName = match[1];
    const importPath = match[2];
    if (!varName || !importPath) continue;
    const resolved = path.resolve(appDir, `${importPath}.ts`);
    routeFileByVar.set(varName, resolved);
  }

  return routeFileByVar;
}

function parseRouteMounts(appFileContent: string, routeFileByVar: Map<string, string>): RouteMount[] {
  const routeMounts: RouteMount[] = [];
  const matches = appFileContent.matchAll(APP_USE_RE);

  for (const match of matches) {
    const rawBasePath = match[1];
    const varName = match[2];
    if (!rawBasePath || !varName) continue;
    const basePath = normalizeSlashPath(rawBasePath);
    const filePath = routeFileByVar.get(varName);
    if (!filePath) continue;
    routeMounts.push({ basePath, filePath });
  }

  return routeMounts;
}

function parseEndpointsFromRouteFile(routeFileContent: string, basePath: string): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];
  const routerMiddlewareSegments = [...routeFileContent.matchAll(ROUTER_USE_RE)].map((match) => match[1] ?? '');

  const routeLevelAuthRequired = routerMiddlewareSegments.some((segment) => hasAnyIdentifier(segment, AUTH_IDENTIFIERS));
  const routeLevelAdminRequired = routerMiddlewareSegments.some((segment) => hasAnyIdentifier(segment, ADMIN_IDENTIFIERS));

  const routeMethodMatches = routeFileContent.matchAll(ROUTER_METHOD_RE);
  for (const match of routeMethodMatches) {
    const method = match[1] as HttpMethod;
    const routePath = match[3] ?? '/';
    const handlersSegment = match[4] ?? '';
    const handlers = splitTopLevelCommas(handlersSegment);

    const endpointAuthRequired = routeLevelAuthRequired || handlers.some((handler) => hasAnyIdentifier(handler, AUTH_IDENTIFIERS));
    const endpointAdminRequired =
      routeLevelAdminRequired || handlers.some((handler) => hasAnyIdentifier(handler, ADMIN_IDENTIFIERS));

    endpoints.push({
      method,
      fullPath: normalizeExpressPath(joinPaths(basePath, routePath)),
      authRequired: endpointAuthRequired || endpointAdminRequired,
      adminRequired: endpointAdminRequired,
    });
  }

  return endpoints;
}

function splitTopLevelCommas(value: string): string[] {
  const result: string[] = [];
  let current = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let quote: "'" | '"' | '`' | null = null;
  let escaped = false;

  for (const char of value) {
    if (quote) {
      current += char;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      current += char;
      continue;
    }

    if (char === '(') parenDepth += 1;
    if (char === ')') parenDepth -= 1;
    if (char === '[') bracketDepth += 1;
    if (char === ']') bracketDepth -= 1;
    if (char === '{') braceDepth += 1;
    if (char === '}') braceDepth -= 1;

    if (char === ',' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      const token = current.trim();
      if (token) result.push(token);
      current = '';
      continue;
    }

    current += char;
  }

  const token = current.trim();
  if (token) result.push(token);
  return result;
}

function hasAnyIdentifier(value: string, identifiers: string[]): boolean {
  return identifiers.some((identifier) => {
    const re = new RegExp(`\\b${escapeRegExp(identifier)}\\b`);
    return re.test(value);
  });
}

function buildOpenApiDocument(endpoints: ParsedEndpoint[]): OpenApiDocument {
  const paths: Record<string, Partial<Record<HttpMethod, OpenApiPathOperation>>> = {};

  const dedupedEndpoints = dedupeEndpoints(endpoints);
  for (const endpoint of dedupedEndpoints) {
    const pathKey = endpoint.fullPath;
    if (!paths[pathKey]) {
      paths[pathKey] = {};
    }

    const operation = toOperation(endpoint);
    paths[pathKey][endpoint.method] = operation;
  }

  const sortedPaths = sortPathsAndMethods(paths);
  const tags = collectTags(sortedPaths);

  return {
    openapi: '3.0.3',
    info: {
      title: 'Technique Backend API',
      version: '1.0.0',
      description: 'Auto-generated from Express route definitions.',
    },
    servers: [
      {
        url: 'http://localhost:5050',
        description: 'Local development',
      },
    ],
    tags: tags.map((name) => ({ name })),
    paths: sortedPaths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'jwt',
        },
      },
    },
  };
}

function toOperation(endpoint: ParsedEndpoint): OpenApiPathOperation {
  const operation: OpenApiPathOperation = {
    tags: [deriveTag(endpoint.fullPath)],
    summary: `${endpoint.method.toUpperCase()} ${endpoint.fullPath}`,
    operationId: buildOperationId(endpoint.method, endpoint.fullPath),
    responses: {
      '200': { description: 'Success' },
    },
  };

  const pathParameters = extractPathParameters(endpoint.fullPath);
  if (pathParameters.length > 0) {
    operation.parameters = pathParameters.map((name) => ({
      name,
      in: 'path',
      required: true,
      schema: { type: 'string' },
    }));
  }

  if (endpoint.authRequired) {
    operation.security = [{ bearerAuth: [] }, { cookieAuth: [] }];
    operation.description = endpoint.adminRequired ? 'Requires authenticated admin user.' : 'Requires authenticated user.';
  }

  if (endpoint.adminRequired) {
    operation['x-required-role'] = 'admin';
  }

  return operation;
}

function dedupeEndpoints(endpoints: ParsedEndpoint[]): ParsedEndpoint[] {
  const seen = new Set<string>();
  const deduped: ParsedEndpoint[] = [];

  for (const endpoint of endpoints) {
    const key = `${endpoint.method} ${endpoint.fullPath}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(endpoint);
  }

  return deduped;
}

function sortPathsAndMethods(
  paths: Record<string, Partial<Record<HttpMethod, OpenApiPathOperation>>>,
): Record<string, Partial<Record<HttpMethod, OpenApiPathOperation>>> {
  const sortedPathEntries = Object.entries(paths).sort(([a], [b]) => a.localeCompare(b));
  const sorted: Record<string, Partial<Record<HttpMethod, OpenApiPathOperation>>> = {};

  for (const [pathKey, methods] of sortedPathEntries) {
    const methodEntries = Object.entries(methods) as Array<[HttpMethod, OpenApiPathOperation]>;
    methodEntries.sort((a, b) => HTTP_METHOD_ORDER.indexOf(a[0]) - HTTP_METHOD_ORDER.indexOf(b[0]));
    sorted[pathKey] = Object.fromEntries(methodEntries);
  }

  return sorted;
}

function collectTags(paths: Record<string, Partial<Record<HttpMethod, OpenApiPathOperation>>>): string[] {
  const tagSet = new Set<string>();
  for (const methods of Object.values(paths)) {
    for (const operation of Object.values(methods)) {
      if (!operation) continue;
      for (const tag of operation.tags) {
        tagSet.add(tag);
      }
    }
  }

  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

function deriveTag(fullPath: string): string {
  const segments = fullPath.split('/').filter(Boolean);
  if (segments.length === 0) return 'misc';

  if (segments[0] === 'api') {
    if (segments[1] === 'admin') {
      return segments[2] ? `admin-${segments[2]}` : 'admin';
    }
    return segments[1] ?? 'api';
  }

  return segments[0] ?? 'misc';
}

function buildOperationId(method: HttpMethod, fullPath: string): string {
  const tokens = fullPath
    .replace(/[{}]/g, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean);

  return `${method}${tokens.map(capitalize).join('')}`;
}

function extractPathParameters(fullPath: string): string[] {
  const params: string[] = [];
  const matches = fullPath.matchAll(PATH_PARAM_RE);
  for (const match of matches) {
    const param = match[1];
    if (param && !params.includes(param)) {
      params.push(param);
    }
  }
  return params;
}

function joinPaths(basePath: string, routePath: string): string {
  const normalizedBase = normalizeSlashPath(basePath);
  const normalizedRoute = normalizeSlashPath(routePath);

  if (normalizedRoute === '/') return normalizedBase;
  if (normalizedBase === '/') return normalizedRoute;
  return `${normalizedBase}${normalizedRoute}`;
}

function normalizeSlashPath(value: string): string {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash.length === 0 ? '/' : withoutTrailingSlash;
}

function normalizeExpressPath(value: string): string {
  return value.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

run().catch((error) => {
  console.error('Failed to generate OpenAPI spec');
  console.error(error);
  process.exit(1);
});
