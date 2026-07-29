import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static export: `npm run build` emits a plain HTML/CSS/JS site in `out/`,
  // deployable to any static host (Hostinger public_html, Netlify, GitHub Pages…).
  output: "export",
  // Static hosts serve /dashboard as dashboard/index.html — trailing slashes
  // make refreshes and direct links work without server rewrites.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
