/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Enable standalone output for Docker production builds
  // This creates a minimal server.js with all dependencies bundled
  output: 'standalone',

  // ESLint: Skip during build, enforce via CI `pnpm lint --max-warnings 0`
  // Rationale: Next.js build lint doesn't support warning thresholds,
  // and we have 400+ warnings that need gradual cleanup (tech debt)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript: STRICT - fail build on any type error
  // Type errors break runtime, must be caught before deploy
  typescript: {
    ignoreBuildErrors: false,
  },

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // React Compiler for automatic memoization
    reactCompiler: true,
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

  // Headers for security and performance
  // Note: X-Frame-Options is only set in production so that local / in-IDE
  // previews can embed the app during development, while keeping framing
  // disabled in deployed environments for security.
  async headers() {
    const securityHeaders = [
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
      securityHeaders.push({
        key: 'X-Frame-Options',
        value: 'DENY',
      });
    }

    return [
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Cache static assets aggressively (1 year)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache JavaScript chunks (1 year with immutable)
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache CSS files (1 year with immutable)
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache media files (1 year)
      {
        source: '/_next/static/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache optimized images (1 week)
      {
        source: '/_next/image:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      // Cache public assets (1 week)
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
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
