/*import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  

};

export default nextConfig;
*/
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true, // <-- THIS FIXES BASE64 IMAGE ERRORS
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [], // keep empty unless you load external images
  },
};

export default nextConfig;
