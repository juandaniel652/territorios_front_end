// login/login.js
import { CONFIG }      from "../dashboard/config.js";
import { AuthService } from "../dashboard/infrastructure/auth/AuthService.js";

const loginForm    = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) { errorMessage.textContent = "Completá todos los campos."; return; }
    try {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);
        const res  = await fetch(`${CONFIG.BASE_URL}api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Error en el login");
        AuthService.setToken(data.access_token);
        window.location.href = "../dashboard/index.html";
    } catch (err) {
        console.error(err);
        errorMessage.textContent = err.message;
    }
});
