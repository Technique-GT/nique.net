const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const args = process.argv.slice(2);
const getArg = (name) => {
  const prefix = `--${name}=`;
  const hit = args.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
};

const filePath = getArg('file') || path.join(__dirname, 'Archive 2', 'new_articles.json');
const dbName = getArg('db') || process.env.MONGO_DB_NAME || 'test';
const uri = getArg('uri') || process.env.ATLAS_URI || process.env.MONGO_URI || process.env.MONGODB_URI;
const dryRun = args.includes('--dry-run');

if (!uri) {
  console.error('Missing Mongo URI. Set ATLAS_URI or pass --uri=...');
  process.exit(1);
}

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const normalizeName = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const titleCase = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
    .join(' ');

// Treat naive timestamps as UTC to keep ordering consistent.
const parseDate = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().replace(' ', 'T');
  const withZone = normalized.endsWith('Z') ? normalized : `${normalized}Z`;
  const date = new Date(withZone);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const ensureUniqueSlug = async (base, takenSlugs, articlesCol) => {
  let slug = base;
  let counter = 2;
  while (takenSlugs.has(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  // Check DB for conflicts if we just generated it.
  const exists = await articlesCol.findOne({ slug }, { projection: { _id: 1 } });
  if (exists) {
    takenSlugs.add(slug);
    return ensureUniqueSlug(base, takenSlugs, articlesCol);
  }
  takenSlugs.add(slug);
  return slug;
};

async function main() {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  const articles = Array.isArray(data.articles) ? data.articles : [];
  const attachments = Array.isArray(data.attachments) ? data.attachments : [];

  await mongoose.connect(uri, { dbName });
  const db = mongoose.connection.db;

  const categoriesCol = db.collection('categories');
  const subcategoriesCol = db.collection('subcategories');
  const usersCol = db.collection('users');
  const tagsCol = db.collection('tags');
  const mediaCol = db.collection('media');
  const articlesCol = db.collection('articles');

  const categoryNames = new Set();
  const authorNames = new Set();
  const tagNames = new Set();
  const subcategoryEntries = new Map();

  for (const article of articles) {
    const categories = Array.isArray(article.categories) ? article.categories : [];
    for (const category of categories) {
      const name = normalizeName(category);
      if (name) categoryNames.add(name);
    }

    const authors = Array.isArray(article.authors) ? article.authors : [];
    for (const author of authors) {
      const normalized = normalizeName(author);
      if (!normalized) continue;
      if (normalized.includes(',')) {
        const parts = normalized.split(',').map((part) => normalizeName(part)).filter(Boolean);
        parts.forEach((part) => authorNames.add(part));
      } else {
        authorNames.add(normalized);
      }
    }

    const tags = Array.isArray(article.tags) ? article.tags : [];
    for (const tag of tags) {
      const name = normalizeName(tag);
      if (name) tagNames.add(name);
    }

    const subcats = Array.isArray(article.subcategories) ? article.subcategories : [];
    for (const entry of subcats) {
      if (!entry || typeof entry !== 'object') continue;
      const rawCategory = normalizeName(entry.category);
      const rawValue = normalizeName(entry.value);
      if (!rawCategory || !rawValue) continue;
      const key = `${slugify(rawCategory)}|${slugify(rawValue)}`;
      subcategoryEntries.set(key, { category: rawCategory, value: rawValue });
    }
  }

  const categoryDocs = Array.from(categoryNames).map((name) => ({
    __v: 0,
    name: titleCase(name),
    slug: slugify(name),
  }));

  const existingCategories = await categoriesCol
    .find({ slug: { $in: categoryDocs.map((doc) => doc.slug) } })
    .toArray();
  const categoryIdBySlug = new Map(existingCategories.map((doc) => [doc.slug, doc._id]));
  const categoriesToInsert = categoryDocs.filter((doc) => !categoryIdBySlug.has(doc.slug));

  if (!dryRun && categoriesToInsert.length > 0) {
    const insertResult = await categoriesCol.insertMany(categoriesToInsert);
    Object.entries(insertResult.insertedIds).forEach(([_, id], idx) => {
      categoryIdBySlug.set(categoriesToInsert[idx].slug, id);
    });
  }

  const tagDocs = Array.from(tagNames).map((name) => ({
    __v: 0,
    name,
    slug: slugify(name),
  }));
  const existingTags = tagDocs.length
    ? await tagsCol.find({ slug: { $in: tagDocs.map((doc) => doc.slug) } }).toArray()
    : [];
  const tagIdBySlug = new Map(existingTags.map((doc) => [doc.slug, doc._id]));
  const tagsToInsert = tagDocs.filter((doc) => !tagIdBySlug.has(doc.slug));
  if (!dryRun && tagsToInsert.length > 0) {
    const insertResult = await tagsCol.insertMany(tagsToInsert);
    Object.entries(insertResult.insertedIds).forEach(([_, id], idx) => {
      tagIdBySlug.set(tagsToInsert[idx].slug, id);
    });
  }

  const subcategoryDocs = Array.from(subcategoryEntries.values())
    .map((entry) => {
      const categorySlug = slugify(entry.category);
      const categoryId = categoryIdBySlug.get(categorySlug);
      if (!categoryId) return null;
      return {
        __v: 0,
        categoryId,
        name: entry.value,
        slug: slugify(entry.value),
      };
    })
    .filter(Boolean);

  const subcategoryIdByKey = new Map();
  if (subcategoryDocs.length > 0) {
    const categoryIds = Array.from(new Set(subcategoryDocs.map((doc) => doc.categoryId)));
    const slugs = Array.from(new Set(subcategoryDocs.map((doc) => doc.slug)));
    const existingSubcategories = await subcategoriesCol
      .find({ categoryId: { $in: categoryIds }, slug: { $in: slugs } })
      .toArray();

    for (const doc of existingSubcategories) {
      subcategoryIdByKey.set(`${doc.categoryId.toString()}|${doc.slug}`, doc._id);
    }

    const subcategoriesToInsert = subcategoryDocs.filter((doc) => !subcategoryIdByKey.has(`${doc.categoryId.toString()}|${doc.slug}`));
    if (!dryRun && subcategoriesToInsert.length > 0) {
      const insertResult = await subcategoriesCol.insertMany(subcategoriesToInsert);
      Object.entries(insertResult.insertedIds).forEach(([_, id], idx) => {
        const doc = subcategoriesToInsert[idx];
        subcategoryIdByKey.set(`${doc.categoryId.toString()}|${doc.slug}`, id);
      });
    }
  }

  const authorList = Array.from(authorNames).filter(Boolean);
  const existingUsers = authorList.length
    ? await usersCol.find({ name: { $in: authorList } }).toArray()
    : [];
  const userIdByName = new Map(existingUsers.map((doc) => [doc.name, doc._id]));
  const usersToInsert = authorList
    .filter((name) => !userIdByName.has(name))
    .map((name) => ({ __v: 0, name, isAdmin: false, socialLinks: [] }));

  if (!dryRun && usersToInsert.length > 0) {
    const insertResult = await usersCol.insertMany(usersToInsert);
    Object.entries(insertResult.insertedIds).forEach(([_, id], idx) => {
      userIdByName.set(usersToInsert[idx].name, id);
    });
  }

  const fallbackUserName = 'Migration Bot';
  let fallbackUserId = userIdByName.get(fallbackUserName);
  if (!fallbackUserId) {
    if (!dryRun) {
      const result = await usersCol.insertOne({ __v: 0, name: fallbackUserName, isAdmin: false, socialLinks: [] });
      fallbackUserId = result.insertedId;
      userIdByName.set(fallbackUserName, fallbackUserId);
    }
  }

  const existingMedia = attachments.length
    ? await mediaCol.find({ url: { $in: attachments.map((att) => att.url).filter(Boolean) } }).toArray()
    : [];
  const mediaIdByUrl = new Map(existingMedia.map((doc) => [doc.url, doc._id]));
  const mediaIdByLegacyId = new Map();

  const mediaToInsert = [];
  for (const attachment of attachments) {
    if (!attachment || !attachment.url) continue;
    const url = attachment.url;
    const altText = normalizeName(attachment.caption || attachment.title || '');
    const existingId = mediaIdByUrl.get(url);
    if (existingId) {
      mediaIdByLegacyId.set(attachment.id, existingId);
      continue;
    }
    mediaToInsert.push({ __v: 0, url, altText });
  }

  if (!dryRun && mediaToInsert.length > 0) {
    const insertResult = await mediaCol.insertMany(mediaToInsert);
    Object.entries(insertResult.insertedIds).forEach(([_, id], idx) => {
      const doc = mediaToInsert[idx];
      mediaIdByUrl.set(doc.url, id);
    });
  }

  for (const attachment of attachments) {
    if (!attachment || !attachment.url) continue;
    const mediaId = mediaIdByUrl.get(attachment.url);
    if (mediaId) {
      mediaIdByLegacyId.set(attachment.id, mediaId);
    }
  }

  const takenSlugs = new Set();
  const articlesToInsert = [];
  const skipped = [];

  for (const article of articles) {
    const title = normalizeName(article.title);
    const content = article.content || '';
    if (!title || !content) {
      skipped.push({ title, reason: 'missing title or content' });
      continue;
    }

    const categoryName = normalizeName((article.categories || [])[0]);
    const categorySlug = slugify(categoryName);
    const categoryId = categoryIdBySlug.get(categorySlug);
    if (!categoryId) {
      skipped.push({ title, reason: `missing category: ${categoryName}` });
      continue;
    }

    let subcategoryId;
    const subcats = Array.isArray(article.subcategories) ? article.subcategories : [];
    if (subcats.length > 0) {
      const entry = subcats[0];
      const subName = normalizeName(entry && entry.value);
      const subSlug = slugify(subName);
      const key = `${categoryId.toString()}|${subSlug}`;
      subcategoryId = subcategoryIdByKey.get(key);
    }

    const authorNamesRaw = Array.isArray(article.authors) ? article.authors : [];
    const authorIds = [];
    for (const authorName of authorNamesRaw) {
      const normalized = normalizeName(authorName);
      if (!normalized) continue;
      const names = normalized.includes(',')
        ? normalized.split(',').map((part) => normalizeName(part)).filter(Boolean)
        : [normalized];
      for (const name of names) {
        const id = userIdByName.get(name);
        if (id) {
          authorIds.push(id);
        }
      }
    }

    const authors = authorIds.length > 0
      ? authorIds.map((id, idx) => ({ authorId: id, order: idx }))
      : fallbackUserId
        ? [{ authorId: fallbackUserId, order: 0 }]
        : [];

    if (authors.length === 0) {
      skipped.push({ title, reason: 'missing authors' });
      continue;
    }

    const tagIds = [];
    const tagList = Array.isArray(article.tags) ? article.tags : [];
    for (const tag of tagList) {
      const slug = slugify(tag);
      const id = tagIdBySlug.get(slug);
      if (id) tagIds.push(id);
    }

    const baseSlug = slugify(article.slug || title);
    const uniqueSlug = await ensureUniqueSlug(baseSlug, takenSlugs, articlesCol);

    const published = article.status === 'published' || article.status === 'publish' || article.status === true;
    const publishedAt = parseDate(article.publishedAt) || (published ? new Date() : null);
    const updatedAt = parseDate(article.updatedAt) || publishedAt || new Date();

    const featuredId = article.featuredImage != null ? mediaIdByLegacyId.get(article.featuredImage) : undefined;
    const imageCaption = article.featuredImage != null
      ? normalizeName((attachments.find((att) => att.id === article.featuredImage) || {}).caption)
      : undefined;

    const record = {
      __v: 0,
      title,
      slug: uniqueSlug,
      content,
      excerpt: article.excerpt || undefined,
      authors,
      categoryId,
      subcategoryId,
      tagIds,
      featuredMediaId: featuredId,
      imageCaption,
      published,
      publishedAt: published ? publishedAt : null,
      allowComments: Boolean(article.allowComments),
      isFeatured: false,
      isSticky: Boolean(article.isSticky),
      ownerId: authors[0].authorId,
      editorState: article.editorState || undefined,
      reviewStatus: published ? 'published' : 'draft',
      viewCount: Number.isFinite(article.viewCount) ? article.viewCount : 0,
      createdAt: publishedAt || new Date(),
      updatedAt,
    };

    articlesToInsert.push(record);
  }

  if (!dryRun && articlesToInsert.length > 0) {
    await articlesCol.insertMany(articlesToInsert);
  }

  console.log('Migration complete');
  console.log(`Categories: ${categoryDocs.length} (inserted ${categoriesToInsert.length})`);
  console.log(`Subcategories: ${subcategoryDocs.length}`);
  console.log(`Users: ${authorList.length} (inserted ${usersToInsert.length})`);
  console.log(`Tags: ${tagDocs.length} (inserted ${tagsToInsert.length})`);
  console.log(`Media: ${attachments.length} (inserted ${mediaToInsert.length})`);
  console.log(`Articles: ${articlesToInsert.length} (skipped ${skipped.length})`);

  if (skipped.length > 0) {
    console.log('Skipped articles:');
    skipped.slice(0, 10).forEach((entry) => {
      console.log(`- ${entry.title || '(untitled)'}: ${entry.reason}`);
    });
    if (skipped.length > 10) {
      console.log(`...and ${skipped.length - 10} more`);
    }
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
