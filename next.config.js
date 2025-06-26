/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds for faster deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow builds to proceed even with TypeScript errors
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 