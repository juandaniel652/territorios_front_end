// Helper para decodificar el payload del JWT sin librerías externas
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        return null;
    }
}

export const AuthService = {
    getToken()        { return localStorage.getItem("token"); },
    getUserRole()     { return localStorage.getItem("user_role"); },
    
    setToken(token) { 
        localStorage.setItem("token", token);
        const payload = parseJwt(token);
        if (payload && payload.rol) {
            localStorage.setItem("user_role", payload.rol);
        }
    },

    removeToken() { 
        localStorage.removeItem("token"); 
        localStorage.removeItem("user_role");
    },

    isAdmin()         { return this.getUserRole() === "admin"; },
    isAuthenticated() { return !!this.getToken(); },

    logout() {
        this.removeToken();
        window.location.href = "../login/index.html";
    }
};