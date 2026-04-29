/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  transpilePackages: ["framer-motion"],
  experimental: {
    // Assure la compatibilité ES5/ES2015 pour les vieux navigateurs (Tizen)
    esmExternals: false,
  },
};

export default nextConfig;
