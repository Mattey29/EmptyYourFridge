function logout() {

    document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = "/second_frontend_component/main.html";
}