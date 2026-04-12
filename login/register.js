// login/register.js
import { CONFIG } from "../dashboard/config.js";

const registerForm = document.getElementById("registerForm");
const messageArea  = document.getElementById("messageArea");
const btnSubmit    = document.getElementById("btnSubmit");

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // 1. Limpieza de estado (Usando tu clase corporativa)
    messageArea.textContent = "";
    messageArea.style.color = "var(--error-color, #ff4d4d)"; // Reset al color de error por defecto
    
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        messageArea.textContent = "Por favor, completa todos los campos.";
        return;
    }

    // 2. Feedback visual corporativo
    btnSubmit.disabled = true;
    const originalBtnText = btnSubmit.textContent;
    btnSubmit.textContent = "Procesando...";
    btnSubmit.style.opacity = "0.7";

    try {
        const response = await fetch(`${CONFIG.BASE_URL}/api/v1/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            // FastAPI devuelve el error en 'detail'
            throw new Error(data.detail || "Error al registrar el usuario.");
        }

        // 3. Éxito (Cambio de color a verde corporativo)
        messageArea.style.color = "#28a745"; // Verde éxito sobrio
        messageArea.textContent = "¡Cuenta creada! Redirigiendo al login...";
        
        // Deshabilitar el formulario tras el éxito
        registerForm.querySelectorAll("input").forEach(i => i.disabled = true);

        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);

    } catch (error) {
        console.error("Register Error:", error);
        messageArea.style.color = "var(--error-color, #ff4d4d)";
        messageArea.textContent = error.message;
        
        // Reactivación de UI
        btnSubmit.disabled = false;
        btnSubmit.textContent = originalBtnText;
        btnSubmit.style.opacity = "1";
    }
});