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
};

export default nextConfig;
