import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { env } from './env';

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
      throw new Error('R2 storage credentials are not configured');
    }
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return `${env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    }),
  );
}

export type R2ObjectSummary = {
  key: string;
  size: number;
  etag?: string | undefined;
  lastModified?: Date | undefined;
};

export type ListR2ObjectsResult = {
  items: R2ObjectSummary[];
  nextCursor: string | null;
  hasMore: boolean;
};

export async function listR2Objects(params: {
  cursor?: string;
  limit?: number;
  prefix?: string;
} = {}): Promise<ListR2ObjectsResult> {
  const limit = Math.min(Math.max(params.limit ?? 24, 1), 1000);

  const result = await getClient().send(
    new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME,
      ContinuationToken: params.cursor,
      MaxKeys: limit,
      Prefix: params.prefix,
    }),
  );

  const items: R2ObjectSummary[] = (result.Contents ?? [])
    .filter((obj) => typeof obj.Key === 'string' && !!obj.Key)
    .map((obj) => {
      const item: R2ObjectSummary = {
        key: obj.Key as string,
        size: obj.Size ?? 0,
      };
      if (obj.ETag !== undefined) item.etag = obj.ETag;
      if (obj.LastModified !== undefined) item.lastModified = obj.LastModified;
      return item;
    });

  return {
    items,
    nextCursor: result.NextContinuationToken ?? null,
    hasMore: !!result.IsTruncated,
  };
}
