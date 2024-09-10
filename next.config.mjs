/** @type {import('next').NextConfig} */
const nextConfig = {
        images: {
          remotePatterns: [
            {
              protocol: 'https',
              hostname: 'drive.google.com',
              port: '',
            },
            {
              protocol: 'https',
              hostname: 'i.imgur.com',
              port: '',
            },
            {
              protocol: 'https',
              hostname: 'imgur.com',
              port: '',
            },
          ],
        }
};



export default nextConfig;
