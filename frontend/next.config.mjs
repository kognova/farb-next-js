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
                destination:
                    process.env.NODE_ENV === "production"
                        ? "http://worker.process.farb-next-js.internal:8080/:path*"
                        : "http://localhost:3001/:path*"
            }
        ];
    },
    experimental: {
        proxyTimeout: 240e3
    }
};

export default nextConfig;
