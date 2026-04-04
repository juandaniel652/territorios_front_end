// infrastructure/auth/AuthService.js
export const AuthService = {
    getToken()        { return localStorage.getItem("token"); },
    setToken(token)   { localStorage.setItem("token", token); },
    removeToken()     { localStorage.removeItem("token"); },
    isAuthenticated() { return !!this.getToken(); },
    logout() {
        this.removeToken();
        window.location.href = "../login/index.html";
    }
};