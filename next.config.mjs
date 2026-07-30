import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fija la raíz del proyecto para evitar que el build se confunda
  // si hay otras carpetas de node por encima.
  turbopack: {
    root: path.resolve("."),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};
export default nextConfig;
