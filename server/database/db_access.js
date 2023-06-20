function createUser(connection, email, password, cookie, salt, callback) {
    const query = `INSERT INTO user (email, password, cookie, salt) VALUES ('${email}', '${password}', '${cookie}', '${salt}')`;

    connection.query(query, (error, results, fields) => {
        if (error) {
            callback(error);
        } else {
            callback(null, results.insertId);
        }
    });
}

function getUser(connection, email, callback) {
    const query = `SELECT * FROM user WHERE email = '${email}'`;

    connection.query(query, (error, results, fields) => {
        if (error) {
            callback(error);
        } else {
            const user = results[0];
            callback(null, user);
        }
    });
}

function deleteUser(connection, email, callback) {
    // SQL-Abfrage zum Löschen eines Benutzerkontos
    let query = `SELECT id FROM user WHERE email = '${email}'`;

    connection.query(query, (error, results, fields) => {
        if (error) {
            callback(error);
        } else {
            const user = results[0];

            query = `DELETE FROM savedrecipes WHERE userId = '${user.id}'`;

            connection.query(query, (error, results, fields) => {
                if (error) {
                    callback(error);
                } else {
                    query = `DELETE FROM user WHERE email = '${email}'`;

                    connection.query(query, (error, results, fields) => {
                        if (error) {
                            callback(error);
                        } else {
                            const user = results[0];
                            callback(null, user);
                        }
                    });
                }
            });

        }
    });
}

function getCookie(connection, cookie, callback) {
    const query = `SELECT * FROM user WHERE cookie = '${cookie}'`;

    connection.query(query, (error, results, fields) => {
        if (error) {
            callback(error);
        } else {
            if (results.length === 0) {
                callback('No user found with that cookie: ' + cookie);
            } else {
                const user = results[0];
                callback(null, user);
            }
        }
    });
}

function setCookie(connection, email, cookie, callback) {
    const query = `UPDATE user SET cookie = '${cookie}' WHERE email = '${email}'`;

    connection.query(query, (error, results, fields) => {
        if (error) {
            callback(error);
        } else {
            if (results.affectedRows === 0) {
                callback(new Error('No user found with that email'));
            } else {
                callback(null);
            }
        }
    });
}

function getEmailByCookie(connection, cookie, callback) {
    const query = `SELECT * FROM user WHERE cookie = '${cookie}'`;

    connection.query(query, (error, results, fields) => {
        if (error) {
            callback(error);
        } else {
            const user = results[0];
            callback(null, user);
        }
    });
}

function getIdByCookie(connection, cookie, callback) {
    const query = `SELECT id FROM user WHERE cookie = '${cookie}'`;

    connection.query(query, (error, results, fields) => {
        if (error) {
            callback(error);
        } else {
            if (results.length === 0) {
                callback(new Error('No user found with that cookie'));
            } else {
                const user = results[0];
                callback(null, user);
            }
        }
    });
}

function saveRecipe(connection, user_id, usedIngredients, unusedIngredients, missedIngredients, title, image, callback) {
    const query = `INSERT INTO savedrecipes (title, userId, image, usedIngredients, unusedIngredients, missedIngredients) VALUES ('${title}', ${user_id}, '${image}', '${usedIngredients}', '${unusedIngredients}', '${missedIngredients}')`;

    connection.query(query, (error, results, fields) => {
        if (error) {
            callback(error);
        } else {
            callback(null, results.insertId);
        }
    });
}

function getAllUserRecipes(connection, user_id, callback){
    const query = `SELECT * FROM savedrecipes WHERE userId = '${user_id}'`;
    connection.query(query, function (error, results, fields) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, results);
        }
    });
}

function deleteUserRecipe(connection, user_id, recipeTitle,callback){
    const query = `DELETE FROM savedrecipes WHERE userId = '${user_id}' AND title = '${recipeTitle}'`;

    connection.query(query, function (error, results, fields) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, results);
        }
    });
}

function updateUserRecipe(connection, user_id, oldTitle, newTitle, image, usedIngredients, unusedIngredients, missedIngredients, callback){
    const query = `UPDATE savedrecipes SET title = '${newTitle}', userId = '${user_id}', image = '${image}', usedIngredients = '${usedIngredients}', unusedIngredients = '${unusedIngredients}', missedIngredients = '${missedIngredients}' WHERE userId = '${user_id}' AND title = '${oldTitle}'`;

    connection.query(query, function (error, results, fields) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, results);
        }
    });
}

function checkIfRecipeAlreadySaved(connection, user_id, title, callback) {
    const query = `SELECT * FROM savedrecipes WHERE userId = '${user_id}' AND title = '${title}'`;
    // Parameter für die SQL-Abfrage
    const params = [user_id, title];

    // Ausführen der SQL-Abfrage
    connection.query(query, function (error, results, fields) {
        if (error) {
            callback(error, null);
        } else {
            const recipe = results[0]; // Erster Eintrag im Ergebnis (falls vorhanden)
            callback(null, recipe);
        }
    });
}


module.exports = {
    createUser,
    getUser,
    getCookie,
    setCookie,
    deleteUser,
    getEmailByCookie,
    saveRecipe,
    getIdByCookie,
    getAllUserRecipes,
    deleteUserRecipe,
    updateUserRecipe,
    checkIfRecipeAlreadySaved,

    //updateUser,
};
