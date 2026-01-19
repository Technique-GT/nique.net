const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const args = process.argv.slice(2);
const getArg = (name) => {
  const prefix = `--${name}=`;
  const hit = args.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
};

const filePath = getArg('file') || path.join(__dirname, 'Archive 2', 'normalized-articles.json');
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

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  const str = String(value);
  if (!mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
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

  const looksNormalized =
    Array.isArray(data.users) ||
    Array.isArray(data.categories) ||
    Array.isArray(data.tags) ||
    Array.isArray(data.media) ||
    Array.isArray(data.subcategories);

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

  if (looksNormalized) {
    const normalizedUsers = Array.isArray(data.users) ? data.users : [];
    const normalizedCategories = Array.isArray(data.categories) ? data.categories : [];
    const normalizedTags = Array.isArray(data.tags) ? data.tags : [];
    const normalizedMedia = Array.isArray(data.media) ? data.media : [];
    const normalizedSubcategories = Array.isArray(data.subcategories) ? data.subcategories : [];

    const existingCategories = await categoriesCol
      .find({
        $or: [
          { _id: { $in: normalizedCategories.map((cat) => toObjectId(cat._id)).filter(Boolean) } },
          { slug: { $in: normalizedCategories.map((cat) => slugify(cat.slug || cat.name)).filter(Boolean) } },
        ],
      })
      .toArray();
    const categoryById = new Map(existingCategories.map((doc) => [doc._id.toString(), doc]));
    const categoryBySlug = new Map(existingCategories.map((doc) => [doc.slug, doc]));
    const categoryIdByLegacy = new Map();

    for (const category of normalizedCategories) {
      const slug = slugify(category.slug || category.name);
      if (!slug) continue;
      const legacyId = toObjectId(category._id);
      const existing = (legacyId && categoryById.get(legacyId.toString())) || categoryBySlug.get(slug);
      if (existing) {
        categoryIdByLegacy.set(String(category._id), existing._id);
        continue;
      }
      if (dryRun) {
        categoryIdByLegacy.set(String(category._id), legacyId || new mongoose.Types.ObjectId());
        continue;
      }
      const record = {
        _id: legacyId || new mongoose.Types.ObjectId(),
        __v: 0,
        name: category.name || category.slug || slug,
        slug,
      };
      await categoriesCol.insertOne(record);
      categoryIdByLegacy.set(String(category._id), record._id);
    }

    const existingTags = await tagsCol
      .find({
        $or: [
          { _id: { $in: normalizedTags.map((tag) => toObjectId(tag._id)).filter(Boolean) } },
          { slug: { $in: normalizedTags.map((tag) => slugify(tag.slug || tag.name)).filter(Boolean) } },
        ],
      })
      .toArray();
    const tagById = new Map(existingTags.map((doc) => [doc._id.toString(), doc]));
    const tagBySlug = new Map(existingTags.map((doc) => [doc.slug, doc]));
    const tagIdByLegacy = new Map();

    for (const tag of normalizedTags) {
      const slug = slugify(tag.slug || tag.name);
      if (!slug) continue;
      const legacyId = toObjectId(tag._id);
      const existing = (legacyId && tagById.get(legacyId.toString())) || tagBySlug.get(slug);
      if (existing) {
        tagIdByLegacy.set(String(tag._id), existing._id);
        continue;
      }
      if (dryRun) {
        tagIdByLegacy.set(String(tag._id), legacyId || new mongoose.Types.ObjectId());
        continue;
      }
      const record = {
        _id: legacyId || new mongoose.Types.ObjectId(),
        __v: 0,
        name: tag.name || tag.slug || slug,
        slug,
      };
      await tagsCol.insertOne(record);
      tagIdByLegacy.set(String(tag._id), record._id);
    }

    const existingUsers = await usersCol
      .find({
        $or: [
          { _id: { $in: normalizedUsers.map((user) => toObjectId(user._id)).filter(Boolean) } },
          { email: { $in: normalizedUsers.map((user) => user.email).filter(Boolean) } },
          { name: { $in: normalizedUsers.map((user) => user.name).filter(Boolean) } },
        ],
      })
      .toArray();
    const userById = new Map(existingUsers.map((doc) => [doc._id.toString(), doc]));
    const userByEmail = new Map(existingUsers.map((doc) => [doc.email, doc]));
    const userByName = new Map(existingUsers.map((doc) => [doc.name, doc]));
    const userIdByLegacy = new Map();

    for (const user of normalizedUsers) {
      const legacyId = toObjectId(user._id);
      const existing =
        (legacyId && userById.get(legacyId.toString())) ||
        (user.email && userByEmail.get(user.email)) ||
        (user.name && userByName.get(user.name));
      if (existing) {
        userIdByLegacy.set(String(user._id), existing._id);
        continue;
      }
      if (dryRun) {
        userIdByLegacy.set(String(user._id), legacyId || new mongoose.Types.ObjectId());
        continue;
      }
      const record = {
        _id: legacyId || new mongoose.Types.ObjectId(),
        __v: 0,
        name: user.name || 'Unknown Author',
        isAdmin: Boolean(user.isAdmin),
        ...(user.email ? { email: user.email } : {}),
        ...(user.googleSub ? { googleSub: user.googleSub } : {}),
        ...(user.profilePictureMediaId
          ? { profilePictureMediaId: toObjectId(user.profilePictureMediaId) }
          : {}),
        socialLinks: Array.isArray(user.socialLinks) ? user.socialLinks : [],
      };
      await usersCol.insertOne(record);
      userIdByLegacy.set(String(user._id), record._id);
    }

    const existingMedia = await mediaCol
      .find({
        $or: [
          { _id: { $in: normalizedMedia.map((media) => toObjectId(media._id)).filter(Boolean) } },
          { url: { $in: normalizedMedia.map((media) => media.url).filter(Boolean) } },
        ],
      })
      .toArray();
    const mediaById = new Map(existingMedia.map((doc) => [doc._id.toString(), doc]));
    const mediaByUrl = new Map(existingMedia.map((doc) => [doc.url, doc]));
    const mediaIdByLegacy = new Map();

    for (const media of normalizedMedia) {
      const legacyId = toObjectId(media._id);
      const existing = (legacyId && mediaById.get(legacyId.toString())) || (media.url && mediaByUrl.get(media.url));
      if (existing) {
        mediaIdByLegacy.set(String(media._id), existing._id);
        continue;
      }
      if (dryRun) {
        mediaIdByLegacy.set(String(media._id), legacyId || new mongoose.Types.ObjectId());
        continue;
      }
      const record = {
        _id: legacyId || new mongoose.Types.ObjectId(),
        __v: 0,
        url: media.url,
        altText: media.altText || '',
      };
      await mediaCol.insertOne(record);
      mediaIdByLegacy.set(String(media._id), record._id);
    }

    const existingSubcategories = await subcategoriesCol
      .find({
        $or: [
          { _id: { $in: normalizedSubcategories.map((sub) => toObjectId(sub._id)).filter(Boolean) } },
          { slug: { $in: normalizedSubcategories.map((sub) => slugify(sub.slug || sub.name)).filter(Boolean) } },
        ],
      })
      .toArray();
    const subcategoryById = new Map(existingSubcategories.map((doc) => [doc._id.toString(), doc]));
    const subcategoryByKey = new Map(
      existingSubcategories.map((doc) => [`${doc.categoryId.toString()}|${doc.slug}`, doc]),
    );
    const subcategoryIdByLegacy = new Map();

    for (const subcategory of normalizedSubcategories) {
      const legacyId = toObjectId(subcategory._id);
      const categoryId = categoryIdByLegacy.get(String(subcategory.categoryId)) || toObjectId(subcategory.categoryId);
      const slug = slugify(subcategory.slug || subcategory.name);
      if (!slug || !categoryId) continue;
      const existing =
        (legacyId && subcategoryById.get(legacyId.toString())) ||
        subcategoryByKey.get(`${categoryId.toString()}|${slug}`);
      if (existing) {
        subcategoryIdByLegacy.set(String(subcategory._id), existing._id);
        continue;
      }
      if (dryRun) {
        subcategoryIdByLegacy.set(String(subcategory._id), legacyId || new mongoose.Types.ObjectId());
        continue;
      }
      const record = {
        _id: legacyId || new mongoose.Types.ObjectId(),
        __v: 0,
        categoryId,
        name: subcategory.name || subcategory.slug || slug,
        slug,
      };
      await subcategoriesCol.insertOne(record);
      subcategoryIdByLegacy.set(String(subcategory._id), record._id);
    }

    const existingArticles = await articlesCol
      .find({
        $or: [
          { _id: { $in: articles.map((article) => toObjectId(article._id)).filter(Boolean) } },
          { slug: { $in: articles.map((article) => slugify(article.slug || article.title)).filter(Boolean) } },
        ],
      })
      .project({ _id: 1, slug: 1 })
      .toArray();
    const articleById = new Map(existingArticles.map((doc) => [doc._id.toString(), doc]));
    const articleBySlug = new Map(existingArticles.map((doc) => [doc.slug, doc]));

    const articlesToInsert = [];
    const skipped = [];

    for (const article of articles) {
      const legacyId = toObjectId(article._id);
      const slug = slugify(article.slug || article.title);
      if ((legacyId && articleById.has(legacyId.toString())) || (slug && articleBySlug.has(slug))) {
        skipped.push({ title: article.title, reason: 'already exists' });
        continue;
      }

      const authors = Array.isArray(article.authors)
        ? article.authors
            .map((author) => {
              const authorId = userIdByLegacy.get(String(author.authorId)) || toObjectId(author.authorId);
              if (!authorId) return null;
              return { authorId, order: author.order || 0 };
            })
            .filter(Boolean)
        : [];

      if (authors.length === 0) {
        skipped.push({ title: article.title, reason: 'missing authors' });
        continue;
      }

      const tagIds = Array.isArray(article.tagIds)
        ? article.tagIds
            .map((tagId) => tagIdByLegacy.get(String(tagId)) || toObjectId(tagId))
            .filter(Boolean)
        : [];

      const record = {
        _id: legacyId || new mongoose.Types.ObjectId(),
        __v: 0,
        title: article.title || 'Untitled Article',
        slug: article.slug || slug,
        content: article.content || '',
        excerpt: article.excerpt || undefined,
        authors,
        categoryId:
          categoryIdByLegacy.get(String(article.categoryId)) || toObjectId(article.categoryId) || undefined,
        subcategoryId:
          subcategoryIdByLegacy.get(String(article.subcategoryId)) ||
          toObjectId(article.subcategoryId) ||
          undefined,
        tagIds,
        featuredMediaId:
          mediaIdByLegacy.get(String(article.featuredMediaId)) ||
          toObjectId(article.featuredMediaId) ||
          undefined,
        imageCaption: article.imageCaption || undefined,
        published: Boolean(article.published),
        publishedAt: article.publishedAt ? parseDate(article.publishedAt) : null,
        allowComments: article.allowComments !== undefined ? Boolean(article.allowComments) : true,
        isFeatured: Boolean(article.isFeatured),
        isSticky: Boolean(article.isSticky),
        ownerId:
          userIdByLegacy.get(String(article.ownerId)) || toObjectId(article.ownerId) || authors[0].authorId,
        editorState: article.editorState || undefined,
        reviewStatus: article.reviewStatus || (article.published ? 'published' : 'draft'),
        hasPendingChanges: Boolean(article.hasPendingChanges),
        reviewedAt: article.reviewedAt ? parseDate(article.reviewedAt) : undefined,
        reviewedBy:
          userIdByLegacy.get(String(article.reviewedBy)) || toObjectId(article.reviewedBy) || undefined,
        reviewNotes: article.reviewNotes || undefined,
        viewCount: Number.isFinite(article.viewCount) ? article.viewCount : 0,
        createdAt: article.createdAt ? parseDate(article.createdAt) : new Date(),
        updatedAt: article.updatedAt ? parseDate(article.updatedAt) : new Date(),
      };

      articlesToInsert.push(record);
    }

    if (!dryRun && articlesToInsert.length > 0) {
      await articlesCol.insertMany(articlesToInsert);
    }

    console.log('Migration complete (normalized payload)');
    console.log(`Categories: ${normalizedCategories.length}`);
    console.log(`Subcategories: ${normalizedSubcategories.length}`);
    console.log(`Users: ${normalizedUsers.length}`);
    console.log(`Tags: ${normalizedTags.length}`);
    console.log(`Media: ${normalizedMedia.length}`);
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
    return;
  }

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
