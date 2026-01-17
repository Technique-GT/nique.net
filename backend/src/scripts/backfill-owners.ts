import mongoose from 'mongoose';
import Article from '../models/Article';
import { env } from '../utils/env';

async function backfill() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(env.ATLAS_URI);
    console.log('Connected.');

    const articles = await Article.find({ 
      $or: [
        { ownerId: { $exists: false } },
        { reviewStatus: { $exists: false } }
      ]
    });

    console.log(`Found ${articles.length} articles to backfill.`);

    for (const article of articles) {
      const updates: any = {};
      
      if (!article.ownerId) {
        // Assign to first author, or if none, we'll need a fallback.
        // For this script, we'll try authors[0].
        if (article.authors && article.authors.length > 0) {
          const firstAuthor = article.authors[0];
          if (firstAuthor && firstAuthor.authorId) {
            updates.ownerId = firstAuthor.authorId;
          }
        } else {
          // Fallback to a system admin if possible, but let's just log it for now
          console.warn(`Article ${article._id} (${article.title}) has no authors. Skipping ownerId.`);
        }
      }

      if (!article.reviewStatus) {
        updates.reviewStatus = article.published ? 'published' : 'draft';
      }

      if (Object.keys(updates).length > 0) {
        await Article.updateOne({ _id: article._id }, { $set: updates });
      }
    }

    console.log('Backfill complete.');
    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  }
}

backfill();
