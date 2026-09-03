import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://localhost:7133',
        changeOrigin: true,
        secure: false, // permite o certificado SSL de desenvolvimento local do ASP.NET
      },
    },
  },
});
