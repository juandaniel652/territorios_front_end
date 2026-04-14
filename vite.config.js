// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, './'),
  base: '/', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: { polyfill: false }, // Evita que cargue scripts antes de tiempo
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login/index.html'),
        register: resolve(__dirname, 'login/register.html'),
        dashboard: resolve(__dirname, 'dashboard/index.html')
      },
      output: {
        // Esto fuerza a que todo lo del dashboard vaya junto y no se pierdan referencias
        manualChunks: (id) => {
          if (id.includes('dashboard')) return 'dashboard-bundle';
        }
      }
    }
  }
});