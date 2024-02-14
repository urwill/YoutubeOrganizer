importTemplates();

async function importTemplates() {
    const cssFiles = [
        { url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css', integrity: 'sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN', crossOrigin: 'anonymous' },
        { url: 'https://cdn.datatables.net/1.13.7/css/dataTables.bootstrap5.min.css' },
        { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css' },
        { url: 'default.css' }
    ];
    for (const cssFile of cssFiles) {
        addStylesheet(cssFile.url, cssFile.integrity, cssFile.crossOrigin);
    }

    const jsFiles = [
        { url: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/sql-wasm.js' },
        { url: 'https://code.jquery.com/jquery-3.7.1.min.js', integrity: 'sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=', crossOrigin: 'anonymous' },
        { url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js', integrity: 'sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL', crossOrigin: 'anonymous' },
        { url: 'https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js' },
        { url: 'https://cdn.datatables.net/1.13.7/js/dataTables.bootstrap5.min.js' },
        { url: 'scripts/bs-alert.js' },
        { url: 'scripts/bs-toast.js' },
        { url: 'scripts/conversions.js' },
        { url: 'scripts/dataTable.js' },
        { url: 'scripts/events.js' },
        { url: 'scripts/functions.js' },
        { url: 'scripts/languages.js' },
        { url: 'scripts/localStorage.js' },
        { url: 'scripts/permissions.js' },
        { url: 'scripts/progressBar.js' },
        { url: 'scripts/settings.js' },
        { url: 'scripts/sql.js' },
        { url: 'scripts/start.js' },
        { url: 'scripts/syncDB.js' },
        { url: 'scripts/theme.js' },
        { url: 'scripts/users.js' },
        { url: 'scripts/youtubeAPI.js' }
    ];

    // Da manche Javascript Dateien aufeinander aufbauen und in der richten Reihenfolge geladen werden müssen, immer warten. Am Ende sind dann auch die benötigten Werte für dynamicData verfügbar
    for (const jsFile of jsFiles) {
        await addScript(jsFile.url, jsFile.integrity, jsFile.crossOrigin);
    }

    const pageName = getPageName();
    let displayedColumns;
    let tableHeaders = '';
    let privacyStatusOptions = '';
    let languageOptions = '';
    switch (pageName) {
        case 'userDetails':
            displayedColumns = displayedColumnsUserDetails;
            break;
        case 'users':
            displayedColumns = displayedColumnsUsers;
            break;
        case 'index':
            displayedColumns = displayedColumnsIndex;
            break;
    }
    for (const [columnName, headerText] of displayedColumns) {
        tableHeaders += `<th class="${columnName}">${headerText}</th>`;
    }
    for (const privacyStatusValue of privacyStatusValues) {
        privacyStatusOptions += `<option value="${privacyStatusValue.value}">${privacyStatusValue.text}</option>`;
    }
    for (const languageCode of languageCodes) {
        languageOptions += `<option value="${languageCode.code}">${languageCode.name}</option>`;
    }

    const htmlFiles = ['./html/loadingOverlay.html', './html/progressBar.html', './html/userModal.html', './html/navBar.html', './html/bodyContainer.html'];
    const dynamicData = {
        appName: APP_NAME,
        theme: getTheme(),
        backupReminderCheck: getBackupReminderCheck(),
        backupReminderDays: getBackupReminderDays(),
        quota: getQuota(),
        totalQuota: getTotalQuota(),
        apiKey: getApiKey(),
        index: (pageName === 'index'),
        userDetails: (pageName === 'userDetails'),
        users: (pageName === 'users'),
        indexUserDetails: ['index', 'userDetails'].includes(pageName),
        indexUsers: ['index', 'users'].includes(pageName),
        tableHeaders: tableHeaders,
        privacyStatusOptions: privacyStatusOptions,
        languageOptions: languageOptions
    };

    // // Verwenden Sie Promise.all, um auf das Ende aller Fetch-Anfragen zu warten //Behält die Reihenfolge nicht unbedingt bei
    // Promise.all(htmlFiles.map(url => fetchAndInsertHtml(url, dynamicData)))
    //     .then(() => startUp());
    for (const url of htmlFiles) {
        await fetchAndInsertHtml(url, dynamicData);
    }
    startUp();
}

// Eine Funktion, um CSS-Dateien einzubinden
function addStylesheet(url, integrity, crossOrigin) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    if (integrity) {
        link.integrity = integrity;
    }
    if (crossOrigin) {
        link.crossOrigin = crossOrigin;
    }
    document.head.appendChild(link);
}

// Eine Funktion, um JavaScript-Dateien einzubinden
function addScript(url, integrity, crossOrigin) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        if (integrity) {
            script.integrity = integrity;
        }
        if (crossOrigin) {
            script.crossOrigin = crossOrigin;
        }
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// Eine Funktion, die eine HTML-Datei holt und einfügt
function fetchAndInsertHtml(url, data) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                // Ersetze Platzhalter mit den entsprechenden Daten
                Object.keys(data).forEach(key => {
                    const regex = new RegExp(`{${key}}`, 'g');
                    html = html.replace(regex, data[key]);
                });
                // Ersetze Anzeige/Ausblendungs-Platzhalter und steuere die Sichtbarkeit der Elemente
                Object.keys(data).forEach(key => {
                    const regex = new RegExp(`{#${key}}(.*?){/${key}}`, 'gs');
                    html = html.replace(regex, data[key] ? '$1' : '');  // Zeige oder blende das Element aus
                });

                // Füge das HTML mit ersetzen Platzhaltern ein
                document.body.insertAdjacentHTML('beforeend', html);
                resolve();
            })
            .catch(error => {
                reject(error);
            });
    });
}