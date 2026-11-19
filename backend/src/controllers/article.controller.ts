import type { Request, Response } from "express";
import mongoose from "mongoose";
import { applyNoStoreHeaders } from "../middleware/public-cache.middleware";
import Article, { type IArticle } from "../models/Article";
import User from "../models/User";
import { ArticleCacheInvalidationService } from "../services/article-cache-invalidation.service";
import { NotificationService } from "../services/notification.service";
import {
    articleCacheSnapshotFromDoc,
    buildDetailCacheTags,
    buildListCacheTags,
    setCacheTags,
} from "../utils/cache-tags";
import {
    canDeleteArticle,
    canEditArticle,
    canManageAuthors,
    canPublishArticle,
} from "../utils/permissions";
import { safeErrorResponse, safeRegex, sanitizeHtml } from "../utils/security";

const buildMediaVariants = (basePath: string) => [
    { width: 400, format: "avif", url: `${basePath}variants/400w.avif` },
    { width: 800, format: "avif", url: `${basePath}variants/800w.avif` },
    { width: 1600, format: "avif", url: `${basePath}variants/1600w.avif` },
    { width: 400, format: "webp", url: `${basePath}variants/400w.webp` },
    { width: 800, format: "webp", url: `${basePath}variants/800w.webp` },
    { width: 1600, format: "webp", url: `${basePath}variants/1600w.webp` },
];

const attachVirtualMediaVariants = (articleDoc: any) => {
    const obj = articleDoc?.toObject ? articleDoc.toObject() : articleDoc;
    if (!obj) return obj;

    if (obj.featuredMedia && typeof obj.featuredMedia === "object") {
        if (
            !obj.featuredMedia.variants ||
            obj.featuredMedia.variants.length === 0
        ) {
            const imageUrl = obj.featuredMedia.url || obj.featuredMediaUrl;
            if (imageUrl) {
                const basePath = imageUrl.substring(
                    0,
                    imageUrl.lastIndexOf("/") + 1,
                );
                obj.featuredMedia.variants = buildMediaVariants(basePath);
            }
        }
    } else {
        const imageUrl = obj.featuredMediaUrl;
        if (imageUrl) {
            const basePath = imageUrl.substring(
                0,
                imageUrl.lastIndexOf("/") + 1,
            );
            obj.featuredMedia = {
                url: imageUrl,
                variants: buildMediaVariants(basePath),
            };
        }
    }

    return obj;
};

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

const toObjectId = (
    id: string | string[] | undefined,
): mongoose.Types.ObjectId | null => {
    if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id))
        return null;
    return new mongoose.Types.ObjectId(id);
};

const toObjectIdArray = (ids: any): mongoose.Types.ObjectId[] => {
    if (!Array.isArray(ids)) return [];
    return ids
        .map((id) =>
            typeof id === "string" && mongoose.Types.ObjectId.isValid(id)
                ? new mongoose.Types.ObjectId(id)
                : null,
        )
        .filter((v): v is mongoose.Types.ObjectId => v !== null);
};

const populateArticle = (query: any) =>
    query
        .populate("categoryId", "name slug")
        .populate("subcategoryId", "name slug categoryId")
        .populate("tagIds", "name slug")
        .populate("authors.authorId", "name isAdmin profilePictureUrl")
        .populate({
            path: "featuredMedia",
            strictPopulate: false,
        });

const populateArticleForFeed = (query: any) =>
    query
        .populate("categoryId", "name slug")
        .populate("tagIds", "name slug")
        .populate("authors.authorId", "name profilePictureUrl")
        .populate({
            path: "featuredMedia",
            strictPopulate: false,
        });

const snapshotArticle = (article: Partial<IArticle> | null | undefined) =>
    articleCacheSnapshotFromDoc(article as IArticle | null | undefined);

const invalidatePublicArticleCache = async (
    params: Parameters<
        typeof ArticleCacheInvalidationService.invalidatePublicArticleCache
    >[0],
) => {
    await ArticleCacheInvalidationService.invalidatePublicArticleCache(params);
};

const parsePublishedAt = (
    body: any,
    published: boolean,
    existingPublishedAt?: Date | null,
): Date | null => {
    if (body?.publishedAt instanceof Date) return body.publishedAt;
    if (typeof body?.publishedAt === "string") {
        const t = Date.parse(body.publishedAt);
        if (!Number.isNaN(t)) return new Date(t);
    }

    if (published) {
        return existingPublishedAt ?? new Date();
    }

    return null;
};

const buildArticleUpdate = async (params: {
    body: any;
    existing?: IArticle | null;
}): Promise<Partial<IArticle>> => {
    const { body, existing } = params;

    const title = typeof body?.title === "string" ? body.title : undefined;
    const content =
        typeof body?.content === "string"
            ? sanitizeHtml(body.content)
            : undefined;

    const categoryId =
        toObjectId(body?.categoryId ?? body?.category) ?? undefined;
    const subcategoryId =
        toObjectId(body?.subcategoryId ?? body?.subcategory) ?? undefined;

    let tagIds: mongoose.Types.ObjectId[] | undefined;
    if (body?.tagIds !== undefined || body?.tags !== undefined) {
        tagIds = toObjectIdArray(body?.tagIds ?? body?.tags);
    }

    let authors: any[] | undefined;
    if (body?.authors !== undefined || body?.authorIds !== undefined) {
        if (Array.isArray(body?.authors)) {
            if (
                body.authors.length > 0 &&
                typeof body.authors[0] === "object" &&
                body.authors[0] !== null &&
                (body.authors[0] as any).authorId
            ) {
                authors = body.authors
                    .map((a: any, idx: number) => {
                        const authorId = toObjectId(a?.authorId);
                        if (!authorId) return null;
                        const order =
                            typeof a?.order === "number" ? a.order : idx;
                        return { authorId, order };
                    })
                    .filter(Boolean);
            } else {
                const ids = toObjectIdArray(body.authors);
                authors = ids.map((authorId, idx) => ({
                    authorId,
                    order: idx,
                }));
            }
        } else if (Array.isArray(body?.authorIds)) {
            const ids = toObjectIdArray(body.authorIds);
            authors = ids.map((authorId, idx) => ({ authorId, order: idx }));
        }
    }

    const featuredMediaUrlRaw =
        typeof body?.featuredMediaUrl === "string"
            ? body.featuredMediaUrl.trim()
            : "";
    const featuredMediaUrl =
        featuredMediaUrlRaw.length > 0 ? featuredMediaUrlRaw : undefined;
    const youtubeVideoId =
        typeof body?.youtubeVideoId === "string" ||
        body?.youtubeVideoId === null
            ? body.youtubeVideoId
            : undefined;
    const imageCaption =
        typeof body?.imageCaption === "string" ? body.imageCaption : undefined;

    const published =
        typeof body?.published === "boolean" ? body.published : undefined;
    const allowComments =
        typeof body?.allowComments === "boolean"
            ? body.allowComments
            : undefined;
    const isFeatured =
        typeof body?.isFeatured === "boolean" ? body.isFeatured : undefined;
    const isSticky =
        typeof body?.isSticky === "boolean" ? body.isSticky : undefined;

    const editorState = body?.editorState;
    const reviewStatus = body?.reviewStatus;

    let publishedAt: Date | null | undefined;
    if (published === true) {
        publishedAt = parsePublishedAt(
            body,
            true,
            existing?.publishedAt ?? null,
        );
    }

    const update: Partial<IArticle> = {};

    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (categoryId) update.categoryId = categoryId;
    if (subcategoryId !== undefined) update.subcategoryId = subcategoryId;

    if (authors !== undefined) update.authors = authors as any;
    if (tagIds !== undefined) update.tagIds = tagIds as any;

    if (featuredMediaUrl !== undefined)
        update.featuredMediaUrl = featuredMediaUrl;
    if (youtubeVideoId !== undefined) update.youtubeVideoId = youtubeVideoId;
    if (imageCaption !== undefined) update.imageCaption = imageCaption;

    if (editorState !== undefined) update.editorState = editorState;
    if (reviewStatus !== undefined) update.reviewStatus = reviewStatus;

    if (published !== undefined) {
        update.published = published;
        if (publishedAt !== undefined) {
            update.publishedAt = publishedAt;
        } else if (published === false) {
            update.publishedAt = null;
        }
    }

    if (allowComments !== undefined) update.allowComments = allowComments;

    const resultingPublished =
        published !== undefined ? published : (existing?.published ?? false);

    if (isFeatured !== undefined) {
        update.isFeatured = resultingPublished ? isFeatured : false;
    } else if (!resultingPublished && existing?.isFeatured) {
        update.isFeatured = false;
    }

    if (isSticky !== undefined) {
        update.isSticky = resultingPublished ? isSticky : false;
    } else if (!resultingPublished && existing?.isSticky) {
        update.isSticky = false;
    }

    if (
        !resultingPublished &&
        (update.published === false || existing?.published)
    ) {
        if (update.publishedAt === undefined) {
            update.publishedAt = null;
        }
    }

    return update;
};

const idsAreEqual = (id1: any, id2: any): boolean => {
    if (!id1 && !id2) return true;
    if (!id1 || !id2) return false;
    return id1.toString() === id2.toString();
};

const arraysAreEqual = (
    arr1: any[],
    arr2: any[],
    comparator: (a: any, b: any) => boolean,
): boolean => {
    if (!arr1 && !arr2) return true;
    if (!arr1 || !arr2) return false;
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => comparator(item, arr2[index]));
};

const hasArticleChanged = (
    existing: IArticle,
    update: Partial<IArticle>,
): boolean => {
    if (update.title !== undefined && update.title !== existing.title)
        return true;
    if (update.content !== undefined && update.content !== existing.content)
        return true;
    if (
        "categoryId" in update &&
        !idsAreEqual(update.categoryId, existing.categoryId)
    )
        return true;
    if (
        "subcategoryId" in update &&
        !idsAreEqual(update.subcategoryId, existing.subcategoryId)
    )
        return true;
    if (
        "featuredMediaUrl" in update &&
        update.featuredMediaUrl !== existing.featuredMediaUrl
    )
        return true;
    if (
        "youtubeVideoId" in update &&
        update.youtubeVideoId !== existing.youtubeVideoId
    )
        return true;

    if (
        update.tagIds &&
        !arraysAreEqual(update.tagIds, existing.tagIds, idsAreEqual)
    )
        return true;

    if (update.authors) {
        const authorsChanged = !arraysAreEqual(
            update.authors,
            existing.authors,
            (a, b) =>
                idsAreEqual(a.authorId, b.authorId) && a.order === b.order,
        );
        if (authorsChanged) return true;
    }

    if (update.editorState) {
        try {
            if (
                JSON.stringify(update.editorState) !==
                JSON.stringify(existing.editorState)
            )
                return true;
        } catch {
            return true;
        }
    }

    if (
        update.imageCaption !== undefined &&
        update.imageCaption !== existing.imageCaption
    )
        return true;

    return false;
};

export const createArticle = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const ownerId = (req as any)?.user?.id;
        if (!ownerId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const titleRaw =
            typeof req.body?.title === "string" ? req.body.title : "";
        const contentRaw =
            typeof req.body?.content === "string" ? req.body.content : "";

        const title = titleRaw.trim();
        const content = contentRaw;

        if (!title) {
            res.status(400).json({
                success: false,
                message: "Title is required",
            });
            return;
        }

        if (!content) {
            res.status(400).json({
                success: false,
                message: "Content is required",
            });
            return;
        }

        const slug =
            typeof req.body?.slug === "string" &&
            req.body.slug.trim().length > 0
                ? req.body.slug.trim()
                : `${slugify(title)}-${Date.now()}`;

        const existing = await Article.findOne({ slug });
        if (existing) {
            res.status(409).json({
                success: false,
                message: "An article with this slug already exists",
            });
            return;
        }

        const update = await buildArticleUpdate({
            body: { ...req.body, title, content },
        });

        const categoryId = update.categoryId;
        if (!categoryId) {
            res.status(400).json({
                success: false,
                message: "categoryId is required",
            });
            return;
        }

        const authors =
            update.authors && update.authors.length > 0
                ? update.authors
                : [
                      {
                          authorId: new mongoose.Types.ObjectId(ownerId),
                          order: 0,
                      },
                  ];
        const tagIds = update.tagIds ?? [];

        const article = await Article.create({
            ...update,
            slug,
            authors,
            ownerId,
            tagIds,
            viewCount: 0,
        });

        const populatedArticle = await populateArticle(
            Article.findById(article._id),
        );

        await invalidatePublicArticleCache({
            before: null,
            after: snapshotArticle(article),
            mutationType: "create",
        });

        res.status(201).json({
            success: true,
            message: "Article created successfully",
            data: populatedArticle,
        });
    } catch (error: any) {
        if (error?.code === 11000) {
            res.status(409).json({
                success: false,
                message: "Duplicate key error",
            });
            return;
        }
        res.status(500).json(
            safeErrorResponse("Failed to create article", error),
        );
    }
};

export const getArticles = async (req: any, res: Response): Promise<void> => {
    try {
        const {
            page,
            limit,
            search,
            status,
            categoryId,
            subcategoryId,
            isFeatured,
            isSticky,
            hideDrafts,
        } = req.query;
        const andFilters: any[] = [];
        const orFilters: any[] = [];

        if (typeof search === "string" && search.trim().length > 0) {
            const rx = safeRegex(search.trim());
            orFilters.push({ title: rx }, { excerpt: rx });

            const matchedUsers = await User.find({ name: rx }).select("_id");
            if (matchedUsers.length > 0) {
                orFilters.push({
                    "authors.authorId": { $in: matchedUsers.map((u) => u._id) },
                });
            }
        }

        if (typeof categoryId === "string") {
            const categoryObjectId = toObjectId(categoryId);
            if (categoryObjectId) {
                andFilters.push({ categoryId: categoryObjectId });
            }
        }

        if (typeof subcategoryId === "string") {
            const subcategoryObjectId = toObjectId(subcategoryId);
            if (subcategoryObjectId) {
                andFilters.push({ subcategoryId: subcategoryObjectId });
            }
        }

        if (typeof status === "string") {
            if (status === "published" || status === "draft") {
                andFilters.push({
                    $or: [
                        { reviewStatus: status },
                        {
                            reviewStatus: { $exists: false },
                            published: status === "published",
                        },
                    ],
                });
            } else {
                andFilters.push({ reviewStatus: status });
            }
        }

        if (hideDrafts === true || hideDrafts === "true") {
            andFilters.push({ reviewStatus: { $ne: "draft" } });
        }

        if (typeof isFeatured === "boolean") {
            andFilters.push({ isFeatured });
        } else if (isFeatured === "true" || isFeatured === "false") {
            andFilters.push({ isFeatured: isFeatured === "true" });
        }

        if (typeof isSticky === "boolean") {
            andFilters.push({ isSticky });
        } else if (isSticky === "true" || isSticky === "false") {
            andFilters.push({ isSticky: isSticky === "true" });
        }

        if (req.user && !req.user.isAdmin) {
            const userId = new mongoose.Types.ObjectId(req.user.id);
            andFilters.push({
                $or: [{ ownerId: userId }, { "authors.authorId": userId }],
            });
        }

        if (orFilters.length > 0) {
            andFilters.push({ $or: orFilters });
        }

        const filter = andFilters.length > 0 ? { $and: andFilters } : {};

        const pageNum = Math.max(Number(page) || 1, 1);
        const limitNum = Math.max(Number(limit) || 20, 1);
        const skip = (pageNum - 1) * limitNum;

        const [articles, total] = await Promise.all([
            populateArticle(
                Article.find(filter)
                    .sort({ createdAt: -1 })
                    .sort({ publishedAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
            ),
            Article.countDocuments(filter),
        ]);

        const enrichedArticles = articles.map((art: IArticle) =>
            attachVirtualMediaVariants(art),
        );

        res.json({
            success: true,
            data: enrichedArticles,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to fetch articles", error),
        );
    }
};

export const getPublishedArticles = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { page, limit, search, categoryId } = req.query as unknown as {
            page: number;
            limit: number;
            search?: string;
            categoryId?: string;
        };

        const filter: Record<string, unknown> = { published: true };
        if (typeof search === "string" && search.trim().length > 0) {
            const rx = safeRegex(search.trim());
            const orFilters: any[] = [{ title: rx }, { excerpt: rx }];

            const matchedUsers = await User.find({ name: rx }).select("_id");
            if (matchedUsers.length > 0) {
                orFilters.push({
                    "authors.authorId": { $in: matchedUsers.map((u) => u._id) },
                });
            }

            filter.$or = orFilters;
        }
        const validCategoryId = toObjectId(categoryId);
        if (validCategoryId) {
            filter.categoryId = validCategoryId;
        }

        const pageNum = Math.max(Number(page) || 1, 1);
        const limitNum = Math.max(Number(limit) || 20, 1);
        const skip = (pageNum - 1) * limitNum;

        const [articles, total] = await Promise.all([
            populateArticle(
                Article.find(filter)
                    .sort({ isSticky: -1, publishedAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
            ),
            Article.countDocuments(filter),
        ]);

        const enrichedArticles = articles.map((art: IArticle) =>
            attachVirtualMediaVariants(art),
        );

        if (typeof search !== "string" || search.trim().length === 0) {
            setCacheTags(
                res,
                buildListCacheTags(articles, {
                    routeTag: "articles:published",
                    categoryId: validCategoryId?.toString(),
                }),
            );
        }

        res.json({
            success: true,
            data: enrichedArticles,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to fetch published articles", error),
        );
    }
};

export const getFeed = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page, limit, search, categoryId, tagId, authorId, isSticky } =
            req.query as unknown as {
                page: number;
                limit: number;
                search?: string;
                categoryId?: string;
                tagId?: string;
                authorId?: string;
                isSticky?: boolean | string;
            };

        const filter: Record<string, unknown> = { published: true };

        if (typeof search === "string" && search.trim().length > 0) {
            const rx = safeRegex(search.trim());
            filter.$or = [{ title: rx }, { excerpt: rx }];
        }

        const validCategoryId = toObjectId(categoryId);
        if (validCategoryId) filter.categoryId = validCategoryId;

        const validTagId = toObjectId(tagId);
        if (validTagId) filter.tagIds = validTagId;

        const validAuthorId = toObjectId(authorId);
        if (validAuthorId) filter["authors.authorId"] = validAuthorId;

        let stickyFilter: boolean | undefined;
        if (typeof isSticky === "boolean") {
            stickyFilter = isSticky;
        } else if (isSticky === "true" || isSticky === "false") {
            stickyFilter = isSticky === "true";
        }
        if (stickyFilter !== undefined) {
            filter.isSticky = stickyFilter;
        }

        const pageNum = Math.max(Number(page) || 1, 1);
        const limitNum = Math.max(Number(limit) || 20, 1);
        const skip = (pageNum - 1) * limitNum;

        const sort =
            stickyFilter === undefined
                ? ({ publishedAt: -1 } as const)
                : ({ isSticky: -1, publishedAt: -1 } as const);

        const [articles, total] = await Promise.all([
            populateArticleForFeed(
                Article.find(filter).sort(sort).skip(skip).limit(limitNum),
            ),
            Article.countDocuments(filter),
        ]);

        const enrichedArticles = articles.map((art: IArticle) =>
            attachVirtualMediaVariants(art),
        );

        if (typeof search !== "string" || search.trim().length === 0) {
            setCacheTags(
                res,
                buildListCacheTags(articles, {
                    routeTag: "articles:feed",
                    categoryId: validCategoryId?.toString(),
                    tagId: validTagId?.toString(),
                    authorId: validAuthorId?.toString(),
                }),
            );
        }

        res.json({
            success: true,
            data: enrichedArticles,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        });
    } catch (error: any) {
        res.status(500).json(safeErrorResponse("Failed to fetch feed", error));
    }
};

export const getFeaturedArticles = async (
    _req: Request,
    res: Response,
): Promise<void> => {
    try {
        const rawArticles = await populateArticle(
            Article.find({ published: true, isFeatured: true })
                .sort({ publishedAt: -1 })
                .limit(10),
        );
        const articles = rawArticles.map((art: IArticle) =>
            attachVirtualMediaVariants(art),
        );

        setCacheTags(
            res,
            buildListCacheTags(articles, { routeTag: "articles:featured" }),
        );

        res.json({ success: true, data: articles });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to fetch featured articles", error),
        );
    }
};

export const getStickyArticles = async (
    _req: Request,
    res: Response,
): Promise<void> => {
    try {
        const rawArticles = await populateArticle(
            Article.find({ published: true, isSticky: true }).sort({
                publishedAt: -1,
            }),
        );
        const articles = rawArticles.map((art: IArticle) =>
            attachVirtualMediaVariants(art),
        );

        setCacheTags(
            res,
            buildListCacheTags(articles, { routeTag: "articles:sticky" }),
        );

        res.json({ success: true, data: articles });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to fetch sticky articles", error),
        );
    }
};

export const getArticlesByCategory = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const categoryId = toObjectId(req.params.category);
        if (!categoryId) {
            res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
            return;
        }

        const { page, limit } = req.query as { page?: string; limit?: string };
        const pageNum = Math.max(Number(page) || 1, 1);
        const limitNum = Math.max(Number(limit) || 20, 1);
        const skip = (pageNum - 1) * limitNum;

        const [rawArticles, total] = await Promise.all([
            populateArticle(
                Article.find({ categoryId, published: true })
                    .sort({ isSticky: -1, publishedAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
            ),
            Article.countDocuments({ categoryId, published: true }),
        ]);

        const articles = rawArticles.map((art: IArticle) =>
            attachVirtualMediaVariants(art),
        );

        setCacheTags(
            res,
            buildListCacheTags(articles, {
                categoryId: categoryId.toString(),
            }),
        );

        res.json({
            success: true,
            data: articles,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to fetch articles by category", error),
        );
    }
};

export const getArticleById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const article = await populateArticle(
            Article.findOne({ _id: req.params.id, published: true }),
        );

        if (!article) {
            applyNoStoreHeaders(res);
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        const enrichedArticle = attachVirtualMediaVariants(article);

        setCacheTags(res, buildDetailCacheTags(article));

        res.json({ success: true, data: enrichedArticle });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to fetch article", error),
        );
    }
};

export const getArticleBySlug = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { slug } = req.params;

        const article = await populateArticle(
            Article.findOne({ slug, published: true }),
        );

        if (!article) {
            applyNoStoreHeaders(res);
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        const enrichedArticle = attachVirtualMediaVariants(article);

        setCacheTags(res, buildDetailCacheTags(article));

        res.json({ success: true, data: enrichedArticle });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to fetch article", error),
        );
    }
};

export const incrementArticleView = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        applyNoStoreHeaders(res);

        const article = await Article.findOneAndUpdate(
            { _id: req.params.id, published: true },
            { $inc: { viewCount: 1 } },
            { new: true },
        ).select("_id");

        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        res.status(204).send();
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to record article view", error),
        );
    }
};

export const updateArticle = async (req: any, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const existing = await Article.findById(id);
        if (!existing) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        if (!canEditArticle(req.user, existing)) {
            res.status(403).json({
                success: false,
                message: "Not authorized to edit this article",
            });
            return;
        }

        if (existing.reviewStatus === "in_review" && !req.user.isAdmin) {
            res.status(403).json({
                success: false,
                message: "Article is locked for review",
            });
            return;
        }

        if (req.body.authors && !canManageAuthors(req.user, existing)) {
            res.status(403).json({
                success: false,
                message: "Only owner or admin can manage authors",
            });
            return;
        }

        const beforeSnapshot = snapshotArticle(existing);
        const update = await buildArticleUpdate({ body: req.body, existing });

        if (!req.user.isAdmin) {
            delete update.published;
            delete update.isFeatured;
            delete update.isSticky;
            delete update.reviewStatus;
        }

        if (existing.published && !req.user.isAdmin) {
            const hasChanges = hasArticleChanged(existing, update);
            if (hasChanges) {
                update.reviewStatus = "changes_requested";
            }
        }

        const article = await Article.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });
        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        const populatedArticle = await populateArticle(
            Article.findById(article._id),
        );

        await invalidatePublicArticleCache({
            before: beforeSnapshot,
            after: snapshotArticle(article),
            mutationType: "update",
        });

        res.json({
            success: true,
            message: "Article updated successfully",
            data: populatedArticle,
        });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to update article", error),
        );
    }
};

export const deleteArticle = async (req: any, res: Response): Promise<void> => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        if (!canDeleteArticle(req.user, article)) {
            res.status(403).json({
                success: false,
                message: "Not authorized to delete this article",
            });
            return;
        }

        const beforeSnapshot = snapshotArticle(article);
        await Article.findByIdAndDelete(req.params.id);

        await invalidatePublicArticleCache({
            before: beforeSnapshot,
            after: null,
            mutationType: "delete",
        });

        res.json({ success: true, message: "Article deleted successfully" });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to delete article", error),
        );
    }
};

export const toggleFeatured = async (
    req: any,
    res: Response,
): Promise<void> => {
    try {
        if (!canPublishArticle(req.user)) {
            res.status(403).json({
                success: false,
                message: "Only admins can toggle featured",
            });
            return;
        }

        const article = await Article.findById(req.params.id);
        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        if (!article.published) {
            res.status(400).json({
                success: false,
                message: "Only published articles can be featured",
            });
            return;
        }

        const beforeSnapshot = snapshotArticle(article);
        article.isFeatured = !article.isFeatured;
        await article.save();

        const populatedArticle = await populateArticle(
            Article.findById(article._id),
        );

        await invalidatePublicArticleCache({
            before: beforeSnapshot,
            after: snapshotArticle(article),
            mutationType: "feature",
        });

        res.json({
            success: true,
            message: `Article ${article.isFeatured ? "featured" : "unfeatured"} successfully`,
            data: populatedArticle,
        });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to toggle featured status", error),
        );
    }
};

export const toggleSticky = async (req: any, res: Response): Promise<void> => {
    try {
        if (!canPublishArticle(req.user)) {
            res.status(403).json({
                success: false,
                message: "Only admins can toggle sticky",
            });
            return;
        }

        const article = await Article.findById(req.params.id);
        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        if (!article.published) {
            res.status(400).json({
                success: false,
                message: "Only published articles can be sticky",
            });
            return;
        }

        const beforeSnapshot = snapshotArticle(article);
        article.isSticky = !article.isSticky;
        await article.save();

        const populatedArticle = await populateArticle(
            Article.findById(article._id),
        );

        await invalidatePublicArticleCache({
            before: beforeSnapshot,
            after: snapshotArticle(article),
            mutationType: "sticky",
        });

        res.json({
            success: true,
            message: `Article ${article.isSticky ? "pinned" : "unpinned"} successfully`,
            data: populatedArticle,
        });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to toggle sticky status", error),
        );
    }
};

export const updateArticleStatus = async (
    req: any,
    res: Response,
): Promise<void> => {
    try {
        if (!canPublishArticle(req.user)) {
            res.status(403).json({
                success: false,
                message: "Only admins can update article status",
            });
            return;
        }

        const { id } = req.params;
        const { status, isFeatured, isSticky } = req.body;

        const article = await Article.findById(id);
        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        const updateData: Partial<IArticle> = {};
        const beforeSnapshot = snapshotArticle(article);

        let published = article.published;
        if (typeof status === "string") {
            published = status === "published";
            updateData.published = published;
            updateData.publishedAt = published
                ? (article.publishedAt ?? new Date())
                : null;

            if (published) {
                updateData.reviewStatus = "published";
                updateData.reviewedAt = new Date();
                updateData.reviewedBy = req.user.id;
            } else {
                updateData.reviewStatus = "draft";
            }

            if (!published) {
                updateData.isFeatured = false;
                updateData.isSticky = false;
            }
        }

        if (typeof isFeatured === "boolean") {
            if (!published && !article.published) {
                res.status(400).json({
                    success: false,
                    message: "Only published articles can be featured",
                });
                return;
            }
            updateData.isFeatured = isFeatured;
        }

        if (typeof isSticky === "boolean") {
            if (!published && !article.published) {
                res.status(400).json({
                    success: false,
                    message: "Only published articles can be sticky",
                });
                return;
            }
            updateData.isSticky = isSticky;
        }

        if (!published) {
            updateData.isFeatured = false;
            updateData.isSticky = false;
        }

        const updatedArticle = await Article.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
        if (!updatedArticle) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        if (published && !article.published) {
            if (updatedArticle.ownerId.toString() !== req.user.id) {
                await NotificationService.create(
                    updatedArticle.ownerId,
                    "published",
                    "Article Published",
                    `Your article "${updatedArticle.title}" has been published!`,
                    `/articles/${updatedArticle._id}/edit`,
                    { articleId: updatedArticle._id },
                );
            }
        }

        const populatedArticle = await populateArticle(
            Article.findById(updatedArticle._id),
        );

        await invalidatePublicArticleCache({
            before: beforeSnapshot,
            after: snapshotArticle(updatedArticle),
            mutationType: published ? "publish" : "unpublish",
        });

        res.json({
            success: true,
            message: "Article status updated successfully",
            data: populatedArticle,
        });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to update article status", error),
        );
    }
};

export const createDraft = async (req: any, res: Response): Promise<void> => {
    try {
        const ownerId = req.user.id;
        const title = "Untitled Article";
        const slug = `untitled-${Date.now()}`;

        const article = await Article.create({
            title,
            slug,
            content: "<p></p>",
            ownerId,
            authors: [{ authorId: ownerId, order: 0 }],
            published: false,
            reviewStatus: "draft",
            viewCount: 0,
        });

        res.status(201).json({ success: true, data: article });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to create draft", error),
        );
    }
};

export const getAdminArticleById = async (
    req: any,
    res: Response,
): Promise<void> => {
    try {
        const article = await populateArticle(Article.findById(req.params.id));

        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        if (!canEditArticle(req.user, article)) {
            res.status(403).json({
                success: false,
                message: "Not authorized to edit this article",
            });
            return;
        }

        res.json({ success: true, data: article });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Failed to fetch article", error),
        );
    }
};

export const requestReview = async (req: any, res: Response): Promise<void> => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        if (
            article.reviewStatus !== "draft" &&
            article.reviewStatus !== "changes_requested"
        ) {
            res.status(400).json({
                success: false,
                message: "Article is already in review or published",
            });
            return;
        }

        if (article.ownerId.toString() !== req.user.id && !req.user.isAdmin) {
            res.status(403).json({
                success: false,
                message: "Only the owner can request review",
            });
            return;
        }

        article.reviewStatus = "in_review";
        await article.save();

        await NotificationService.notifyAdmins(
            "review_requested",
            "Review Requested",
            `${req.user.name || "An author"} requested a review for "${article.title}"`,
            `/articles/${article._id}/edit`,
            { articleId: article._id },
        );

        res.json({ success: true, message: "Review requested", data: article });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Error requesting review", error),
        );
    }
};

export const unrequestReview = async (
    req: any,
    res: Response,
): Promise<void> => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        if (article.reviewStatus !== "in_review") {
            res.status(400).json({
                success: false,
                message: "Article is not in review",
            });
            return;
        }

        if (article.ownerId.toString() !== req.user.id && !req.user.isAdmin) {
            res.status(403).json({
                success: false,
                message: "Only the owner can unrequest review",
            });
            return;
        }

        if (article.published) {
            article.reviewStatus = "changes_requested";
        } else {
            article.reviewStatus = "draft";
        }

        await article.save();

        res.json({ success: true, message: "Review cancelled", data: article });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Error cancelling review", error),
        );
    }
};

export const adminPublish = async (req: any, res: Response): Promise<void> => {
    try {
        if (!canPublishArticle(req.user)) {
            res.status(403).json({
                success: false,
                message: "Only admins can publish",
            });
            return;
        }

        const article = await Article.findById(req.params.id);
        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        const beforeSnapshot = snapshotArticle(article);
        article.published = true;
        article.reviewStatus = "published";
        article.publishedAt = new Date();
        article.reviewedAt = new Date();
        article.reviewedBy = req.user.id;
        await article.save();

        if (article.ownerId.toString() !== req.user.id) {
            await NotificationService.create(
                article.ownerId,
                "published",
                "Article Published",
                `Your article "${article.title}" has been published!`,
                `/articles/${article._id}/edit`,
                { articleId: article._id },
            );
        }

        await invalidatePublicArticleCache({
            before: beforeSnapshot,
            after: snapshotArticle(article),
            mutationType: "publish",
        });

        res.json({
            success: true,
            message: "Article published",
            data: article,
        });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Error publishing article", error),
        );
    }
};

export const adminUnpublish = async (
    req: any,
    res: Response,
): Promise<void> => {
    try {
        if (!canPublishArticle(req.user)) {
            res.status(403).json({
                success: false,
                message: "Only admins can unpublish",
            });
            return;
        }

        const article = await Article.findById(req.params.id);
        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        const beforeSnapshot = snapshotArticle(article);
        article.published = false;
        article.reviewStatus = "draft";
        article.isFeatured = false;
        article.isSticky = false;
        await article.save();

        await invalidatePublicArticleCache({
            before: beforeSnapshot,
            after: snapshotArticle(article),
            mutationType: "unpublish",
        });

        res.json({
            success: true,
            message: "Article unpublished",
            data: article,
        });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Error unpublishing article", error),
        );
    }
};

export const requestChanges = async (
    req: any,
    res: Response,
): Promise<void> => {
    try {
        if (!canPublishArticle(req.user)) {
            res.status(403).json({
                success: false,
                message: "Only admins can request changes",
            });
            return;
        }

        const article = await Article.findById(req.params.id);
        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        if (article.reviewStatus !== "in_review") {
            res.status(400).json({
                success: false,
                message: "Article is not in review",
            });
            return;
        }

        article.reviewStatus = "changes_requested";
        if (req.body.reviewNotes) {
            article.reviewNotes = req.body.reviewNotes;
        }
        await article.save();

        await NotificationService.create(
            article.ownerId,
            "changes_requested",
            "Changes Requested",
            `Admin requested changes on "${article.title}"`,
            `/articles/${article._id}/edit`,
            { articleId: article._id, notes: req.body.reviewNotes },
        );

        res.json({
            success: true,
            message: "Changes requested",
            data: article,
        });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Error requesting changes", error),
        );
    }
};

export const transferOwnership = async (
    req: any,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user.isAdmin) {
            res.status(403).json({
                success: false,
                message: "Only admins can transfer ownership",
            });
            return;
        }

        const { newOwnerId } = req.body;
        if (!newOwnerId) {
            res.status(400).json({
                success: false,
                message: "newOwnerId is required",
            });
            return;
        }

        const article = await Article.findById(req.params.id);
        if (!article) {
            res.status(404).json({
                success: false,
                message: "Article not found",
            });
            return;
        }

        article.ownerId = new mongoose.Types.ObjectId(newOwnerId);
        await article.save();

        res.json({
            success: true,
            message: "Ownership transferred",
            data: article,
        });
    } catch (error: any) {
        res.status(500).json(
            safeErrorResponse("Error transferring ownership", error),
        );
    }
};
