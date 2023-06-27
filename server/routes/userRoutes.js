const db = require("../database/db_access");
const express = require("express");
const {hashPassword} = require("../hashPassword");
const {authenticateUser, generateXMLResponse} = require("../utilities");
const connection = require("../database/connection");


const router = express.Router();
router.get('/', authenticateUser, (req, res) => {
    const sessionIdCookie = req.cookies.session_id;

    db.getCookie(connection, sessionIdCookie, (error, user) => {
        if (error) {
            console.error("An error occurred while retrieving the user:", error);
            const errorMessage = {
                message: 'Error retrieving user',
                error: error,
            };

            const acceptHeader = req.headers['accept'];

            if (acceptHeader && acceptHeader.includes('application/xml')) {
                // Respond with XML
                const xmlResponse = generateXMLResponse(errorMessage);
                res.set('Content-Type', 'application/xml');
                res.status(500).send(xmlResponse);
            } else {
                // Respond with JSON
                res.status(500).json(errorMessage);
            }
        } else {
            const acceptHeader = req.headers['accept'];

            if (acceptHeader && acceptHeader.includes('application/xml')) {
                // Respond with XML
                const xmlResponse = generateXMLResponse(user);
                res.set('Content-Type', 'application/xml');
                res.status(200).send(xmlResponse);
            } else {
                // Respond with JSON
                res.status(200).json(user);
            }
        }
    });
});

router.post('/:email', express.json(), (req, res) => {
    const userData = req.body;
    const userEmail = req.params.email;

    const selectQuery = `SELECT * FROM user WHERE email = ?`;
    connection.query(selectQuery, [userData.email], (error, results) => {
        const acceptHeader = req.headers['accept'];

        if (error) {
            const errorMessage = {
                message: error.message,
            };

            if (acceptHeader && acceptHeader.includes('application/xml')) {
                // Respond with XML
                const xmlResponse = generateXMLResponse(errorMessage);
                res.set('Content-Type', 'application/xml');
                res.status(500).send(xmlResponse);
            } else {
                // Respond with JSON
                res.status(500).json(errorMessage);
            }
        } else {
            if (results.length > 0 && results[0].email != userEmail) {
                // If a user is found, send an error message
                const errorMessage = {
                    message: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits',
                };

                if (acceptHeader && acceptHeader.includes('application/xml')) {
                    // Respond with XML
                    const xmlResponse = generateXMLResponse(errorMessage);
                    res.set('Content-Type', 'application/xml');
                    res.status(409).send(xmlResponse);
                } else {
                    // Respond with JSON
                    res.status(409).json(errorMessage);
                }
            } else {
                db.getUser(connection, userEmail, (error, user) => {
                    if (error) {
                        const errorMessage = {
                            message: 'Error retrieving user information',
                            error: error,
                        };

                        if (acceptHeader && acceptHeader.includes('application/xml')) {
                            // Respond with XML
                            const xmlResponse = generateXMLResponse(errorMessage);
                            res.set('Content-Type', 'application/xml');
                            res.status(500).send(xmlResponse);
                        } else {
                            // Respond with JSON
                            res.status(500).json(errorMessage);
                        }
                    } else {
                        if(!userData.password){
                            userData.password = user.password;
                        }

                        if(!userData.email){
                            userData.email = user.email;
                        }

                        const { salt, hashedPassword } = hashPassword(userData.password);
                        userData.password = hashedPassword;

                        db.updateUser(connection, userEmail, userData.email, userData.password, salt, (error, user) => {
                            if (error) {
                                const errorMessage = {
                                    message: 'Error updating user',
                                    error: error,
                                };

                                if (acceptHeader && acceptHeader.includes('application/xml')) {
                                    // Respond with XML
                                    const xmlResponse = generateXMLResponse(errorMessage);
                                    res.set('Content-Type', 'application/xml');
                                    res.status(500).send(xmlResponse);
                                } else {
                                    // Respond with JSON
                                    res.status(500).json(errorMessage);
                                }
                            } else {
                                if (acceptHeader && acceptHeader.includes('application/xml')) {
                                    // Respond with XML
                                    const xmlResponse = generateXMLResponse({ message: 'User deleted successfully' });
                                    res.set('Content-Type', 'application/xml');
                                    res.status(204).send(xmlResponse); // Send 204 (No Content)
                                } else {
                                    // Respond with JSON
                                    res.sendStatus(204); // Send 204 (No Content)
                                }
                            }
                        })
                    }
                })
            }
        }
    });
});

router.delete('/:email', (req, res) => {
    const sessionIdCookie = req.cookies.session_id;
    const userEmail = req.params.email;

    db.deleteUser(connection, userEmail, (error, user) => {
        const acceptHeader = req.headers['accept'];
        if (error) {
            const errorMessage = {
                message: 'Error deleting user',
                error: error,
            };

            if (acceptHeader && acceptHeader.includes('application/xml')) {
                // Respond with XML
                const xmlResponse = generateXMLResponse(errorMessage);
                res.set('Content-Type', 'application/xml');
                res.status(500).send(xmlResponse);
            } else {
                // Respond with JSON
                res.status(500).json(errorMessage);
            }
        } else {
            if (acceptHeader && acceptHeader.includes('application/xml')) {
                // Respond with XML
                const xmlResponse = generateXMLResponse({ message: 'User deleted successfully' });
                res.set('Content-Type', 'application/xml');
                res.status(204).send(xmlResponse); // Send 204 (No Content)
            } else {
                // Respond with JSON
                res.sendStatus(204); // Send 204 (No Content)
            }
        }
    })

});

//++++++++++++++++++++++++++++++++++++++++++++++ PROFILE PICTURE UPLOAD +++++++++++++++++++++++++++++++++++++++++++++

const multer = require('multer');

// Konfiguration für den Dateiupload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/profile_pictures'); // Speicherort für die hochgeladenen Dateien
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + 'profilePicture.png'); // Dateiname speichern (z.B. timestamp-profilePicture)
    }
});

// Middleware für den Dateiupload
const upload = multer({ storage: storage });


router.patch('/upload_pp', upload.single('profileImage'), function (req, res, next) { //das Formularfeld mit 'profileImage' enthält das bild!
    // Der Dateiupload wurde erfolgreich durchgeführt
    const file = req.file;
    if (!file) {
        res.status(400).send('Es wurde keine Datei hochgeladen.');
    }
    else {
        //Datenbank Logik hier einfügen
        const filename = req.file.filename;
        const userEmail = req.body.userEmail;

        db.addPicture(connection, userEmail, filename, (error, user) => {
            const acceptHeader = req.headers['accept'];
            if (error) {
                const errorMessage = {
                    message: 'Error adding Profile Picture',
                    error: error,
                };

                if (acceptHeader && acceptHeader.includes('application/xml')) {
                    // Respond with XML
                    const xmlResponse = generateXMLResponse(errorMessage);
                    res.set('Content-Type', 'application/xml');
                    res.status(500).send(xmlResponse);
                } else {
                    // Respond with JSON
                    res.status(500).json(errorMessage);
                }
            } else {
                if (acceptHeader && acceptHeader.includes('application/xml')) {
                    // Respond with XML
                    const xmlResponse = generateXMLResponse({ message: 'Profile Picture added Successfully' });
                    res.set('Content-Type', 'application/xml');
                    res.status(204).send(xmlResponse); // Send 204 (No Content)
                } else {
                    // Respond with JSON
                    res.status(200).json("Success"); // Send 204 (No Content)
                }
            }
        })
    }
});


module.exports = router;