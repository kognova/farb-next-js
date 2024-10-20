/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true
    },
    async rewrites() {
        // Proxy to Backend
        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:3001/:path*"
            }
        ];
    },
    experimental: {
        proxyTimeout: 240e3
    },
    output: "export",
    distDir: "../.static"
};

export default nextConfig;
