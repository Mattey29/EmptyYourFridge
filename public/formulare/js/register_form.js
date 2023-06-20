function sendData(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("password_confirm").value;

    if (password !== confirmPassword) {
        const errorContainer = document.getElementById("error-container");
        errorContainer.innerHTML = "<p>Die Passwörter stimmen nicht überein.</p>";
        return;
    }

    const data = {
        email: email,
        password: password,
    };

    fetch('/formulare/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            if (response.ok) {
                window.location.href = "/public/html/succ_registered.html";
            } else {
                return response.json(); // Read error message
            }
        })
        .then(data => {
            if (data) {
                const message = data.message;
                const errorContainer = document.getElementById("error-container");
                errorContainer.innerHTML = `<p>${message}</p>`;
            }
        })
        .catch(error => {
            console.error(error);
        });
}