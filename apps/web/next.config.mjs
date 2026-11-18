/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@feto-games/shared-types'],
  images: {
    domains: ['localhost']
  }
};

export default nextConfig;
