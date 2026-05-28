import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Lazily-initialised S3 client.
 * Credentials come from the Amplify execution role (no keys needed in env).
 * Region must be set via AWS_REGION env var (Amplify sets this automatically).
 */
function getS3Client(): S3Client {
  return new S3Client({
    region: process.env.APP_AWS_REGION ?? "ap-south-1",
    credentials: {
      accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export function getBucketName(): string {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error("S3_BUCKET_NAME environment variable is not set.");
  return bucket;
}

/**
 * Downloads an object from S3 and returns it as a Buffer.
 */
export async function s3GetBuffer(key: string): Promise<Buffer> {
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: getBucketName(), Key: key });
  const response = await client.send(command);

  if (!response.Body) throw new Error(`S3 object not found: ${key}`);

  // response.Body is a ReadableStream in Node.js runtime
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Uploads a Buffer to S3 and returns the object key.
 */
export async function s3PutBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await client.send(command);
  return key;
}

/**
 * Generates a presigned GET URL valid for 15 minutes.
 */
export async function s3PresignedUrl(key: string): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: getBucketName(), Key: key });
  return getSignedUrl(client, command, { expiresIn: 900 }); // 15 min
}
