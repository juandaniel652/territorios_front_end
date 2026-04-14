import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Forzamos que la raíz sea el directorio actual
  root: resolve(__dirname, './'),
  base: '/', 
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Limpia la carpeta dist antes de buildear
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