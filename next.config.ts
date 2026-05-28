import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep heavy Node.js packages server-side only
  serverExternalPackages: [
    "pdf-parse",
    "docxtemplater",
    "pizzip",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
  ],
  // Explicitly expose server-side env vars to the runtime
  env: {
    GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME ?? "",
    APP_AWS_REGION: process.env.APP_AWS_REGION ?? "",
    APP_AWS_ACCESS_KEY_ID: process.env.APP_AWS_ACCESS_KEY_ID ?? "",
    APP_AWS_SECRET_ACCESS_KEY: process.env.APP_AWS_SECRET_ACCESS_KEY ?? "",
  },
};

export default nextConfig;
