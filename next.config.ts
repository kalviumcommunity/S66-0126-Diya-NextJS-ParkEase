import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Core Configuration */
  reactStrictMode: true,
  swcMinify: true,

  /* Environment Variables - Only NEXT_PUBLIC_* are exposed to client */
  env: {
    // These will be available on the server-side only
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NODE_ENV: process.env.NODE_ENV,
  },

  /* Headers for Security */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  /* HTTPS Redirect in Production */
  redirects: async () => {
    return [
      {
        source: '/:path*',
        destination: '/:path*',
        permanent: false,
      },
    ];
  },

  /* Webpack Configuration */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
      };
    }
    return config;
  },

  /* Image Optimization */
  images: {
    domains: ['localhost'],
    // Add S3 bucket domain when configured
    // domains: [process.env.AWS_S3_BUCKET],
  },

  /* TypeScript */
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
