import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname, "./"),
  base: "/",
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
  server: {
    // ── Middleware para imitar los rewrites de vercel.json en local ──
    configureServer(server) {
      server.middlewares.use((req, next) => {
        const urlPath = req.url.split("?")[0];

        // Mapeamos rutas limpias (con o sin barra final) a sus respectivos HTML
        if (urlPath === "/dashboard" || urlPath === "/dashboard/") {
          req.url = req.url.replace(/^\/dashboard\/?/, "/dashboard/index.html");
        } else if (urlPath === "/login" || urlPath === "/login/") {
          req.url = req.url.replace(/^\/login\/?/, "/login/index.html");
        } else if (urlPath === "/register" || urlPath === "/register/") {
          req.url = req.url.replace(/^\/register\/?/, "/login/register.html");
        }

        next(); // Firma correcta: (req, res, next)
      });
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "login/index.html"),
        register: resolve(__dirname, "login/register.html"),
        dashboard: resolve(__dirname, "dashboard/index.html"),
      },
    },
  },
});
