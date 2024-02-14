async function createUser() {
    const url = prompt('Geben Sie den Link zu einem Youtube Kanal oder einer Playlist bzw. die dazugehörige ID ein.');
    if (url) {
        await showLoadingOverlay();
        const channelObj = await getChannelIdByURL(url);
        const channelId = channelObj.value;

        if (channelId) {
            console.log(channelId);
            const isPlaylist = channelObj.type === 'playlist';

            const userExists = getDBArray('SELECT deleted FROM users WHERE channelId = ?', [channelId]);
            if (userExists.length === 0) {
                // Neuer User
                try {
                    const yt = new YtAPI();
                    const userInfo = await yt.getUserInfo(channelId, isPlaylist);
                    if (userInfo) {
                        showUserModal(userInfo);
                    } else {
                        // Es konnte zwar eine channelId aus dem Link extrahiert werden, aber der Benutzer existiert nicht
                        bsAlert(`${isPlaylist ? 'Diese Playlist' : 'Dieser Benutzer'} existiert nicht oder wurde gelöscht / auf privat gestellt.`, alertType.warning);
                    }
                } catch (error) {
                    console.error(error);
                }
            } else {
                //  User bereits vorhanden
                let message = `${isPlaylist ? 'Diese Playlist' : 'Dieser Benutzer'} existiert bereits`;

                if (userExists[0].deleted) {
                    message += `, wurde allerdings gelöscht.\nSoll ${isPlaylist ? 'sie' : 'er'} wiederhergestellt werden?`
                    if (confirm(message)) {
                        runQuery('UPDATE users SET deleted = 0 WHERE channelId = ?', [channelId]);
                        loadTable();
                    }
                } else {
                    bsAlert(message + '.', alertType.info);
                }
            }
        } else {
            if (channelObj.type !== 'error') {
                bsAlert('Es wurde kein Kanal / keine Playlist gefunden.', alertType.warning);
            }
        }

        await hideLoadingOverlay();
    }
}

async function getChannelIdByURL(url) {
    if (url) {
        const youtubeParams = extractYoutubeParams(url);
        console.log(youtubeParams);

        switch (youtubeParams.type) {
            case 'playlist':
            case 'channel':
                return youtubeParams;
            case 'user':
                try {
                    const ytUser = new YtAPI();
                    return { type: 'channel', value: await ytUser.getChannelIdByUserName(youtubeParams.value) };
                } catch (error) {
                    console.error(error);
                    return { type: 'error', value: '' };
                }
            case 'handle':
            case 'custom':
                try {
                    const ytCustom = new YtAPI();
                    return { type: 'channel', value: await ytCustom.getChannelIdByCustomUrl(youtubeParams.value) };
                } catch (error) {
                    console.error(error);
                    return { type: 'error', value: '' };
                }
            default:
                return { type: 'none', value: '' };
        }
    }
}

function extractYoutubeParams(url) {
    // RegEx aus https://github.com/mattwright324/youtube-metadata
    const patterns = {
        // video_id: [
        //     /(?:http[s]?:\/\/)?(?:\w+\.)?youtube.com\/watch\?v=([\w_-]+)(?:[\/&].*)?/i,
        //     /(?:http[s]?:\/\/)?(?:\w+\.)?youtube.com\/(?:v|embed|shorts|video|watch|live)\/([\w_-]+)(?:[\/&].*)?/i,
        //     /(?:http[s]?:\/\/)?youtu.be\/([\w_-]+)(?:\?.*)?/i,
        //     /^([\w-]{11})$/i
        // ],
        playlist_id: [
            /(?:http[s]?:\/\/)?(?:\w+\.)?youtube.com\/playlist\?list=([\w_-]+)(?:&.*)?/i,
            /(?:http[s]?:\/\/)?(?:\w+\.)?youtube.com\/watch\?v=(?:[\w_-]+)&list=([\w_-]+)(?:&.*)?/i,
            /^((UU|UUSH|PL|FL|SP|OLAK)[A-Za-z0-9_-]+)$/i
        ],
        channel_id: [
            /(?:http[s]?:\/\/)?(?:\w+\.)?youtube.com\/channel\/([\w_-]+)(?:\?.*)?/i,
            /^((UC|SC)[\w-]{22})$/i
        ],
        channel_user: [
            /(?:http[s]?:\/\/)?(?:\w+\.)?youtube.com\/user\/([\w_-]+)(?:\?.*)?/i
        ],
        channel_handle: [
            /(?:http[s]?:\/\/)?(?:\w+\.)?youtube.com\/@([^\/?]+)(?:\?.*)?/i,
        ],
        channel_custom: [
            /(?:http[s]?:\/\/)?(?:\w+\.)?youtube.com\/c\/([^\/?]+)(?:\?.*)?/i,
            /(?:http[s]?:\/\/)?(?:\w+\.)?youtube.com\/([^\/?]+)(?:\?.*)?/i
        ]
    };

    // Überprüfen, um welchen Typ es sich handelt
    for (const regex of patterns.playlist_id) {
        if (regex.test(url)) {
            const match = url.match(regex);
            return { type: 'playlist', value: match[1] };
        }
    }

    for (const regex of patterns.channel_id) {
        if (regex.test(url)) {
            const match = url.match(regex);
            return { type: 'channel', value: match[1] };
        }
    }

    for (const regex of patterns.channel_user) {
        if (regex.test(url)) {
            const match = url.match(regex);
            return { type: 'user', value: match[1] };
        }
    }

    for (const regex of patterns.channel_handle) {
        if (regex.test(url)) {
            const match = url.match(regex);
            return { type: 'handle', value: match[1] };
        }
    }

    for (const regex of patterns.channel_custom) {
        if (regex.test(url)) {
            const match = url.match(regex);
            return { type: 'custom', value: match[1] };
        }
    }

    return { type: 'unknown', value: null };
}

function editUser(usersId) {
    const userInfo = getDBArray(`SELECT usersId, channelId, userTitle, customUserTitle, privacyStatus, language, isPlaylist, inactive, hidden FROM users WHERE usersId = ?;`, usersId);
    if (userInfo && userInfo.length > 0) {
        showUserModal(userInfo[0]);
    }
}

function deleteUser(usersId) {
    if (confirm('Soll der Benutzer gelöscht werden?')) {
        runQuery(`UPDATE users SET deleted = 1 WHERE usersId = ?;`, usersId);
        loadTable();
    }
}

function restoreUser(usersId) {
    if (confirm('Soll der Benutzer wiederhergestellt werden?')) {
        runQuery(`UPDATE users SET deleted = 0 WHERE usersId = ?;`, usersId);
        loadTable();
    }
}

function eraseUser(usersId) {
    if (confirm('Soll der Benutzer endgültig gelöscht werden?')) {
        runQuery(`DELETE FROM videos WHERE usersId = ?;`, usersId, false);
        runQuery(`DELETE FROM users WHERE usersId = ?;`, usersId, false);

        switch (getPageName()) {
            case 'index':
            case 'users':
                setFilterLanguageOptions(true, true);   // Sprachen-Filter neu erstellen, falls sich etwas geändert hat
                break;
        }

        saveSQLFile();
        loadTable();
    }
}

function showUserModal(userInfo) {
    const usersId = userInfo.usersId ?? 0;
    if (usersId === 0) {
        document.getElementById('userModalLabel').textContent = `${userInfo.isPlaylist ? 'Playlist' : 'Kanal'} hinzufügen`;
    } else {
        document.getElementById('userModalLabel').textContent = `${userInfo.isPlaylist ? 'Playlist' : 'Kanal'} bearbeiten`;
    }
    document.getElementById('userForm').setAttribute('data-usersId', usersId);

    document.getElementById('btnradioChannel').checked = !userInfo.isPlaylist;
    document.getElementById('btnradioPlaylist').checked = userInfo.isPlaylist;

    document.getElementById('inputTextChannelId').value = userInfo.channelId;
    document.getElementById('inputTextUserTitle').value = userInfo.userTitle;
    document.getElementById('selectPrivacyStatus').value = userInfo.privacyStatus;

    document.getElementById('inputTextCustomUserTitle').value = userInfo.customUserTitle;
    document.getElementById('selectLanguage').value = userInfo.language ?? 'de';

    document.getElementById('inputSwitchActiveUser').checked = !(userInfo.inactive ?? false);
    document.getElementById('inputSwitchVisibleUser').checked = !(userInfo.hidden ?? false);

    showModal('userModal');
}

function saveUser(form) {
    const usersId = parseInt(form.getAttribute('data-usersId')) || 0;
    const channelId = document.getElementById('inputTextChannelId').value;
    const userTitle = document.getElementById('inputTextUserTitle').value;
    const customUserTitle = document.getElementById('inputTextCustomUserTitle').value;
    const privacyStatus = document.getElementById('selectPrivacyStatus').value;
    const language = document.getElementById('selectLanguage').value;
    const isPlaylist = document.getElementById('btnradioPlaylist').checked;
    const inactive = !document.getElementById('inputSwitchActiveUser').checked;
    const hidden = !document.getElementById('inputSwitchVisibleUser').checked;

    if (usersId > 0) {
        // Benutzer bearbeiten
        runQuery('UPDATE users SET customUserTitle = ?, language = ?, inactive = ?, hidden = ? WHERE usersId = ?;', [
            customUserTitle, language, inactive, hidden, usersId
        ]);
    } else {
        // Benutzer hinzufügen
        runQuery('INSERT INTO users (channelId, userTitle, customUserTitle, privacyStatus, language, isPlaylist, inactive, hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [
            channelId, userTitle, customUserTitle, privacyStatus, language, isPlaylist, inactive, hidden
        ]);

        showUserToast(channelId, customUserTitle || userTitle, isPlaylist);
        broadcastChannel.postMessage({ type: 'showUserToast', channelId: channelId, title: customUserTitle || userTitle, isPlaylist: isPlaylist });
    }

    switch (getPageName()) {
        case 'index':
        case 'users':
            setFilterLanguageOptions(true, true);   // Sprachen-Filter neu erstellen, falls sich etwas geändert hat
            break;
    }

    hideModal('userModal');

    saveSQLFile();
    loadTable();
}

function showUserToast(channelId, title, isPlaylist) {
    showToast({
        toastId: `newUserToast_${channelId}`,
        header: `<span class="fa-stack toastInfo" style="margin-right: 5px;"><i class="fas fa-circle fa-stack-2x" style="color: #006699;"></i><i class="fas fa-info fa-stack-1x fa-inverse"></i></span>${isPlaylist ? 'Playlist' : 'Kanal'} hinzugefügt`,
        body: `Sie haben ${isPlaylist ? 'die Playlist' : 'den Kanal'} "${title}" hinzugefügt.<br>Möchten Sie jetzt die Videos ${isPlaylist ? 'dieser Playlist' : 'dieses Kanals'} abrufen?`,
        buttons: [{
            text: 'Videos abrufen',
            clickFunction: getVideosNew,
            clickFunctionParams: [channelId, isPlaylist],
            type: 'primary'
        }]
    });
}

function hideUserToast(channelId, updateTabs = true) {
    const myToast = document.getElementById(`newUserToast_${channelId}`);
    if (myToast) {
        const myBsToast = new bootstrap.Toast(myToast);
        myToast.addEventListener('hidden.bs.toast', () => {
            myToast.remove();
        });
        myBsToast.hide();
    }

    if (updateTabs) {
        broadcastChannel.postMessage({ type: 'hideUserToast', channelId: channelId });
    }
}