import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, './'),
  base: '/', 
  resolve: {
    alias: {
      '@': resolve(__dirname, './') // El alias @ apunta a la raíz del proyecto
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
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