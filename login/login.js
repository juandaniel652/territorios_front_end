// login/login.js
// Usamos rutas relativas para evitar problemas de resolución en Vercel
import { CONFIG }      from "../dashboard/config.js";
import { AuthService } from "../dashboard/infrastructure/auth/AuthService.js";

const loginForm    = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // 1. Limpieza de estado previo
    errorMessage.textContent = "";
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    
    if (!email || !password) { 
        errorMessage.textContent = "Completá todos los campos."; 
        return; 
    }

    // 2. Feedback visual (Opcional pero recomendado para "solidez")
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Cargando...";

    try {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const res = await fetch(`${CONFIG.BASE_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });

        const data = await res.json();
        
        if (!res.ok) {
            // Manejo específico de errores del backend (FastAPI suele mandar 'detail')
            throw new Error(data.detail || "Credenciales incorrectas");
        }

        // 3. Persistencia de Sesión
        // Asegúrate de que AuthService.setToken use localStorage.setItem("token", ...)
        AuthService.setToken(data.access_token);
        
        // 4. Redirección
        // Al usar "/dashboard", Vercel buscará la carpeta y el rewrite servirá el index.html
        window.location.replace("/dashboard");

    } catch (err) {
        console.error("Login Error:", err);
        errorMessage.textContent = err.message;
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});