const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const express = require('express');
const mysql = require('mysql2'); //mysql
const config = require('./database/config.js');
const db = require('./database/db_access');
const connection = mysql.createConnection(config);

const cookieParser = require('cookie-parser');
const { hashPassword, validatePassword } = require('./hashPassword');

const app = express();
const port = 3000;

const axios = require('axios'); //API

const bodyParser = require('body-parser');

app.use(cookieParser());
app.use(bodyParser.json());

connection.connect((error) => {
    if (error) {
        console.error('Error connecting to database: ', error);
    } else {
        console.log('Connected to database.');
    }
});

// ---------------------- MIDDLEWARE for SessionID ---------------------

function authenticateUser(req, res, next) {

    const sessionIdCookie = req.cookies.session_id;

    db.getCookie(connection, sessionIdCookie, (error, user) => {
        if (error) {
            res.status(500).send('Could not get Cookie on Serverside');
            res.redirect('./formulare/login_form.html');
        } else {
            if (sessionIdCookie === user.cookie) {
                next();
            } else {
                res.status(401).send('Unauthorized');
                res.redirect('./formulare/login_form.html');
            }
        }
    });
}


// -----------------------------------------------------------------------


app.post('/formulare/register', express.json(), (req, res) => {
    let { email, password } = req.body;

    const { salt, hashedPassword } = hashPassword(password);
    password = hashedPassword;

    // Generieren einer zufälligen Session-ID
    const cookie = crypto.randomBytes(8).toString('hex');

    const selectQuery = `SELECT id FROM user WHERE email = ?`;
    connection.query(selectQuery, [email], (error, results) => {
        if (error) {
            return res.status(500).send({ message: error.message });
        }

        if (results.length > 0) {
            // Wenn ein Benutzer gefunden wird, senden Sie eine Fehlermeldung zurück
            return res.status(409).send({ message: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits' });
        } else {
            db.createUser(connection, email, password, cookie, salt, (error, userId) => {
                if (error) {
                    res.status(500).send(error.message);
                } else {
                    res.status(201).json({ id: userId });
                }
            });
        }

    });
});

app.post('/formulare/login', express.json(), (req, res) => {
    let { email, password } = req.body;

    // Generieren einer zufälligen Session-ID
    const newCookie = crypto.randomBytes(8).toString('hex');


    db.getUser(connection, email, (error, user) => {
        if (error) {
            console.error("An error occurred while retrieving the user:", error);
        } else {
            if (user && email == user.email) { // Überprüfen, ob ein Benutzer gefunden wurde
                if (validatePassword(password, user.password, user.salt)) {

                    db.setCookie(connection, email, newCookie, (error) => {
                        if (error) {
                            console.error(error);
                        } else {
                            console.log('Cookie updated successfully!');
                        }
                    });

                    res.setHeader('Set-Cookie', `session_id=${newCookie}; HttpOnly; SameSite=Strict; path=/`);


                    // Senden einer Antwort mit der Session-ID
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    console.log(res.headers);
                    res.end(`Session-ID ${newCookie} generiert`);
                }
                else {
                    res.end('Falsches Passwort.');
                }
            }
            else {
                res.status(401).send('Falsche Login-Daten');
            }
        }

    });
});




app.get('/user_auth', authenticateUser, (req, res) => {
    //const cookies = req.headers.cookie ? req.headers.cookie.split('; ') : [];

    // Suchen des session_id-Cookies
    //const sessionIdCookie = "6c172e1a9814d7d2";
        //const sessionIdCookie = cookies.find(cookie => cookie.startsWith('session_id='));

    const sessionIdCookie = req.cookies.session_id;

    db.getCookie(connection, sessionIdCookie, (error, user) => {
            if (error) {
                console.error("An error occurred while retrieving the user:", error);
                res.status(500);
            } else {
                res.status(200).json({ email: user.email });
            }
        });
});

function formatAPIString(str) {
    // Entferne alle Leerzeichen aus dem String
    str = str.replace(/\s+/g, '');

    // Füge nach jedem Komma ein Pluszeichen ein
    str = str.replace(/,/g, ',+');

    // Gib den formatierten String zurück
    return str;
}

function removeDietAll(apiUrl) {
    const dietAllString = '&diet=all';
    const dietIndex = apiUrl.indexOf(dietAllString);

    if (dietIndex !== -1) {
        const dietValue = apiUrl.substr(dietIndex + dietAllString.length);
        if (!dietValue || dietValue.charAt(0) === '&') {
            apiUrl = apiUrl.substr(0, dietIndex) + apiUrl.substr(dietIndex + dietAllString.length);
        }
    }

    return apiUrl;
}





app.get('/formulare/search_recipes', async (req, res) => {
    let API_url = "https://api.spoonacular.com/recipes/";
    const API_key = "6314fe6560054f0788f0b138cab27eef"

    const ingredients = req.query.ingredients;
    const diet = req.query.category;
    const maxAmountReciepes = "2";

    API_url = API_url + "findByIngredients?apiKey=" + API_key + "&diet=" + diet + "&ingredients=" + ingredients + "&number=" + maxAmountReciepes + "&ranking=2";

    API_url = removeDietAll(API_url);

    const API_url_formatted = formatAPIString(API_url);
    let api_response = "";

    try {
        const response = await axios.get(API_url_formatted);
        api_response = response.data;
        res.status(200).json(api_response);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Fehler beim Abrufen der Daten von der API',
            error: error
        });
    }
});

app.post('/save_recipe', (req, res) => {
    const recipeData = req.body;
    const sessionIdCookie = req.cookies.session_id;

    const title = req.body.title;
    const image = req.body.image;
    const usedIngredients = req.body.used_ingredients;
    const unusedIngredients = req.body.unused_ingredients;
    const missedIngredients = req.body.missed_ingredients;



    db.getIdByCookie(connection, sessionIdCookie, (error, user) => {
        if (error) {
            console.error("An error occurred while retrieving the user:", error);
            res.status(500);
        } else {
            let user_id = user.id;

            db.saveRecipe(connection, user_id, usedIngredients, unusedIngredients, missedIngredients, title, image, (error, recipeId) => {
                if (error) {
                    console.error("An error occurred while saving the data:", error);
                    res.status(500);
                }
                else{
                    res.status(200);
                }
            });
        }
    });

    //connection, user_id, usedIngredients, unusedIngredients, missedIngredients, title, image, callback

});


//----------------------------------------------------------------------

app.delete('/acc_delete', authenticateUser, (req, res) => {

    const email = req.query.email;

    db.deleteUser(connection, email, (error) => {
        if (error) {
            console.error("An error occurred while retrieving the user:", error);
            res.status(500);
        } else {
            res.status(200).json({
                success: true,
                message: 'Das Benutzerkonto wurde erfolgreich gelöscht.'
            });
        }
    });
});



app.get('*', (req, res) => {
    let filePath = '.' + req.url;
    if (filePath == './') {
        filePath = './public/html/index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.svg': 'application/image/svg+xml'
    };
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code == 'ENOENT') {
                res.status(404).send('404 Not Found');
            } else {
                res.status(500).send('500 Internal Server Error');
            }
        } else {
            res.status(200).type(contentType).send(content);
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = connection;
