# EmptyYourFridge.com
 
Server starten:
1.) Öffne "Git Bash" als Terminal
2.) Gebe "npm start" in den Terminal ein

Nun sollte folgende message kommen im Terminal:
[nodemon] restarting due to changes...
[nodemon] starting `node server.js`
Server running at http://localhost:3000
Connected to database.

Um Server zu Stoppen, einfach Terminal Fenster schließen!

Befehle die nützlich sind:
$ node server.js > output.log //Show log

--------------------------------------------------------------------
Folderstruktur:

project/
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── server/
│   ├── index.js
│   ├── routes/
│   │   ├── api.js
│   │   └── web.js
│   ├── controllers/
│   │   ├── apiController.js
│   │   └── webController.js
│   ├── models/
│   │   ├── userModel.js
│   │   └── otherModel.js
│   └── views/
│       ├── web/
│       │   ├── index.ejs
│       │   └── otherPage.ejs
│       └── api/
│           └── responseData.json
├── node_modules/
├── package.json
├── package-lock.json
├── .gitignore
└── README.md


> Der public/-Ordner enthält alle Dateien, die der Benutzer im Browser sehen und interagieren kann, einschließlich HTML-, CSS- und JavaScript-Dateien.

> Der server/-Ordner enthält alle Backend-Dateien, einschließlich Servercode, Routen, Controller, Model und Ansichten.

> Der routes/-Ordner enthält die Backend-Routen, die definieren, welche Funktionen aufgerufen werden sollen, wenn eine bestimmte URL aufgerufen wird.

> Der controllers/-Ordner enthält Funktionen, die von den Routen aufgerufen werden und die Geschäftslogik der Anwendung verarbeiten.

> Der models/-Ordner enthält Dateien, die die Datenbankmodelle der Anwendung definieren.

> Der views/-Ordner enthält Dateien, die die HTML-Struktur und das Erscheinungsbild der Anwendung definieren. Hier können auch Vorlagen wie EJS (Embedded JavaScript)     oder Handlebars verwendet werden.

> Der node_modules/-Ordner enthält alle installierten Abhängigkeiten des Projekts.

> Die package.json- und package-lock.json-Dateien enthalten Metadaten und Abhängigkeiten des Projekts.

> Die .gitignore-Datei wird verwendet, um Git anzuweisen, welche Dateien nicht im Repository gespeichert werden sollen.

> Die README.md-Datei enthält eine Beschreibung des Projekts.
