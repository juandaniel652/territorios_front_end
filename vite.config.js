// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'login/index.html'),
        dashboard: resolve(__dirname, 'dashboard/index.html')
      }
    }
  }
});