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

function getCookie(connection, cookie, callback) {
    const query = `SELECT * FROM user WHERE cookie = '${cookie}'`;

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

function deleteUser(connection, email, callback) {
    // SQL-Abfrage zum Löschen eines Benutzerkontos
    const query = `DELETE FROM user WHERE email = '${email}'`;

    connection.query(query, (error, results, fields) => {
        if (error) {
            callback(error);
        } else {
            const user = results[0];
            callback(null, user);
        }
    });
}
//-------------------------------------------------------------------------------------------------------------

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

module.exports = {
    createUser,
    getUser,
    getCookie,
    setCookie,
    deleteUser,
    getEmailByCookie,
    saveRecipe,
    getIdByCookie,

    //updateUser,
};
