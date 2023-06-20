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

const ejs = require('ejs');


const app = express();
const port = 3000;

const axios = require('axios'); //API

const bodyParser = require('body-parser');

app.set('view engine', 'ejs');
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
        const acceptHeader = req.headers['accept'];

        if (error) {
            const errorMessage = {
                message: 'Could not get Cookie on Serverside',
                error: error,
            };

            if (acceptHeader && acceptHeader.includes('application/xml')) {
                // Respond with XML
                const xmlResponse = generateXMLResponse(errorMessage);
                //res.set('Content-Type', 'application/xml');
                res.status(500).send(xmlResponse);
            } else {
                // Respond with JSON
                res.status(500).json(errorMessage);
            }
            res.redirect('./formulare/login_form.html');
        } else {
            if (sessionIdCookie === user.cookie) {
                next();
            } else {
                const errorMessage = {
                    message: 'Unauthorized',
                };

                if (acceptHeader && acceptHeader.includes('application/xml')) {
                    // Respond with XML
                    const xmlResponse = generateXMLResponse(errorMessage);
                    res.set('Content-Type', 'application/xml');
                    res.status(401).send(xmlResponse);
                } else {
                    // Respond with JSON
                    res.status(401).json(errorMessage);
                }
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


app.post('/formulare/login', express.json(), (req, res) => {
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


app.get('/user_auth', authenticateUser, (req, res) => {
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
                const xmlResponse = `<user><email>${user.email}</email></user>`;
                res.set('Content-Type', 'application/xml');
                res.status(200).send(xmlResponse);
            } else {
                // Respond with JSON
                res.status(200).json({ email: user.email });
            }
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
    const API_key = "6314fe6560054f0788f0b138cab27eef";

    const ingredients = req.query.ingredients;
    const diet = req.query.category;
    const maxAmountRecipes = "2";

    API_url = API_url + "findByIngredients?apiKey=" + API_key + "&diet=" + diet + "&ingredients=" + ingredients + "&number=" + maxAmountRecipes + "&ranking=2";

    API_url = removeDietAll(API_url);

    const API_url_formatted = formatAPIString(API_url);
    let api_response = "";

    try {
        const response = await axios.get(API_url_formatted);
        api_response = response.data;
        const acceptHeader = req.headers['accept'];

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
            let user_id = user.id;

            db.checkIfRecipeAlreadySaved(connection, user_id, title, (error, recipe) => {
                if (error) {
                    const errorMessage = {
                        message: 'Error checking recipe',
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
                    return;
                }
                if (recipe) {
                    const errorMessage = {
                        message: 'Recipe already exists',
                    };

                    const acceptHeader = req.headers['accept'];

                    if (acceptHeader && acceptHeader.includes('application/xml')) {
                        // Respond with XML
                        const xmlResponse = generateXMLResponse(errorMessage);
                        res.set('Content-Type', 'application/xml');
                        res.status(200).send(xmlResponse);
                    } else {
                        // Respond with JSON
                        res.status(200).json(errorMessage);
                    }
                } else {
                    db.saveRecipe(connection, user_id, usedIngredients, unusedIngredients, missedIngredients, title, image, (error, recipeId) => {
                        if (error) {
                            const errorMessage = {
                                message: 'Error saving recipe',
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
                            const successMessage = {
                                message: 'Recipe saved successfully',
                            };

                            const acceptHeader = req.headers['accept'];

                            if (acceptHeader && acceptHeader.includes('application/xml')) {
                                // Respond with XML
                                const xmlResponse = generateXMLResponse(successMessage);
                                res.set('Content-Type', 'application/xml');
                                res.status(200).send(xmlResponse);
                            } else {
                                // Respond with JSON
                                res.status(200).json(successMessage);
                            }
                        }
                    });
                }
            });
        }
    });
});


// ++++++++++++++++++++++++ LOAD SAVED RECIPES ++++++++++++++++++++++++++++++++++++++++++++++++++++

app.get('/loadUserRecipes', (req, res) => {
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
            db.getAllUserRecipes(connection, user_id, (error, recipes) => {
                if (error) {
                    const errorMessage = {
                        message: 'Error retrieving recipes',
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
                    const responseData = {
                        recipes: recipes,
                    };

                    if (acceptHeader && acceptHeader.includes('application/xml')) {
                        // Respond with XML
                        const xmlResponse = generateXMLResponse(responseData);
                        res.set('Content-Type', 'application/xml');
                        res.status(200).send(xmlResponse);
                    } else {
                        // Respond with JSON
                        res.status(200).json(responseData);
                    }
                }
            });
        }
    });
});


app.delete('/savedRecipes/:recipeTitle', (req, res) => {
    const recipeTitle = req.params.recipeTitle;
    const sessionIdCookie = req.cookies.session_id;

    db.getIdByCookie(connection, sessionIdCookie, (error, user) => {
        if (error) {
            console.error("An error occurred while retrieving the user:", error);
            res.status(500);
        } else {
            let user_id = user.id;
            db.deleteUserRecipe(connection, user_id, recipeTitle, (error, recipes)=>{
                if(error){
                    console.error("An error occurred while retrieving the recipes:", error);
                    res.status(500);
                }
                else{
                    res.sendStatus(204); // Erfolgsstatus 204 (No Content) senden, um anzuzeigen, dass das Löschen erfolgreich war
                }
            });
        }
    });

});

//----------------------------------------------------------------------

app.delete('/user/:email', (req, res) => {
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

app.delete('/savedRecipes/:recipeTitle', (req, res) => {
    const recipeTitle = req.params.recipeTitle;
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
            db.deleteUserRecipe(connection, user_id, recipeTitle, (error, recipes) => {
                if (error) {
                    const errorMessage = {
                        message: 'Error deleting recipe',
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
                        const xmlResponse = generateXMLResponse({ message: 'Recipe deleted successfully' });
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


//--------------------------- EDIT RECIPE --------------------------------------------

app.get('/public/html/editRecipe.html', (req, res) => {
    const recipeData = req.query.recipe;

    res.sendFile(path.join(__dirname, '../public/html/editRecipe.html'));
});

app.put('/formulare/editRecipe', express.json(), (req, res) => {
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


function generateXMLResponse(data) {
    let xmlResponse = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlResponse += '<response>\n';

    if (typeof data === 'object') {
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                xmlResponse += `  <${key}>${data[key]}</${key}>\n`;
            }
        }
    }

    xmlResponse += '</response>';

    return xmlResponse;
}