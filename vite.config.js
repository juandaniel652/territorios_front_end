// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'), // Tu nuevo index de la raíz
        login: resolve(__dirname, 'login/index.html'),
        register: resolve(__dirname, 'login/register.html'),
        dashboard: resolve(__dirname, 'dashboard/index.html')
      }
    }
  }
});