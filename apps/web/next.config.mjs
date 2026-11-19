/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@feto-games/shared-types'],
  experimental: {
    serverComponentsExternalPackages: ['ably']
  },
  images: {
    domains: ['localhost']
  }
};

export default nextConfig;
