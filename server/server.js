const fs = require('fs');
const path = require('path');
const connection = require("./database/connection");
const express = require('express');
const cookieParser = require('cookie-parser');
const userRoutes = require("./routes/userRoutes");
const formRoutes = require("./routes/formRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

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


/* Mount the routes to the application */

app.use("/user", userRoutes);

app.use("/formulare", formRoutes);

app.use("/", recipeRoutes);

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