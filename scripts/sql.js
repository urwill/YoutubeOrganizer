let db;
const displayedColumnsIndex = [
    ['videosId', 'videosId'],
    ['usersId', 'usersId'],
    ['userName', 'Channel / Playlist'],
    ['videoId', 'videoId'],
    ['title', 'Video'],
    ['publishedAt', 'Datum'],
    ['duration', 'Dauer'],
    ['videoCount', 'Gesehen / Anzahl']
];
const displayedColumnsUserDetails = [
    ['videosId', 'videosId'],
    ['usersId', 'usersId'],
    ['videoId', 'videoId'],
    ['title', 'Video'],
    ['publishedAt', 'Datum'],
    ['duration', 'Dauer'],
    ['privacyStatus', 'Verfügbarkeit']
];
const displayedColumnsUsers = [
    ['channelId', 'channelId'],
    ['userTitle', 'Originalname'],
    ['customUserTitle', 'Anzeigename'],
    ['language', 'Sprache'],
    ['inactive', 'Inaktiv'],
    ['hidden', 'Versteckt'],
    ['videoCount', 'Videos gesehen / gesamt'],
    ['privacyStatus', 'Verfügbarkeit'],
    ['usersId', '']
];

function importDB(file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    switch (fileExtension) {
        case 'sqlite':
            importSQLite(file);
            break;
        case 'sql':
            importSQL(file);
            break;
        default:
            console.error('Nicht unterstützte Dateiendung:', fileExtension);
    }
}

function importSQLite(file) {
    const reader = new FileReader();

    reader.onload = function (event) {
        initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}` }).then(SQL => {
            const arrayBuffer = event.target.result;
            db = new SQL.Database(new Uint8Array(arrayBuffer));

            saveSQLFile()
                .then(() => {
                    setBackupTime();   // Merken wann das letzte Backup war. Hier wurde zwar kein Backup durchgeführt, aber wenn man importieren konnte, hat man offensichtlich ein Backup
                    reloadPages();  // Andere Tabs mit den importierten Daten neu laden
                });
            loadTable();
        });
    };

    reader.readAsArrayBuffer(file);
}

function importSQL(file) {
    if (confirm('Soll die vorhandene Datenbank vorher geleert werden?\nFalls Sie das nicht tun, gibt es möglicherweise Konflike wegen identischer IDs.')) {
        emptyDB();
    }
    const reader = new FileReader();

    reader.onload = async function (event) {
        const sqlContent = event.target.result;

        // Extrahiere die INSERT INTO-Ausdrücke
        const insertMatches = sqlContent.split(/(?=INSERT INTO)/);

        await startProcessing();
        // Führe die INSERT-Statements nacheinander aus
        for (let i = 0; i < insertMatches.length; i++) {
            try {
                db.run(`${insertMatches[i]}`);
                console.log('Erfolgreich ausgeführt:', insertMatches[i]);
                await updateProgress(i, insertMatches.length);

            } catch (error) {
                console.error('Fehler bei der Ausführung von SQL:', error);
                await endProcessing();
                bsAlert('Beim Ausführen der Abfragen ist ein Fehler aufgetreten.\nDer Vorgang wird abgebrochen.', alertType.danger, false);
                return;
            }
        }

        saveSQLFile()
            .then(() => {
                setBackupTime();   // Merken wann das letzte Backup war. Hier wurde zwar kein Backup durchgeführt, aber wenn man importieren konnte, hat man offensichtlich ein Backup
                reloadPages();  // Andere Tabs mit den importierten Daten neu laden
            });
        loadTable();
    };

    reader.readAsText(file);
}

function initSQL() {
    console.log('Datenbank laden');
    initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}` }).then(SQL => {
        // Öffne oder erstelle die IndexedDB-Datenbank
        const request = indexedDB.open('YoutubeDataDB', 1);

        // Wenn die Datenbank erstellt oder aktualisiert wird
        request.onupgradeneeded = function (event) {
            console.log('onupgradeneeded event');
            const idb = event.target.result;

            // Erstelle eine Objektspeicher (ähnlich einer Tabelle)
            const objectStore = idb.createObjectStore('MyStore', { keyPath: 'id' });
            createDB(SQL, objectStore);
        };

        // Wenn die Datenbank erfolgreich geöffnet wurde
        request.onsuccess = function (event) {
            console.log('request onsuccess event');
            const idb = event.target.result;

            // IndexedDB-Objektspeicher öffnen
            const transaction = idb.transaction(['MyStore'], 'readonly');
            const objectStore = transaction.objectStore('MyStore');

            loadDB(SQL, objectStore);
        };

        // Wenn ein Fehler auftritt
        request.onerror = function (event) {
            console.error('Error opening database:', event.target.error);
        };
    });
}

function createDB(SQL, objectStore) {
    // Erstellen Sie eine SQLite-Datenbank im Speicher mit festgelegter Tabellenstruktur
    db = new SQL.Database();
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            usersId INTEGER PRIMARY KEY AUTOINCREMENT,
            channelId TEXT NOT NULL DEFAULT '',
            userTitle TEXT NOT NULL DEFAULT '',
            customUserTitle TEXT NOT NULL DEFAULT '',
            privacyStatus TEXT NOT NULL DEFAULT '',
            language TEXT NOT NULL DEFAULT '',
            seenVideoCount INTEGER NOT NULL DEFAULT 0,
            userVideoCount INTEGER NOT NULL DEFAULT 0,
            isPlaylist INTEGER NOT NULL DEFAULT 0,
            inactive INTEGER NOT NULL DEFAULT 0,
            hidden INTEGER NOT NULL DEFAULT 0,
            deleted INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS videos (
            videosId INTEGER PRIMARY KEY AUTOINCREMENT,
            usersId INTEGER NOT NULL,
            videoId TEXT NOT NULL DEFAULT '',
            originalTitle TEXT NOT NULL DEFAULT '',
            title TEXT NOT NULL DEFAULT '',
            duration INTEGER NOT NULL DEFAULT 0,
            publishedAt TEXT NOT NULL DEFAULT '',
            privacyStatus TEXT NOT NULL DEFAULT '',
            seen INTEGER NOT NULL DEFAULT 0
        );
    `);

    const binaryArray = db.export();
    saveDB(objectStore, binaryArray)
        .then(() => {
            reloadPages();  // Andere Tabs mit der neu erstellten Datenbank neu laden
        });
}

function emptyDB() {
    db.run('DELETE FROM users;');
    db.run('DELETE FROM videos;');
}

function loadDB(SQL, objectStore) {
    const getRequest = objectStore.get(1);

    getRequest.onsuccess = function (event) {
        console.log('getRequest onsuccess event');
        const storedData = event.target.result;

        if (storedData) {
            // Verwende storedData.database, um auf die gespeicherten Daten zuzugreifen
            // storedData.database ist ein Uint8Array
            db = new SQL.Database(new Uint8Array(storedData.database));
            loadTable();
        } else {
            console.error('Data not found in IndexedDB.');
        }
    };

    // Wenn ein Fehler auftritt
    getRequest.onerror = function (event) {
        console.error('Error get object store data:', event.target.error);
    };
}

async function loadTable() {
    let query;
    let displayedColumns;
    let sortColumn;
    const pageName = getPageName();

    hideDbChanges();

    switch (pageName) {
        case 'userDetails':
            const usersId = getParam('usersId');

            query = `SELECT videos.videosId, users.usersId, videos.videoId, videos.publishedAt, videos.duration, 
                videos.title, users.channelId, videos.seen, 
                CASE WHEN customUserTitle IS NOT NULL AND customUserTitle <> '' THEN customUserTitle ELSE userTitle END AS userName,
                users.isPlaylist, videos.privacyStatus FROM videos 
                LEFT OUTER JOIN users ON videos.usersId = users.usersId 
                WHERE users.deleted = 0 AND
                videos.seen = ${document.getElementById('filterSeen').value} AND 
                users.usersId = ${usersId};`;
            displayedColumns = displayedColumnsUserDetails;
            sortColumn = 'publishedAt';
            break;
        case 'users':
            query = `SELECT usersId, channelId, userTitle, customUserTitle, language, inactive, hidden,
                    users.seenVideoCount || ' / ' || users.userVideoCount AS 'videoCount', privacyStatus
                    FROM users
                    WHERE deleted = ${document.getElementById('filterDeleted').value} AND 
                    CAST(inactive AS TEXT) LIKE '${document.getElementById('filterInactive').value}' AND 
                    CAST(hidden AS TEXT) LIKE '${document.getElementById('filterHidden').value}' AND 
                    language LIKE '${document.getElementById('filterLanguage').value}' AND 
                    CAST(isPlaylist AS TEXT) LIKE '${document.getElementById('filterIsPlaylist').value}';`;
            displayedColumns = displayedColumnsUsers;
            sortColumn = 'customUserTitle';
            break;
        case 'index':
        default:
            query = `SELECT videos.videosId, videos.videoId, videos.publishedAt, videos.duration, 
                videos.title, users.channelId, videos.seen,
                CASE WHEN customUserTitle IS NOT NULL AND customUserTitle <> '' THEN customUserTitle ELSE userTitle END AS userName,
                users.seenVideoCount || ' / ' || users.userVideoCount AS 'videoCount', 
                users.isPlaylist, users.usersId FROM videos
                LEFT OUTER JOIN users ON videos.usersId = users.usersId
                WHERE users.deleted = 0 AND
                videos.seen = ${document.getElementById('filterSeen').value} AND 
                CAST(hidden AS TEXT) LIKE '${document.getElementById('filterHidden').value}' AND 
                users.language LIKE '${document.getElementById('filterLanguage').value}';`;
            displayedColumns = displayedColumnsIndex;
            sortColumn = 'publishedAt';
            break;
    }

    // Führe eine Abfrage durch
    const result = db.exec(query);

    // Anzahl Datensätze
    const totalCount = result.length > 0 ? result[0].values.length : 0;
    // Gesamtdauer
    let totalDuration = 0;
    // Aktueller Spalteninhalt
    let columnValue;
    // Array für DataTables erstellen
    let dataTableArray = [];

    //Progressbar nur bei großen Datenmengen einblenden, da es den Ablauf verzögert und das sonst nur sinnlos ausbremst
    const showProgressBar = totalCount > 5000;
    if (showProgressBar) {
        await startProcessing();
    }

    for (let i = 0; i < totalCount; i++) {
        var tableRow = [];

        // Iteriere über die Spaltennamen und wähle nur die angezeigten Spalten aus
        displayedColumns.forEach(([columnName, _]) => {
            const columnIndex = result[0].columns.indexOf(columnName);
            if (columnIndex !== -1) {
                columnValue = result[0].values[i][columnIndex];
                tableRow.push(columnValue);

                //Gesamtdauer berechnen
                if (columnName === 'duration') {
                    totalDuration += columnValue;
                }
            }
        });
        dataTableArray.push(tableRow);

        if (showProgressBar) {
            await updateProgress(i, totalCount);
        }
    }

    switch (pageName) {
        case 'index':
        case 'userDetails':
            // Titel anpassen
            document.title = `${totalCount} Videos | ${APP_NAME}`;
            // Gesamtdauer anzeigen
            document.getElementById('labelTotalDuration').innerHTML = formatDuration(totalDuration);
            break;
        case 'users':
            // Benutzeranzahl anzeigen
            document.getElementById('labelUserCount').innerHTML = totalCount;
            switch (document.getElementById('filterIsPlaylist').value) {
                case '0':
                    // Titel anpassen
                    document.title = `Kanäle | ${APP_NAME}`;
                    break;
                case '1':
                    // Titel anpassen
                    document.title = `Playlists | ${APP_NAME}`;
                    break;
                default:
                    // Titel anpassen
                    document.title = `Kanäle / Playlists | ${APP_NAME}`;
                    break; F
            }
            break;
    }

    // DataTable laden
    initDataTable(dataTableArray, sortColumn);
}

function exportDB() {
    // Exportieren der Datenbank als Uint8Array
    var binaryArray = db.export();

    // Konvertiere die Uint8Array in eine normale JavaScript-Binärdatenstruktur, z.B. Blob
    var blob = new Blob([binaryArray], { type: 'application/x-sqlite3' });

    downloadFile(blob, `backup ${getDateTimeString()}.sqlite`);
    setBackupTime();   // Merken wann das letzte Backup war
}

function saveSQLFile() {
    return new Promise((resolve, reject) => {
        // Exportieren der Datenbank als Uint8Array
        var binaryArray = db.export();

        // Öffne oder erstelle die IndexedDB-Datenbank
        const request = indexedDB.open('YoutubeDataDB', 1);

        // Wenn die Datenbank erfolgreich geöffnet wurde
        request.onsuccess = async function (event) {
            console.log('request onsuccess event');
            const idb = event.target.result;

            // IndexedDB-Objektspeicher öffnen
            const transaction = idb.transaction(['MyStore'], 'readwrite');
            const objectStore = transaction.objectStore('MyStore');

            await saveDB(objectStore, binaryArray);
            resolve();
        };

        // Wenn ein Fehler auftritt
        request.onerror = function (event) {
            console.error('Error opening database:', event.target.error);
            reject();
        };
    });
}

async function saveDB(objectStore, binaryArray) {
    return new Promise((resolve, reject) => {
        const data = new Uint8Array(binaryArray);
        const storeRequest = objectStore.put({ id: 1, database: data });

        // Wenn die Transaktion erfolgreich abgeschlossen wurde
        storeRequest.onsuccess = function (event) {
            console.log('Daten erfolgreich in IndexedDB gespeichert!');
            resolve();
        };

        // Wenn ein Fehler bei der Transaktion auftritt
        storeRequest.onerror = function (event) {
            console.error('Fehler beim Speichern der Daten in IndexedDB:', event.target.error);
            reject();
        };
    });
}

function deleteDB(databaseName = 'YoutubeDataDB') {
    if (confirm('Soll die Datenbank wirklich gelöscht werden?\nFalls kein Backup vorhanden ist, sind die Daten unwiederbringlich verloren.')) {
        indexedDB.deleteDatabase(databaseName);
        reloadPage();
        // Theoretisch müsste man jetzt die anderen Seiten neu laden, aber mache das lieber erst, wenn die neue Datenbank erstellt wurde, damit nicht mehrere Tabs versuchen das zu machen
    }
}




function runQuery(query, params = null, saveDB = true, updateTabs = true) {
    if (!Array.isArray(params)) {
        params = [params];
    }

    db.run(query, params);
    //db.exec(query);
    if (updateTabs) {    // Sonst würden die Tabs endlos gegenseitig Änderungen ausführen
        changedDB(query, params);   // Änderungen auch in anderen Tabs durchführen
    }

    if (saveDB) {
        saveSQLFile();
    }
}

function getDBValue(field, table, filterQuery = '', filterParams = null) {
    const sqlFilter = filterQuery.length > 0 ? ' WHERE ' + filterQuery : '';
    if (!Array.isArray(filterParams)) {
        filterParams = [filterParams];
    }
    const result = db.exec('SELECT ' + field + ' FROM ' + table + sqlFilter, filterParams);
    let columnValue;
    if (result.length > 0) {
        columnValue = result[0].values[0][0];
    }
    return columnValue;
}

function getDBArray(query, params = null) {
    if (!Array.isArray(params)) {
        params = [params];
    }

    const result = db.exec(query, params);

    // Überprüfen, ob das Ergebnis vorhanden ist und mindestens eine Zeile hat
    if (result.length > 0 && result[0].values.length > 0) {
        // Extrahiere die Spaltennamen aus der ersten Zeile
        const columns = result[0].columns;

        // Erstelle das resultArray
        const resultArray = result[0].values.map(row => {
            const rowObject = {};

            // Iteriere über die Spaltennamen und fülle das Objekt
            columns.forEach((column, index) => {
                rowObject[column] = row[index];
            });

            return rowObject;
        });

        console.log(resultArray);
        return resultArray;
    } else {
        console.log("Das Abfrageergebnis ist leer.");
        return [];
    }
}

function replaceHTMLEntities(column, table, primaryKey) {
    var resultSet = db.exec(`SELECT ${primaryKey}, ${column} FROM ${table};`);

    resultSet.forEach(function (result) {
        result.values.forEach(function (row) {
            const textId = row[0];
            const text = row[1];
            // HTML-Entities in Text ersetzen
            const bereinigterText = decodeEntities(text);

            // Prüfen, ob sich etwas verändert hat
            if (text !== bereinigterText) {
                console.log('ID:', textId, 'Originaltext:', text, 'Bereinigter Text:', bereinigterText);
                runQuery(`UPDATE ${table} SET ${column} = ? WHERE ${primaryKey} = ?`, [bereinigterText, textId], false);
            }
        });
    });

    saveSQLFile();
}

// Funktion zum Dekodieren von HTML-Entities
function decodeEntities(text) {
    var txt = document.createElement("textarea");
    txt.innerHTML = text;
    return txt.value;
}