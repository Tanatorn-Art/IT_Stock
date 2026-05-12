/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true, // จำเป็นต้องมีเมื่อใช้ output: 'export'
  },
  env: {
    customKey: process.env.customKey,
  },
  trailingSlash: false,
}

module.exports = nextConfig