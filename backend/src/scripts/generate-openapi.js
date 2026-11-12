"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const ROUTE_IMPORT_RE = /import\s+(\w+)\s+from\s+['"](\.\/routes\/[^'"]+)['"];/g;
const APP_USE_RE = /app\.use\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\);/g;
const ROUTER_USE_RE = /router\.use\(([\s\S]*?)\);/g;
const ROUTER_METHOD_RE = /router\.(get|post|put|patch|delete|head|options)\(\s*(['"`])([^'"`]+)\2\s*,([\s\S]*?)\);/g;
const PATH_PARAM_RE = /\{([^}]+)\}/g;
const HTTP_METHOD_ORDER = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
const AUTH_IDENTIFIERS = ['authMiddleware', 'protect'];
const ADMIN_IDENTIFIERS = ['adminMiddleware', 'requireAdmin'];
const run = async () => {
    const backendRoot = process.cwd();
    const appFilePath = node_path_1.default.join(backendRoot, 'src', 'app.ts');
    const appFileContent = await promises_1.default.readFile(appFilePath, 'utf8');
    const routeFileByVar = parseRouteImports(appFileContent, appFilePath);
    const routeMounts = parseRouteMounts(appFileContent, routeFileByVar);
    const parsedEndpoints = [];
    for (const mount of routeMounts) {
        const fileContent = await promises_1.default.readFile(mount.filePath, 'utf8');
        parsedEndpoints.push(...parseEndpointsFromRouteFile(fileContent, mount.basePath));
    }
    // Include health checks declared directly in app.ts.
    parsedEndpoints.push({
        method: 'get',
        fullPath: '/health',
        authRequired: false,
        adminRequired: false,
    }, {
        method: 'get',
        fullPath: '/api/health',
        authRequired: false,
        adminRequired: false,
    }, {
        method: 'get',
        fullPath: '/api/openapi.json',
        authRequired: false,
        adminRequired: false,
    });
    const openApi = buildOpenApiDocument(parsedEndpoints);
    const outPath = node_path_1.default.join(backendRoot, 'openapi.json');
    await promises_1.default.writeFile(outPath, `${JSON.stringify(openApi, null, 2)}\n`, 'utf8');
    console.log(`Generated OpenAPI spec at ${outPath}`);
    console.log(`Discovered ${parsedEndpoints.length} endpoints`);
};
function parseRouteImports(appFileContent, appFilePath) {
    const appDir = node_path_1.default.dirname(appFilePath);
    const routeFileByVar = new Map();
    const matches = appFileContent.matchAll(ROUTE_IMPORT_RE);
    for (const match of matches) {
        const varName = match[1];
        const importPath = match[2];
        if (!varName || !importPath)
            continue;
        const resolved = node_path_1.default.resolve(appDir, `${importPath}.ts`);
        routeFileByVar.set(varName, resolved);
    }
    return routeFileByVar;
}
function parseRouteMounts(appFileContent, routeFileByVar) {
    const routeMounts = [];
    const matches = appFileContent.matchAll(APP_USE_RE);
    for (const match of matches) {
        const rawBasePath = match[1];
        const varName = match[2];
        if (!rawBasePath || !varName)
            continue;
        const basePath = normalizeSlashPath(rawBasePath);
        const filePath = routeFileByVar.get(varName);
        if (!filePath)
            continue;
        routeMounts.push({ basePath, filePath });
    }
    return routeMounts;
}
function parseEndpointsFromRouteFile(routeFileContent, basePath) {
    const endpoints = [];
    const routerMiddlewareSegments = [...routeFileContent.matchAll(ROUTER_USE_RE)].map((match) => match[1] ?? '');
    const routeLevelAuthRequired = routerMiddlewareSegments.some((segment) => hasAnyIdentifier(segment, AUTH_IDENTIFIERS));
    const routeLevelAdminRequired = routerMiddlewareSegments.some((segment) => hasAnyIdentifier(segment, ADMIN_IDENTIFIERS));
    const routeMethodMatches = routeFileContent.matchAll(ROUTER_METHOD_RE);
    for (const match of routeMethodMatches) {
        const method = match[1];
        const routePath = match[3] ?? '/';
        const handlersSegment = match[4] ?? '';
        const handlers = splitTopLevelCommas(handlersSegment);
        const endpointAuthRequired = routeLevelAuthRequired || handlers.some((handler) => hasAnyIdentifier(handler, AUTH_IDENTIFIERS));
        const endpointAdminRequired = routeLevelAdminRequired || handlers.some((handler) => hasAnyIdentifier(handler, ADMIN_IDENTIFIERS));
        endpoints.push({
            method,
            fullPath: normalizeExpressPath(joinPaths(basePath, routePath)),
            authRequired: endpointAuthRequired || endpointAdminRequired,
            adminRequired: endpointAdminRequired,
        });
    }
    return endpoints;
}
function splitTopLevelCommas(value) {
    const result = [];
    let current = '';
    let parenDepth = 0;
    let bracketDepth = 0;
    let braceDepth = 0;
    let quote = null;
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
        if (char === '(')
            parenDepth += 1;
        if (char === ')')
            parenDepth -= 1;
        if (char === '[')
            bracketDepth += 1;
        if (char === ']')
            bracketDepth -= 1;
        if (char === '{')
            braceDepth += 1;
        if (char === '}')
            braceDepth -= 1;
        if (char === ',' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
            const token = current.trim();
            if (token)
                result.push(token);
            current = '';
            continue;
        }
        current += char;
    }
    const token = current.trim();
    if (token)
        result.push(token);
    return result;
}
function hasAnyIdentifier(value, identifiers) {
    return identifiers.some((identifier) => {
        const re = new RegExp(`\\b${escapeRegExp(identifier)}\\b`);
        return re.test(value);
    });
}
function buildOpenApiDocument(endpoints) {
    const paths = {};
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
function toOperation(endpoint) {
    const operation = {
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
function dedupeEndpoints(endpoints) {
    const seen = new Set();
    const deduped = [];
    for (const endpoint of endpoints) {
        const key = `${endpoint.method} ${endpoint.fullPath}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        deduped.push(endpoint);
    }
    return deduped;
}
function sortPathsAndMethods(paths) {
    const sortedPathEntries = Object.entries(paths).sort(([a], [b]) => a.localeCompare(b));
    const sorted = {};
    for (const [pathKey, methods] of sortedPathEntries) {
        const methodEntries = Object.entries(methods);
        methodEntries.sort((a, b) => HTTP_METHOD_ORDER.indexOf(a[0]) - HTTP_METHOD_ORDER.indexOf(b[0]));
        sorted[pathKey] = Object.fromEntries(methodEntries);
    }
    return sorted;
}
function collectTags(paths) {
    const tagSet = new Set();
    for (const methods of Object.values(paths)) {
        for (const operation of Object.values(methods)) {
            if (!operation)
                continue;
            for (const tag of operation.tags) {
                tagSet.add(tag);
            }
        }
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}
function deriveTag(fullPath) {
    const segments = fullPath.split('/').filter(Boolean);
    if (segments.length === 0)
        return 'misc';
    if (segments[0] === 'api') {
        if (segments[1] === 'admin') {
            return segments[2] ? `admin-${segments[2]}` : 'admin';
        }
        return segments[1] ?? 'api';
    }
    return segments[0] ?? 'misc';
}
function buildOperationId(method, fullPath) {
    const tokens = fullPath
        .replace(/[{}]/g, '')
        .split('/')
        .filter(Boolean)
        .map((segment) => segment.replace(/[^a-zA-Z0-9]/g, ''))
        .filter(Boolean);
    return `${method}${tokens.map(capitalize).join('')}`;
}
function extractPathParameters(fullPath) {
    const params = [];
    const matches = fullPath.matchAll(PATH_PARAM_RE);
    for (const match of matches) {
        const param = match[1];
        if (param && !params.includes(param)) {
            params.push(param);
        }
    }
    return params;
}
function joinPaths(basePath, routePath) {
    const normalizedBase = normalizeSlashPath(basePath);
    const normalizedRoute = normalizeSlashPath(routePath);
    if (normalizedRoute === '/')
        return normalizedBase;
    if (normalizedBase === '/')
        return normalizedRoute;
    return `${normalizedBase}${normalizedRoute}`;
}
function normalizeSlashPath(value) {
    const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
    const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
    return withoutTrailingSlash.length === 0 ? '/' : withoutTrailingSlash;
}
function normalizeExpressPath(value) {
    return value.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
}
function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
run().catch((error) => {
    console.error('Failed to generate OpenAPI spec');
    console.error(error);
    process.exit(1);
});
