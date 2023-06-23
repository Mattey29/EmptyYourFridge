document.addEventListener('DOMContentLoaded', function() {
    console.log("loaded;");
    fetch('/user', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Fehler beim Abrufen der E-Mail-Adresse');
            }
        })
        .then(res_data => {
            const email = res_data.email;
            const currentUser = document.getElementById("currentUser");
            currentUser.textContent = email;
        })
        .catch(error => {
            console.error(error);
        });
});