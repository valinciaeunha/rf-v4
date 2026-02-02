import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Increased for database restore
    },
  },
  // Exclude discord.js from bundling (runs only on server)
  serverExternalPackages: [
    'discord.js',
    '@discordjs/ws',
    '@discordjs/rest',
    '@discordjs/collection',
    'zlib-sync',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.tokopay.id',
      },
      {
        protocol: 'https',
        hostname: 'assets.tokovoucher.id',
      },
      {
        protocol: 'https',
        hostname: 'media.discordapp.net',
      }
    ],
  },
};

export default nextConfig;
