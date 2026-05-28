import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse and docxtemplater use Node.js built-ins — keep them server-side only
  serverExternalPackages: ["pdf-parse", "docxtemplater", "pizzip"],
};

export default nextConfig;
