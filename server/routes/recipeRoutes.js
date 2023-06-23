const db = require("../database/db_access");
const path = require("path");
const express = require("express");
const {generateXMLResponse} = require("../utilities");
const connection = require("../database/connection");

const router = express.Router();

router.post('/save_recipe', (req, res) => {
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

router.get('/loadUserRecipes', (req, res) => {
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

router.delete('/savedRecipes/:recipeTitle', (req, res) => {
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

router.get('/public/html/editRecipe.html', (req, res) => {
    const recipeData = req.query.recipe;

    const filePath = path.resolve(__dirname, '../../public/html/editRecipe.html');
    res.sendFile(filePath);
});

module.exports = router;