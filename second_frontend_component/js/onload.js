document.addEventListener('DOMContentLoaded', function() {
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
            if (window.location.pathname === '/second_frontend_component/html/account_menu.html') {
                const email = res_data.email;
                const currentUser = document.getElementById("currentUser");
                const emailField = document.getElementById("email");

                const profilePictureElement = document.getElementById("profilePicture");
                const profilePictureName = res_data.profilePicture;
                if(profilePictureName == null){
                    profilePictureElement.src = "/public/profile_pictures/standard.png";
                }
                else{
                    profilePictureElement.src = "/public/profile_pictures/" + profilePictureName;
                }

                currentUser.textContent = email;
                emailField.value = email;
            } else {

                const profilePictureElement = document.getElementById("profilePicture");
                const profilePictureName = res_data.profilePicture;
                if(profilePictureName == null){
                    profilePictureElement.src = "/public/profile_pictures/standard.png";
                }
                else{
                    profilePictureElement.src = "/public/profile_pictures/" + profilePictureName;
                }

                const email = res_data.email;
                const currentUser = document.getElementById("currentUser");
                currentUser.textContent = email;
            }

        })
        .catch(error => {
            console.error(error);
        });
});