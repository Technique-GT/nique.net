"use strict";
/**
 * dump-validators.ts
 *
 * Extracts $jsonSchema validators from MongoDB collections and outputs them
 * in the canonical-contract.json format.
 *
 * Usage:
 *   pnpm tsx src/scripts/dump-validators.ts              # Write to json-schemas/canonical-contract.json (fails if exists)
 *   pnpm tsx src/scripts/dump-validators.ts --stdout     # Print to stdout instead
 *   pnpm tsx src/scripts/dump-validators.ts --force      # Overwrite existing file
 *   pnpm tsx src/scripts/dump-validators.ts --check      # Compare DB to contract, exit 1 if different
 *   MONGO_DB_NAME=technique pnpm tsx src/scripts/dump-validators.ts --stdout
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const mongodb_1 = require("mongodb");
const ATLAS_URI = process.env.ATLAS_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'test';
const OUTPUT_PATH = node_path_1.default.resolve(__dirname, '../../json-schemas/canonical-contract.json');
/**
 * Deep compare two validator objects, ignoring key order and formatting
 */
function deepEqual(a, b) {
    if (a === b)
        return true;
    if (typeof a !== typeof b)
        return false;
    if (a === null || b === null)
        return a === b;
    if (typeof a !== 'object')
        return false;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length)
            return false;
        // Sort arrays of primitives for comparison
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        return sortedA.every((val, i) => deepEqual(val, sortedB[i]));
    }
    if (Array.isArray(a) || Array.isArray(b))
        return false;
    const aObj = a;
    const bObj = b;
    const keysA = Object.keys(aObj).sort();
    const keysB = Object.keys(bObj).sort();
    if (keysA.length !== keysB.length)
        return false;
    if (!keysA.every((k, i) => k === keysB[i]))
        return false;
    return keysA.every((k) => deepEqual(aObj[k], bObj[k]));
}
/**
 * Find differences between DB validators and contract
 */
function findDifferences(dbValidators, contractValidators) {
    const dbByName = new Map(dbValidators.map((v) => [v.collection, v]));
    const contractByName = new Map(contractValidators.map((v) => [v.collection, v]));
    const missing = []; // In contract but not in DB
    const extra = []; // In DB but not in contract
    const different = []; // In both but different
    for (const [name, contractV] of contractByName) {
        const dbV = dbByName.get(name);
        if (!dbV) {
            missing.push(name);
        }
        else if (!deepEqual(dbV, contractV)) {
            different.push(name);
        }
    }
    for (const name of dbByName.keys()) {
        if (!contractByName.has(name)) {
            extra.push(name);
        }
    }
    return { missing, extra, different };
}
async function fetchValidators(client, dbName) {
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    const validators = [];
    for (const collInfo of collections) {
        if (collInfo.name.startsWith('system.'))
            continue;
        const options = collInfo.options || {};
        if (options.validator && Object.keys(options.validator).length > 0) {
            validators.push({
                collection: collInfo.name,
                validationLevel: options.validationLevel || 'moderate',
                validationAction: options.validationAction || 'error',
                validator: options.validator,
            });
        }
    }
    validators.sort((a, b) => a.collection.localeCompare(b.collection));
    return validators;
}
async function main() {
    const args = process.argv.slice(2);
    const toStdout = args.includes('--stdout');
    const force = args.includes('--force');
    const check = args.includes('--check');
    if (!ATLAS_URI) {
        console.error('Error: ATLAS_URI environment variable is required');
        process.exit(1);
    }
    const client = new mongodb_1.MongoClient(ATLAS_URI);
    try {
        await client.connect();
        console.error(`Connected to database: ${DB_NAME}`);
        const dbValidators = await fetchValidators(client, DB_NAME);
        // --check mode: compare against contract file
        if (check) {
            if (!(0, node_fs_1.existsSync)(OUTPUT_PATH)) {
                console.error(`Error: Contract file not found: ${OUTPUT_PATH}`);
                process.exit(1);
            }
            const contractContent = (0, node_fs_1.readFileSync)(OUTPUT_PATH, 'utf-8');
            const contractValidators = JSON.parse(contractContent);
            const { missing, extra, different } = findDifferences(dbValidators, contractValidators);
            if (missing.length === 0 && extra.length === 0 && different.length === 0) {
                console.log('✓ DB validators match the contract');
                process.exit(0);
            }
            console.error('✗ DB validators differ from contract:\n');
            if (missing.length > 0) {
                console.error('  Missing from DB (in contract but not in DB):');
                missing.forEach((n) => console.error(`    - ${n}`));
            }
            if (extra.length > 0) {
                console.error('  Extra in DB (not in contract):');
                extra.forEach((n) => console.error(`    - ${n}`));
            }
            if (different.length > 0) {
                console.error('  Different validators:');
                different.forEach((n) => console.error(`    - ${n}`));
            }
            console.error('\nRun with --stdout to see current DB validators.');
            console.error('Run with --force to update the contract from DB.');
            process.exit(1);
        }
        // Check if output file exists (unless --stdout or --force)
        if (!toStdout && !force && (0, node_fs_1.existsSync)(OUTPUT_PATH)) {
            console.error(`Error: ${OUTPUT_PATH} already exists.`);
            console.error('Use --force to overwrite, --check to compare, or --stdout to print.');
            process.exit(1);
        }
        const output = JSON.stringify(dbValidators, null, 2) + '\n';
        if (toStdout) {
            console.log(output);
        }
        else {
            (0, node_fs_1.writeFileSync)(OUTPUT_PATH, output, 'utf-8');
            console.error(`Wrote ${dbValidators.length} validators to ${OUTPUT_PATH}`);
        }
        console.error(`\nCollections with validators (${dbValidators.length}):`);
        for (const v of dbValidators) {
            console.error(`  - ${v.collection}`);
        }
    }
    catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
main();
