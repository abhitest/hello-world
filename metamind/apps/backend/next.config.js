/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@metamind/shared"],
  async headers() {
    // Allow Designer Extension (localhost:1337) and production origins
    const allowedOrigins = [
      process.env.DESIGNER_EXTENSION_URL || "http://localhost:1337",
      "https://webflow.com",
      "https://*.webflow.com",
    ];

    return [
      {
        // Apply CORS to all API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: allowedOrigins[0],
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PATCH, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
