/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["api.dicebear.com", "images.unsplash.com"],
  },
  async rewrites() {
    // In production, NEXT_PUBLIC_API_URL points directly to Railway.
    // Rewrites are only used in local dev to proxy /api → local backend.
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
