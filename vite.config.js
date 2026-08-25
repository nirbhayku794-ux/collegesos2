import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'data/public',

  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'data/public/index.html'),
        student: resolve(__dirname, 'data/public/student.html'),
        admin: resolve(__dirname, 'data/public/admin.html'),
      },
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});