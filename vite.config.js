// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './', // Asegúrate de que apunte a la raíz de tu frontend
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login/index.html'),
        register: resolve(__dirname, 'login/register.html'),
        dashboard: resolve(__dirname, 'dashboard/index.html')
      }
    }
  }
});