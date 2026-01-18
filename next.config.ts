import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Docker를 위한 standalone 출력 모드
  webpack: (config, { isServer }) => {
    // 클라이언트 사이드에서 socket.io-client를 사용할 수 있도록 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
