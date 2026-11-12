"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Article_1 = __importDefault(require("../models/Article"));
const env_1 = require("../utils/env");
async function backfill() {
    try {
        console.log('Connecting to database...');
        await mongoose_1.default.connect(env_1.env.ATLAS_URI);
        console.log('Connected.');
        const articles = await Article_1.default.find({
            $or: [
                { ownerId: { $exists: false } },
                { reviewStatus: { $exists: false } }
            ]
        });
        console.log(`Found ${articles.length} articles to backfill.`);
        for (const article of articles) {
            const updates = {};
            if (!article.ownerId) {
                // Assign to first author, or if none, we'll need a fallback.
                // For this script, we'll try authors[0].
                if (article.authors && article.authors.length > 0) {
                    const firstAuthor = article.authors[0];
                    if (firstAuthor && firstAuthor.authorId) {
                        updates.ownerId = firstAuthor.authorId;
                    }
                }
                else {
                    // Fallback to a system admin if possible, but let's just log it for now
                    console.warn(`Article ${article._id} (${article.title}) has no authors. Skipping ownerId.`);
                }
            }
            if (!article.reviewStatus) {
                updates.reviewStatus = article.published ? 'published' : 'draft';
            }
            if (Object.keys(updates).length > 0) {
                await Article_1.default.updateOne({ _id: article._id }, { $set: updates });
            }
        }
        console.log('Backfill complete.');
        process.exit(0);
    }
    catch (error) {
        console.error('Backfill failed:', error);
        process.exit(1);
    }
}
backfill();
