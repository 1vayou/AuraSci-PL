/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    // Ignore optional connectors not needed for RainbowKit
    config.resolve.alias = {
      ...config.resolve.alias,
      'porto/internal': false,
      'porto': false,
      '@base-org/account': false,
      '@metamask/connect-evm': false,
    };
    return config;
  },
};
module.exports = nextConfig;
