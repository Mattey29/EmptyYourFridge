function sendData(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const data = {
        email: email,
        password: password,
    };

    fetch('/formulare/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (response.ok) {
                document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                const cookie = response.headers.get('Set-Cookie');
                document.cookie = cookie; // Cookie setzen
                window.location.href = "./succ_login.html";
            } else if (response.status === 401) {
                throw new Error("Benutzer nicht gefunden.");
            } else {
                throw new Error("Fehler beim Einloggen.");
            }
        })
        .catch(error => {
            console.error(error);
            // Fehlermeldung anzeigen
            alert('Fehler beim Einloggen: ' + error.message);
        });

}
