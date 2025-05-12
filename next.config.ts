import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Add other image hostnames if needed
    ],
  },
  experimental: {
    // serverActions: true, // Uncomment if Genkit or other features require it.
                         // Keeping it commented as Genkit is mostly client-side calls here.
  }
};

export default nextConfig;
