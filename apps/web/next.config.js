/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@poke-dex-battle/shared', '@poke-dex-battle/db'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/PokeAPI/sprites/**',
      },
    ],
  },
};

module.exports = nextConfig;
