const crypto = require('crypto');

function hashPassword(password) {
    // Zufälliger Salt generieren
    const salt = crypto.randomBytes(16).toString('hex');

    // Passwort mit Salt hashen
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    // Rückgabe von Salt und gehashtem Passwort als Objekt
    return {
        salt,
        hashedPassword
    };
}

function validatePassword(password, hashedPassword, salt) {
    // Das eingegebene Passwort mit dem Salt hashen
    const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    // Überprüfen, ob der gehashte Wert mit dem in der Datenbank übereinstimmt
    return passwordHash === hashedPassword;
}

module.exports = { hashPassword, validatePassword };