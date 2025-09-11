import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'nhuiqugqbwpbuulzjusw.supabase.co',
            port: '',
            pathname: '/storage/v1/object/public/product_images/**',
        },
    ],
},
};

export default nextConfig;
