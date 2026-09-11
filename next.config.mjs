/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['bcryptjs', '@prisma/client'],
};

export default nextConfig;
