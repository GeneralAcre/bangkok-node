/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Silence optional pino-pretty require from WalletConnect
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
      encoding: false,
    };
    return config;
  },
};

module.exports = nextConfig;
