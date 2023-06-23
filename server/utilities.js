const db = require("./database/db_access");
const connection = require("./database/connection");

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

function generateDummyMoneyArray(length){
    var dummyArray = [];

    for (var i = 0; i < length; i++) {
        var randomNumber = (Math.random() * (5.00 - 1.00) + 1.00).toFixed(2);
        dummyArray.push(parseFloat(randomNumber));
    }

    return dummyArray;
}

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
            res.redirect('/public/formulare/login_form.html');
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
                res.redirect('/public/formulare/login_form.html');
            }
        }
    });
}

module.exports = {
    generateXMLResponse,
    formatAPIString,
    removeDietAll,
    generateDummyMoneyArray,
    authenticateUser,
};