/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Static export generates /out directory
  // Cloudflare Pages will serve this directly
  images: {
    unoptimized: true,  // Required for static export
  },
};
module.exports = nextConfig;
