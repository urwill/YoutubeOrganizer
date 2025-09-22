function clickVideo(videosId, usersId, linkElem, reloadTable = true) {
    if (linkElem) {
        privacyStatus = getDBValue('privacyStatus', 'videos', 'videosId = ?', videosId);
        if (privacyStatus === 'private' || privacyStatus === 'deleted') {
            if (confirm('Das Video ist nicht mehr öffentlich verfügbar.\nSoll die Wayback Machine nach einem passenden Eintrag durchsucht werden?')) {
                linkElem.href = 'https://web.archive.org/web/*/' + linkElem.href;
            }
        }
    }

    if (document.getElementById('filterSeen').value == 0) {
        runQuery('UPDATE videos SET seen = 1 WHERE videosId = ?;', [videosId], false);  // Datenbank erst am Ende speichern
        runQuery('UPDATE users SET seenVideoCount = seenVideoCount + 1 WHERE usersId = ?;', [usersId], false);    // Datenbank erst am Ende speichern

        //Tabelle mit den neuen Daten aktualisieren
        if (reloadTable) {
            saveSQLFile();
            loadTable();
            showSeenToast([{ videosId: videosId, usersId: usersId }]);
            //saveToWaybackMachine([{videosId: videosId}]);
        }
    }
}

function showSeenToast(videoInfos) {
    const uniqueValue = Date.now();
    const toastId = `seenToast_${uniqueValue}`;
    let headerText;
    let body;
    if (videoInfos.length === 1) {
        headerText = 'Video angesehen';
        const videoTitle = getDBValue('title', 'videos', 'videosId = ?', videoInfos[0].videosId);
        body = `Das Video "${videoTitle}" wurde als gesehen markiert.`
    } else {

        headerText = 'Playlist erstellt';
        body = `${videoInfos.length} Videos wurden als gesehen markiert.`
    }

    showToast({
        toastId: toastId,
        header: `<span class="fa-stack toastInfo" style="margin-right: 5px;"><i class="fas fa-circle fa-stack-2x" style="color: #006699;"></i><i class="fas fa-info fa-stack-1x fa-inverse"></i></span>${headerText}`,
        body: body,
        buttons: [{
            text: 'Rückgängig machen',
            clickFunction: videosUnseen,
            clickFunctionParams: [videoInfos, toastId],
            type: 'primary'
        }],
        delay: 30000
    });
}

function hideSeenToast(toastId) {
    const myToast = document.getElementById(toastId);
    if (myToast) {
        const myBsToast = new bootstrap.Toast(myToast);
        myToast.addEventListener('hidden.bs.toast', () => {
            myToast.remove();
        });
        myBsToast.hide();
    }
}

function videosUnseen(videoInfos, toastId) {
    for (const videoInfo of videoInfos) {
        videoUnseen(videoInfo.videosId, videoInfo.usersId);
    }
    hideSeenToast(toastId);
    saveSQLFile();
    loadTable();
}

function videoUnseen(videosId, usersId, reloadTable = false) {
    runQuery(`UPDATE videos SET seen = 0 WHERE videosId = ?;`, videosId, false);
    runQuery(`UPDATE users SET seenVideoCount = seenVideoCount - 1 WHERE usersId = ?;`, usersId, false);

    if (reloadTable) {
        saveSQLFile();
        loadTable();
    }
}

function selectPlaylistType(elem) {
    selectDropdownItem(elem, 'playlistDropdownMenu');
    const type = getDropdownValue('playlistDropdownMenu');
    createPlaylist(type);
}

function getDropdownValue(dropdownMenuId) {
    const playlistDropdownMenu = document.getElementById(dropdownMenuId);
    const selectedDropdownItem = playlistDropdownMenu.getElementsByClassName('active')[0];
    return selectedDropdownItem.getAttribute('data-value');
}

function selectDropdownItem(elem, dropdownMenuId) {
    const activeDropdownItems = document.getElementById(dropdownMenuId).getElementsByClassName('active');
    removeClassFromElements(activeDropdownItems, 'active');
    elem.classList.add('active');
}

function selectAllRows(tableId = 'dataTable') {
    const rows = document.getElementById(tableId).querySelectorAll('tr:not(:has(td.dataTables_empty))');
    addClassToElements(rows, 'selected');
}

function deselectAllRows(tableId = 'dataTable') {
    const rows = document.getElementById(tableId).querySelectorAll('tr:not(:has(td.dataTables_empty))');
    removeClassFromElements(rows, 'selected');
}

function createPlaylist(type) {
    const origType = type;  // Ursprünglichen type speichern, um später zu entscheiden, ob eine Meldung ausgegeben wird
    if (type === 'button') {
        type = getDropdownValue('playlistDropdownMenu');
    }

    let selectedRows;

    switch (type) {
        case 'selected':
            selectedRows = dataTable.rows('.selected').data().toArray();
            break;
        case 'page':
            selectAllRows();
            selectedRows = dataTable.rows('.selected').data().toArray();
            break;
        case 'all':
            selectedRows = dataTable.rows().data().toArray();
            break;
    }

    if (selectedRows.length === 0) {
        if (origType === 'button') {
            // Bei Auswahl aus dem Dropdown keine Meldung anzeigen
            switch (type) {
                case 'selected':
                    bsAlert('Es wurden keine Zeilen ausgewählt, aus denen eine Playlist erstellt werden könnte.', alertType.info);
                    break;
                case 'page':
                    bsAlert('Es werden keine Zeilen angezeigt, aus denen eine Playlist erstellt werden könnte.', alertType.info);
                    break;
                case 'all':
                    bsAlert('Die Liste enthält keine Einträge, aus denen eine Playlist erstellt werden könnte.', alertType.info);
                    break;
            }
        }
        return;
    }

    if (selectedRows.length > 50) {
        let message = `Eine temporäre Playlist kann maximal 50 Einträge enthalten.\nWenn Sie fortfahren, werden also ${Math.ceil(selectedRows.length / 50)} Playlists erstellt.\n\n`;
        if (document.getElementById('filterSeen').value === '0') {
            message += 'Bedenken Sie bitte auch, dass alle Videos, für die Sie eine Playlist erstellen, als gesehen markiert werden.\nWenn Sie also die Links verlieren oder YouTube die temporären Playlists entfernt, können Sie nicht mehr nachvollziehen welche Videos Sie noch nicht gesehen haben.'
        } else {
            message += 'Beachten Sie außerdem, dass YouTube die temporären Playlists nach gewisser Zeit entfernen könnte.'
        }
        message += '\n\nWollen Sie wirklich fortfahren?';

        if (!confirm(message)) {
            return;
        }
    }
    const pageName = getPageName();

    const videosIdIndex = getColumnIndex('videosId');
    let usersIdIndex;
    let usersId;
    if (pageName === 'index') {
        usersIdIndex = getColumnIndex('usersId');
    } else {
        usersId = getParam('usersId');
    }
    const videoIdIndex = getColumnIndex('videoId');
    const videoIds = [];
    const videoInfos = [];

    // Hier kannst du Aktionen mit den ausgewählten Zeilen durchführen
    for (const rowData of selectedRows) {
        // Hier kannst du auf verschiedene Spalten zugreifen
        const videosId = rowData[videosIdIndex];
        if (pageName === 'index') {
            usersId = rowData[usersIdIndex];
        }
        const videoId = rowData[videoIdIndex];
        videoIds.push(videoId);
        videoInfos.push({ videosId: videosId, usersId: usersId });

        clickVideo(videosId, usersId, null, false);
    }

    createPlaylistLink(videoIds);
    saveSQLFile();
    loadTable();
    showSeenToast(videoInfos);
    //saveToWaybackMachine(videoInfos);
}

async function getVideosNew(channelId, isPlaylist) {
    hideUserToast(channelId);

    try {
        const usersId = getDBValue('usersId', 'users', 'channelId = ?', channelId);
        const yt = new YtAPI();
        await yt.getVideosNew(usersId, channelId, isPlaylist);
    } catch (error) {
        console.error(error);
    }

    saveSQLFile();
    loadTable();
}

async function getVideosUserDetails() {
    const usersId = getParam('usersId');
    const channelId = getChannelId();
    const isPlaylist = getIsPlaylist();

    hideUserToast(channelId);

    if (isPlaylist) {
        try {
            const yt = new YtAPI();
            await yt.getVideosPlaylist(usersId, channelId);
        } catch (error) {
            console.error(error);
        }
    } else {
        try {
            const yt = new YtAPI();
            await yt.getVideosUser(usersId, channelId);
        } catch (error) {
            console.error(error);
        }
    }

    saveSQLFile();
    loadTable();
}

async function getVideosIndex() {
    const activeOnly = document.getElementById('flexSwitchCheckActiveUsers').checked;
    const users = getDBArray(`SELECT usersId, channelId, isPlaylist FROM users WHERE privacyStatus <> 'deleted' AND deleted = 0 ${activeOnly ? ' AND inactive = 0;' : ';'}`);

    try {
        const yt = new YtAPI();
        await yt.getVideosAll(users);
    } catch (error) {
        console.error(error);
    }

    saveSQLFile();
    loadTable();
}

async function getVideos() {
    const start = new Date();
    const newVids = document.getElementById('btnradioNewVideos').checked;

    if (newVids) {
        const pageName = getPageName();
        if (pageName === 'userDetails') {
            await getVideosUserDetails();
        } else {
            await getVideosIndex();
        }
    } else {
        await refreshVideos();
    }
    const elapsed = (new Date() - start);
    console.log('Dauer:', Math.floor(elapsed / 1000), 'Sekunden');
}

async function refreshVideos() {
    if (!confirm('Je nach Menge der Videos, kann dieser Vorgang sehr lange dauenn.\n\nMöchsten Sie das jetzt wirklich tun?')) {
        return;
    }
    try {
        const yt = new YtAPI();
        await yt.refreshVideos();
    } catch (error) {
        console.error(error);
    }

    saveSQLFile();
    loadTable();
}

function btnradioVideosChange(elem) {
    if (elem.id === 'btnradioNewVideos') {
        document.getElementById('flexSwitchCheckNewVideos').parentNode.style.display = '';
        document.getElementById('flexSwitchCheckVideosWithoutDuration').parentNode.style.display = 'none';
    } else {
        document.getElementById('flexSwitchCheckNewVideos').parentNode.style.display = 'none';
        document.getElementById('flexSwitchCheckVideosWithoutDuration').parentNode.style.display = '';
    }
}