/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // Ensure Lemon Squeezy webhook receives raw body
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
