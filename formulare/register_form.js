function sendData(event) { //Wird aufgerufen onsubmit
    event.preventDefault(); // Verhindert das automatische Absenden des Formulars

    // Holt die Daten aus dem Formular
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Erstellt ein Datenobjekt, das an den Server geschickt werden soll, Key-Value-Pairs
    const data = {
        email: email,
        password: password, //gehashed wird erst auf der Server seite
    };

    // Sendet die Daten an den Server - HTTPS POST Request
    fetch('/formulare/register', { //HTTPS verwenden, um Daten Ende-zu-Ende zu verschlüsseln, Zertifikat benötigt
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' //Definiert dass die Daten als JSON-Format übergeben werden
        },
        body: JSON.stringify(data) //Daten in JSON Format
    })
        .then(response => {
            if (response.ok) {
                window.location.href = "./succ_registered.html"; // Umleitung auf neue Seite nach erfolgreichem Absenden des Formulars
            } else {
                throw new Error("Fehler beim Absenden des Formulars.");
            }
        })
        .catch(error => {
            console.error(error);
        });


}