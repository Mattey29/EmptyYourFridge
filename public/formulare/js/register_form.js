function sendData(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const data = {
        email: email,
        password: password,
    };

    fetch('/formulare/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (response.ok) {
                window.location.href = "/public/html/succ_registered.html";
            } else {
                return response.json(); // Auslesen der Fehlermeldung
            }
        })
        .then(data => {
            if (data) {
                const message = data.message;
                // Anzeigen der Fehlermeldung auf der Website
                const errorContainer = document.getElementById("error-container");
                errorContainer.innerHTML = `<p>${message}</p>`;
            }
        })
        .catch(error => {
            console.error(error);
        });
}