/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [],
  },
  i18n: {
    locales: ['en', 'es', 'pt'],
    defaultLocale: 'pt',
  },
}

module.exports = nextConfig
