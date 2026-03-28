declare module 'next-pwa' {
  import type { NextConfig } from 'next';
  export default function withPWAInit(config: any): (nextConfig: NextConfig) => NextConfig;
}
