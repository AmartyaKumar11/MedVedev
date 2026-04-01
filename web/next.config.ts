import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Repo root has a separate Expo lockfile; pin Turbopack to this app only.
const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
