import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

/**
 * fix-slugs.ts
 *
 * Scans articles for slugs containing spaces or special characters
 * and updates them to be URL-friendly (kebab-case).
 *
 * Usage:
 *   ATLAS_URI='...' pnpm tsx src/scripts/fix-slugs.ts
 *
 * Options:
 *   MONGO_DB_NAME=test        (default)
 *   DRY_RUN=true               (default false)
 */

const ATLAS_URI = process.env.ATLAS_URI;
if (!ATLAS_URI) {
  throw new Error('Missing ATLAS_URI in env');
}

const DB_NAME: string = process.env.MONGO_DB_NAME || 'test';
const DRY_RUN = process.env.DRY_RUN === 'true';

// Same slugify logic as article.controller.ts
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

if (DB_NAME === 'technique') {
  throw new Error('Refusing to run on production "technique" DB. Use a test DB.');
}

async function main() {
  const client = new MongoClient(ATLAS_URI as string);
  await client.connect();
  const db = client.db(DB_NAME as string);
  const collection = db.collection('articles');

  console.log(`Scanning articles in ${DB_NAME}...`);

  // Find slugs that likely need fixing: containing spaces, uppercase, or non-alphanumeric chars (except -)
  // We can just iterate all and check if slugify(slug) !== slug
  const cursor = collection.find({}, { projection: { _id: 1, title: 1, slug: 1 } });

  let total = 0;
  let fixed = 0;
  let skipped = 0;

  for await (const doc of cursor) {
    total++;
    const currentSlug = typeof doc.slug === 'string' ? doc.slug : '';
    
    if (!currentSlug) {
      // If slug is missing, generate from title
      const newSlug = slugify(doc.title || `untitled-${doc._id}`);
      await updateSlug(collection, doc._id, newSlug);
      fixed++;
      continue;
    }

    const newSlug = slugify(currentSlug);

    if (newSlug !== currentSlug) {
      await updateSlug(collection, doc._id, newSlug);
      fixed++;
    } else {
      skipped++;
    }
  }

  console.log('Finished.');
  console.log(`Total scanned: ${total}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Skipped (already valid): ${skipped}`);

  await client.close();
}

async function updateSlug(collection: any, id: ObjectId, baseSlug: string) {
  let finalSlug = baseSlug;
  let counter = 1;

  // Ensure uniqueness
  while (true) {
    const existing = await collection.findOne({ slug: finalSlug, _id: { $ne: id } }, { projection: { _id: 1 } });
    if (!existing) break;
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would update ${id} slug to "${finalSlug}"`);
  } else {
    await collection.updateOne({ _id: id }, { $set: { slug: finalSlug } });
    // console.log(`Updated ${id} -> ${finalSlug}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
