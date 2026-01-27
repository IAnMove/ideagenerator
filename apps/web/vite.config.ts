import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3001";
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(",").map((host) => host.trim()).filter(Boolean)
    : undefined;

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 3000,
      allowedHosts,
      proxy: {
        "/api": proxyTarget,
      },
    },
  };
});
