const isProd = process.env.NODE_ENV === 'production';

const internalHost = process.env.TAURI_DEV_HOST || 'localhost';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Ensure Next.js uses SSG instead of SSR
    // https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
    output: 'export',
    // Disable SSR completely for Tauri desktop app
    reactStrictMode: true,
    // Note: This feature is required to use the Next.js Image component in SSG mode.
    // See https://nextjs.org/docs/messages/export-image-api for different workarounds.
    images: {
        unoptimized: true,
    },
    // Configure assetPrefix or else the server won't properly resolve your assets.
    assetPrefix: isProd ? undefined : `http://${internalHost}:4250`,
    experimental: {
        // Disable server components and use client-side rendering only
        appDir: true,
    },
    webpack: (config) => {
        // Alias canvas to false to avoid bundling issues with pdfjs
        config.resolve.alias.canvas = false;
        return config;
    },
};

export default nextConfig;
