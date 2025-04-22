/** @type {import('next').NextConfig} */
const nextConfig = {
 experimental: {
    serverComponentsExternalPackages: ['pdf-qr','pdf2json'],
  },
};

export default nextConfig;
