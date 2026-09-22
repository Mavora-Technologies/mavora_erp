/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Cloudflare Pages requires edge runtime for SSR or standard build for static. 
  // We'll keep default Next.js features and use the next-on-pages adapter during deployment.
  reactStrictMode: true,
  transpilePackages: ["@mavora/database", "@mavora/types", "@mavora/ui"],
};

export default nextConfig;