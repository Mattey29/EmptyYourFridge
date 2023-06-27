const express = require("express");
const {hashPassword, validatePassword} = require("../hashPassword");
const crypto = require("crypto");
const db = require("../database/db_access");
const {generateXMLResponse, generateDummyMoneyArray, removeDietAll, formatAPIString} = require("../utilities");
const axios = require("axios");
const connection = require("../database/connection");
const fs = require('fs');

const router = express.Router();

router.post('/register', express.json(), (req, res) => {
    let { email, password } = req.body;

    const { salt, hashedPassword } = hashPassword(password);
    password = hashedPassword;

    // Generate a random session ID cookie
    const cookie = crypto.randomBytes(8).toString('hex');

    const selectQuery = `SELECT id FROM user WHERE email = ?`;
    connection.query(selectQuery, [email], (error, results) => {
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
            if (results.length > 0) {
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
                db.createUser(connection, email, password, cookie, salt, (error, userId) => {
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
                        const responseData = {
                            id: userId,
                        };

                        if (acceptHeader && acceptHeader.includes('application/xml')) {
                            // Respond with XML
                            const xmlResponse = generateXMLResponse(responseData);
                            res.set('Content-Type', 'application/xml');
                            res.status(201).send(xmlResponse);
                        } else {
                            // Respond with JSON
                            res.status(201).json(responseData);
                        }
                    }
                });
            }
        }
    });
});

router.post('/login', express.json(), (req, res) => {
    let { email, password } = req.body;

    // Generate a random session ID cookie
    const newCookie = crypto.randomBytes(8).toString('hex');

    db.getUser(connection, email, (error, user) => {
        if (error) {
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
            if (user && email == user.email) {
                // Check if a user was found
                if (validatePassword(password, user.password, user.salt)) {
                    db.setCookie(connection, email, newCookie, (error) => {
                        if (error) {
                            const errorMessage = {
                                message: 'Error updating cookie',
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
                            res.setHeader('Set-Cookie', `session_id=${newCookie}; HttpOnly; SameSite=Strict; path=/`);

                            if (acceptHeader && acceptHeader.includes('application/xml')) {
                                // Respond with XML
                                const xmlResponse = `<response>Session-ID ${newCookie} generiert</response>`;
                                res.set('Content-Type', 'application/xml');
                                res.status(200).send(xmlResponse);
                            } else {
                                // Respond with JSON
                                res.status(200).json({ message: `Session-ID ${newCookie} generiert` });
                            }
                        }
                    });
                } else {
                    res.status(401).end('Falsches Passwort.');
                }
            } else {
                res.status(401).send('Falsche Login-Daten');
            }
        }
    });
});

router.put('/editRecipe', express.json(), (req, res) => {
    const { oldTitle, newTitle, image, usedIngredients, unusedIngredients, missedIngredients } = req.body;
    const sessionIdCookie = req.cookies.session_id;

    db.getIdByCookie(connection, sessionIdCookie, (error, user) => {
        const acceptHeader = req.headers['accept'];

        if (error) {
            const errorMessage = {
                message: 'Error retrieving user',
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
            let user_id = user.id;
            db.updateUserRecipe(connection, user_id, oldTitle, newTitle, image, usedIngredients, unusedIngredients, missedIngredients, (error, recipes) => {
                if (error) {
                    const errorMessage = {
                        message: 'Error updating recipe',
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
                        const xmlResponse = generateXMLResponse({ message: 'Recipe updated successfully' });
                        res.set('Content-Type', 'application/xml');
                        res.status(204).send(xmlResponse); // Send 204 (No Content)
                    } else {
                        // Respond with JSON
                        res.sendStatus(204); // Send 204 (No Content)
                    }
                }
            });
        }
    });
});

router.get('/search_recipes', async (req, res) => {

    //++++++++++++++++  Recipes API +++++++++++++++++++++

    let recipeAPI_url = "https://api.spoonacular.com/recipes/";
    const recipeAPI_key = "6314fe6560054f0788f0b138cab27eef";

    const ingredients = req.query.ingredients;
    const diet = req.query.category;
    const maxAmountRecipes = "2";

    recipeAPI_url = recipeAPI_url + "findByIngredients?apiKey=" + recipeAPI_key + "&diet=" + diet + "&ingredients=" + ingredients + "&number=" + maxAmountRecipes + "&ranking=2";
    recipeAPI_url = removeDietAll(recipeAPI_url);

    const recipeAPI_url_formatted = formatAPIString(recipeAPI_url);
    let recipeApi_response = "";

    //++++++++++++++++  Currency API +++++++++++++++++++++

    //https://v6.exchangerate-api.com/v6/d8723c08f72bbe7e8d54e8ea/pair/EUR/GBP

    let currencyAPI_url = "https://v6.exchangerate-api.com/v6";
    const currencyAPI_key = "d8723c08f72bbe7e8d54e8ea";
    const fromCurrency = "USD";
    const toCurrency = "EUR";

    currencyAPI_url = currencyAPI_url + "/" + currencyAPI_key + "/pair" + "/" + fromCurrency + "/" + toCurrency;

    let currencyApi_response;
    let dummyMoney;

    try {
        const recipeResponse = await axios.get(recipeAPI_url_formatted);
        recipeApi_response = recipeResponse.data;

        const currencyResponse = await axios.get(currencyAPI_url);
        currencyApi_response = currencyResponse.data;

        const acceptHeader = req.headers['accept'];

        dummyMoney = generateDummyMoneyArray(maxAmountRecipes);

        const api_response = {
            recipes: recipeApi_response,
            currency: currencyApi_response,
            savedMoney: dummyMoney,
        };

        if (acceptHeader && acceptHeader.includes('application/xml')) {
            // Respond with XML
            const xmlResponse = generateXMLResponse(api_response);
            res.set('Content-Type', 'application/xml');
            res.status(200).send(xmlResponse);
        } else {
            // Respond with JSON
            res.status(200).json(api_response);
        }
    } catch (error) {
        console.error(error);
        const errorMessage = {
            message: 'Fehler beim Abrufen der Daten von der API',
            error: error
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
    }
});

//+++++++++++++++++++++++++++++++++++++++++++++ PICTURE UPLOAD (2FE) ++++++++++++++++++++++++++++++++++++++++++++++++

const multer = require('multer');

// Konfiguration für den Dateiupload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './second_frontend_component/CloudStorage/'); // Speicherort für die hochgeladenen Dateien
    },
    filename: function (req, file, cb) {
        const random = crypto.randomBytes(4).toString('hex');
        cb(null, Date.now() + '-' + random + '.png'); // Dateiname speichern (z.B. timestamp-profilePicture)
    }
});

// Middleware für den Dateiupload
const upload = multer({ storage: storage });
router.patch('/picture_upload', upload.single('Image'), function (req, res, next) { //das Formularfeld mit 'profileImage' enthält das bild!
    // Der Dateiupload wurde erfolgreich durchgeführt
    const file = req.file;
    if (!file) {
        res.status(400).send('Es wurde keine Datei hochgeladen.');
    }
    else {

        const filename = req.file.filename;
        const userEmail = req.body.userEmail;
        const sessionIdCookie = req.cookies.session_id;

        const uploadPath = './second_frontend_component/CloudStorage/' + userEmail;

        // Überprüfen, ob das Verzeichnis bereits existiert
        if (!fs.existsSync(uploadPath)) {
            // Verzeichnis erstellen, falls es nicht existiert
            fs.mkdirSync(uploadPath);
        }

        const newPath = uploadPath + '/' + file.filename;
        fs.renameSync(file.path, newPath);

        db.getIdByCookie(connection, sessionIdCookie, (error, user) => {
            const acceptHeader = req.headers['accept'];

            if (error) {
                const errorMessage = {
                    message: 'Error retrieving user',
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
                let userId = user.id;

                db.addPictureToCloud(connection, userId, filename, (error, user) => {
                    const acceptHeader = req.headers['accept'];
                    if (error) {
                        const errorMessage = {
                            message: 'Error adding Image',
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
                            const xmlResponse = generateXMLResponse({ message: 'Image added Successfully' });
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

    }
});

module.exports = router;