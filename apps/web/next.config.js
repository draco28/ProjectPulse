/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Headers for security
  // Note: X-Frame-Options is only set in production so that local / in-IDE
  // previews can embed the app during development, while keeping framing
  // disabled in deployed environments for security.
  async headers() {
    const headers = [
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
    ];

    if (process.env.NODE_ENV === 'production') {
      headers.push({
        key: 'X-Frame-Options',
        value: 'DENY',
      });
    }

    return [
      {
        source: '/(.*)',
        headers,
      },
    ];
  },

  // Webpack configuration for monorepo
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    };

    // Externalize browser-based scanner dependencies for server-side rendering
    // These are loaded dynamically only when the specific scanners are used
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        'electron',
        '@playwright/test',
        'playwright',
        '@axe-core/playwright',
        'lighthouse',
        'chrome-launcher',
        'chromium'
      );
    }

    return config;
  },
};

module.exports = nextConfig;
