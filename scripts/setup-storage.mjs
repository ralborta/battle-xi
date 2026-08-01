/**
 * Crea el bucket de imágenes y lo deja con lectura pública.
 * Las fotos de las figuritas se sirven directo desde MinIO al navegador.
 *
 * Uso: node scripts/setup-storage.mjs
 * Requiere S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY y S3_BUCKET.
 */
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET;

if (!endpoint || !bucket || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
  console.error("Faltan S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY o S3_SECRET_KEY");
  process.exit(1);
}

const client = new S3Client({
  endpoint,
  region: process.env.S3_REGION ?? "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

try {
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log(`Bucket "${bucket}" ya existía.`);
} catch {
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
  console.log(`Bucket "${bucket}" creado.`);
}

await client.send(
  new PutBucketPolicyCommand({
    Bucket: bucket,
    Policy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    }),
  }),
);

console.log("Política de lectura pública aplicada.");
