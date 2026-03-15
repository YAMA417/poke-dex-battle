/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@poke-dex-battle/shared'],
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
