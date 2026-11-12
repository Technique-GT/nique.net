"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToR2 = uploadToR2;
exports.deleteFromR2 = deleteFromR2;
exports.listR2Objects = listR2Objects;
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = require("./env");
let client = null;
function getClient() {
    if (!client) {
        if (!env_1.env.R2_ACCOUNT_ID || !env_1.env.R2_ACCESS_KEY_ID || !env_1.env.R2_SECRET_ACCESS_KEY) {
            throw new Error('R2 storage credentials are not configured');
        }
        client = new client_s3_1.S3Client({
            region: 'auto',
            endpoint: `https://${env_1.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: env_1.env.R2_ACCESS_KEY_ID,
                secretAccessKey: env_1.env.R2_SECRET_ACCESS_KEY,
            },
        });
    }
    return client;
}
async function uploadToR2(buffer, key, contentType) {
    await getClient().send(new client_s3_1.PutObjectCommand({
        Bucket: env_1.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));
    return `${env_1.env.R2_PUBLIC_URL}/${key}`;
}
async function deleteFromR2(key) {
    await getClient().send(new client_s3_1.DeleteObjectCommand({
        Bucket: env_1.env.R2_BUCKET_NAME,
        Key: key,
    }));
}
async function listR2Objects(params = {}) {
    const limit = Math.min(Math.max(params.limit ?? 24, 1), 1000);
    const result = await getClient().send(new client_s3_1.ListObjectsV2Command({
        Bucket: env_1.env.R2_BUCKET_NAME,
        ContinuationToken: params.cursor,
        MaxKeys: limit,
        Prefix: params.prefix,
    }));
    const items = (result.Contents ?? [])
        .filter((obj) => typeof obj.Key === 'string' && !!obj.Key)
        .map((obj) => {
        const item = {
            key: obj.Key,
            size: obj.Size ?? 0,
        };
        if (obj.ETag !== undefined)
            item.etag = obj.ETag;
        if (obj.LastModified !== undefined)
            item.lastModified = obj.LastModified;
        return item;
    });
    return {
        items,
        nextCursor: result.NextContinuationToken ?? null,
        hasMore: !!result.IsTruncated,
    };
}
