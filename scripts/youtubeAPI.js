class YtAPI {
    #apiKey;

    constructor() {
        this.#apiKey = getApiKey() || prompt("Es wurde kein API Key gefunden.\nBitte geben Sie diesen ein.");
        if (!this.#apiKey) {
            bsAlert("Kein API Key vorhanden. Der Vorgang wird abgebrochen.", alertType.danger, false);
            throw new Error("Kein API Key vorhanden. Das Erstellen der Instanz wird abgebrochen.");
        }

        setApiKey(this.#apiKey);
    }

    #apiFetch(apiUrl) {
        const neededQuota = apiUrl.startsWith('https://www.googleapis.com/youtube/v3/search') ? 100 : 1;
        if (neededQuota > getTotalQuota() - getQuota()) {
            bsAlert('Ihr übriges Kontingent für die YouTube Data API reicht nicht mehr für diesen Vorgang aus.', alertType.danger, false);
            throw new Error('Quota expired');   // Code komplett abbrechen
        } else {
            increaseQuota(neededQuota);

            return new Promise((resolve, reject) => {
                fetch(apiUrl)
                    .then(response => {
                        if (response.status === 200) {
                            return response.json();
                        } else {
                            return response.json().then(errorResponse => {
                                throw new Error("\nFehlercode: " + errorResponse.error.code + "\nFehlerdetails: " + errorResponse.error.message);
                            });
                        }
                    })
                    .then(responseData => {
                        console.log('responseData', responseData);
                        resolve(responseData);
                    })
                    .catch(error => {
                        console.error(`Fehler bei der Anfrage an ${apiUrl}:`, error.message);
                        reject(error);
                    })
                    .finally(() => {

                    });
            });
        }
    }

    async getChannelIdByUserName(userName) {
        // API-Endpunkt für die Suche nach Kanälen
        const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${userName}&key=${this.#apiKey}`;

        return await this.#apiFetch(apiUrl)
            .then(channelResponse => {
                console.log('channelResponse', channelResponse);
                if (channelResponse.items && channelResponse.items.length > 0) {
                    const channelId = channelResponse.items[0].id;
                    console.log('Kanal-ID:', channelId);
                    return channelId;
                } else {
                    console.log('Kein Kanal gefunden', userName);
                }
            })
            .catch(error => {
            })
    }

    async getChannelIdByCustomUrl(handle) {
        // API-Endpunkt für die Suche nach Kanälen
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=id&fields=items(id(channelId))&q=${handle}&type=channel&key=${this.#apiKey}&maxResults=50`;

        return await this.#apiFetch(apiUrl)
            .then(async responseData => {
                console.log('responseData', responseData);
                if (responseData.items && responseData.items.length > 0) {
                    const channels = responseData.items;
                    for (const channel of channels) {
                        const channelId = channel.id.channelId;
                        console.log('Kanal-ID:', channelId);
                        const customUrl = await this.#getCustomUrl(channelId);
                        if (customUrl.toLowerCase() === '@' + handle.toLowerCase()) {
                            return channelId;
                        }
                    }
                } else {
                    console.log('Kein Kanal gefunden', userName);
                }
            })
            .catch(error => {
            })
    }

    async #getCustomUrl(channelId) {
        // API-Endpunkt für die Kanalinformationen
        const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&fields=items(snippet(customUrl))&id=${channelId}&key=${this.#apiKey}`;

        return await this.#apiFetch(apiUrl)
            .then(channelResponse => {
                console.log('channelResponse', channelResponse);
                if (channelResponse.items && channelResponse.items.length > 0) {
                    const customUrl = channelResponse.items[0].snippet.customUrl;
                    console.log('Custom URL:', customUrl);
                    return customUrl;
                } else {
                    console.log('Kein Kanal gefunden', userName);
                }
            })
            .catch(error => {
            })
    }

    async refreshVideos() {
        await startProcessing();

        const pageName = getPageName();
        const filters = ['users.deleted = 0'];
        if (pageName === 'userDetails') {
            filters.push('videos.usersId = ' + getParam('usersId'))
        } else {
            const activeOnly = document.getElementById('flexSwitchCheckActiveUsers').checked;
            if (activeOnly) {
                filters.push('users.inactive = 0');
            }
        }
        const videosWithoutDurationOnly = document.getElementById('flexSwitchCheckVideosWithoutDuration').checked;
        if (videosWithoutDurationOnly) {
            filters.push('videos.duration = 0');
        }

        const query = 'SELECT videoId FROM videos INNER JOIN users ON videos.usersId = users.usersId WHERE ' + filters.join(' AND ');

        const videoIds = getDBArray(query).map(obj => obj.videoId);
        const videoCount = videoIds.length;
        let videoIndex = 0;

        const videoIdArrays = splitArrayIntoChunks(videoIds, 50);
        for (const videoIdArray of videoIdArrays) {
            //bsAlert(videoIdArray.join(','));
            try {
                const videoInfos = await this.#getVideoInfos(videoIdArray.join(','));

                if (videoInfos && videoInfos.length > 0) {
                    for (const videoInfo of videoInfos) {
                        //console.log(videoInfo);
                        runQuery(`UPDATE videos SET title = ?, privacyStatus = ?, duration = ?, publishedAt = ? WHERE videoId = ?;`, [videoInfo.title, videoInfo.privacyStatus, videoInfo.duration, videoInfo.publishedAt, videoInfo.videoId], false);  // Datenbank erst am Ende speichern
                        await updateProgress(videoIndex, videoCount);
                        videoIndex++;
                    }

                    const videoIds_API = videoInfos.map(obj => obj.videoId);
                    const videoIds_deleted = videoIdArray.filter(item => !videoIds_API.includes(item));
                    if (videoIds_deleted && videoIds_deleted.length > 0) {
                        for (const videoId_deleted of videoIds_deleted) {
                            console.log('videoId_deleted', videoId_deleted);
                            runQuery(`UPDATE videos SET privacyStatus = 'deleted' WHERE videoId = ?;`, [videoId_deleted], false);   // Datenbank erst am Ende speichern
                            await updateProgress(videoIndex, videoCount);
                            videoIndex++;
                        }
                    }
                } else {
                    // Alle gesuchten Videos sind nicht vorhanden
                    for (const videoId_deleted of videoIdArray) {
                        console.log('videoId_deleted', videoId_deleted);
                        runQuery(`UPDATE videos SET privacyStatus = 'deleted' WHERE videoId = ?;`, [videoId_deleted], false);   // Datenbank erst am Ende speichern
                        await updateProgress(videoIndex, videoCount);
                        videoIndex++;
                    }
                }
            } catch (error) {
                await endProcessing();
                return;
            }
        }
    }

    async getVideosNew(usersId, channelId, isPlaylist) {
        this.#videoIndex = 0;
        const newOnly = false;  // Bei neuen Einträgen würden zwar sowieso immer alle Videos gesucht werden, aber so werden mehr Items gleichzeitig abgerufen

        await startProcessing();

        try {
            if (isPlaylist) {
                await this.#getVideosByPlaylist(usersId, channelId, newOnly, true);
            } else {
                await this.#getVideosByUser(usersId, channelId, newOnly, true);
            }
        } catch (error) {
            endProcessing();
            return;
        }
    }

    async getVideosAll(users) {
        await startProcessing();

        const newOnlySwitch = document.getElementById('flexSwitchCheckNewVideos');
        const newOnly = newOnlySwitch.checked;    // Überprüfen, ob aufgehört werden soll zu suchen, wenn man bei einem Video ankommt, das bereits in der Datenbank ist

        const userCount = users.length;
        let userIndex = 0;
        console.log('userCount', userCount);

        for (const { usersId, channelId, isPlaylist } of users) {
            hideUserToast(channelId);

            console.log('usersId:', usersId);
            console.log('channelId:', channelId);
            console.log('isPlaylist:', isPlaylist);

            try {
                if (isPlaylist) {
                    await this.#getVideosByPlaylist(usersId, channelId, newOnly);
                } else {
                    await this.#getVideosByUser(usersId, channelId, newOnly);
                }
            } catch (error) {
                await endProcessing();
                return;
            }

            await updateProgress(userIndex, userCount);
            userIndex++;
        }
    }

    #videoIndex;

    async getVideosPlaylist(usersId, playlistId) {
        this.#videoIndex = 0;
        const newOnlySwitch = document.getElementById('flexSwitchCheckNewVideos');
        const newOnly = newOnlySwitch.checked;    // Überprüfen, ob aufgehört werden soll zu suchen, wenn man bei einem Video ankommt, das bereits in der Datenbank ist

        if (newOnly) {
            await showLoadingOverlay();   // Hier könnte man die Progressbar nicht sinnvoll einsetzen
        } else {
            await startProcessing();
        }

        try {
            await this.#getVideosByPlaylist(usersId, playlistId, newOnly, true);
        } catch (error) {
            if (newOnly) {
                await hideLoadingOverlay();
            } else {
                endProcessing();
            }
            return;
        }

        if (newOnly) {
            await hideLoadingOverlay();
        }
    }

    async getVideosUser(usersId, channelId) {
        this.#videoIndex = 0;
        const newOnlySwitch = document.getElementById('flexSwitchCheckNewVideos');
        const newOnly = newOnlySwitch.checked;    // Überprüfen, ob aufgehört werden soll zu suchen, wenn man bei einem Video ankommt, das bereits in der Datenbank ist

        if (newOnly) {
            await showLoadingOverlay();   // Hier könnte man die Progressbar nicht sinnvoll einsetzen
        } else {
            await startProcessing();
        }

        try {
            await this.#getVideosByUser(usersId, channelId, newOnly, true);
        } catch (error) {
            if (newOnly) {
                await hideLoadingOverlay();
            } else {
                endProcessing();
            }
            return;
        }

        if (newOnly) {
            await hideLoadingOverlay();
        }
    }

    async #getVideosByPlaylist(usersId, playlistId, newOnly = true, singleUser = false) {
        // API-Endpunkt für die Playlist
        const part = 'snippet,status';
        const fields = 'items(snippet(title,defaultLanguage),status(privacyStatus))';
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=${part}&fields=${fields}&id=${playlistId}&key=${this.#apiKey}`;

        //this.#userIndex++;

        await this.#apiFetch(playlistUrl)
            .then(async playlistResponse => {
                console.log('playlistResponse', playlistResponse);
                if (playlistResponse.items && playlistResponse.items.length > 0) {
                    const playlistTitle = playlistResponse.items[0].snippet.title;
                    const privacyStatus = playlistResponse.items[0].status.privacyStatus;
                    const language = playlistResponse.items[0].snippet.defaultLanguage;
                    this.#updateUserInfo(usersId, playlistTitle, privacyStatus, language);

                    await this.#getPlaylistVideos(usersId, playlistId, newOnly, singleUser);
                } else {
                    console.log('Die Playlist wurde nicht gefunden oder gelöscht.\nusersId:', usersId);
                    this.#setUserDeleted(usersId);
                    if (singleUser && !newOnly) {
                        await endProcessing();
                    }
                }
            })
            .catch(async error => {
                if (singleUser && !newOnly) {
                    await endProcessing();
                }
            })
    }

    async #getVideosByUser(usersId, channelId, newOnly = true, singleUser = false) {
        // API-Anfrage für die Upload-Playlist-ID des Kanals
        const part = 'contentDetails,snippet,status';
        const fields = 'items(contentDetails(relatedPlaylists(uploads)),snippet(title,defaultLanguage),status(privacyStatus))';
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=${part}&fields=${fields}&id=${channelId}&key=${this.#apiKey}`;

        //this.#userIndex++;

        await this.#apiFetch(channelUrl)
            .then(async channelResponse => {
                console.log('channelResponse', channelResponse);
                if (channelResponse.items && channelResponse.items.length > 0) {
                    // Extrahieren Sie die Upload-Playlist-ID des Kanals
                    const uploadPlaylistId = channelResponse.items[0].contentDetails.relatedPlaylists.uploads;

                    const userTitle = channelResponse.items[0].snippet.title;
                    const privacyStatus = channelResponse.items[0].status.privacyStatus;
                    const language = channelResponse.items[0].snippet.defaultLanguage;
                    this.#updateUserInfo(usersId, userTitle, privacyStatus, language);

                    await this.#getPlaylistVideos(usersId, uploadPlaylistId, newOnly, singleUser);
                } else {
                    console.log('Der Kanal wurde nicht gefunden oder gelöscht.\nusersId:', usersId);
                    this.#setUserDeleted(usersId);
                    if (singleUser && !newOnly) {
                        await endProcessing();
                    }
                }
            })
            .catch(async error => {
                if (singleUser && !newOnly) {
                    await endProcessing();
                }
            })
    }

    async #getPlaylistVideos(usersId, playlistId, newOnly, singleUser, pageToken = '') {
        // YouTube API-Endpunkt für die Playlist-Items
        const maxResults = newOnly ? 5 : 50;   // Wenn alle Videos durchsucht werden sollen, die maximale Anzahl auslesen, sonst weniger, um Zeit zu sparen, da es pro Kanal in der Regel nicht so viele neue Videos gibt
        const part = 'snippet,status';
        const fields = 'items(snippet(resourceId(videoId),title),status(privacyStatus)),nextPageToken,pageInfo(totalResults,resultsPerPage)';
        const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=${part}&fields=${fields}&playlistId=${playlistId}&pageToken=${pageToken}&key=${this.#apiKey}&maxResults=${maxResults}`;

        await this.#apiFetch(apiUrl)
            .then(async responseData => {
                console.log('playlistResponse', responseData);
                let nextPageToken = responseData.nextPageToken;
                const videoCount = responseData.pageInfo.totalResults;

                // Iteration durch die erhaltenen Videos
                for (const video of responseData.items) {
                    let videoId = video.snippet.resourceId.videoId;
                    let title = video.snippet.title;
                    let privacyStatus = video.status.privacyStatus;

                    const videoExists = await this.#checkVideoExists(usersId, videoId, title, privacyStatus);   // wenn ein Video bereits in der Datenbank ist, keine weiteren Videos abfragen

                    if (videoExists && newOnly) {
                        nextPageToken = null;
                        break;  // Man ist bei den Videos angekommen, die man schon hat, also Schleife verlassen
                    }

                    if (singleUser && !newOnly) {
                        await updateProgress(this.#videoIndex, videoCount);
                        this.#videoIndex++;
                    }
                }

                // Überprüfen Sie, ob weitere Seiten verfügbar sind
                if (nextPageToken) {
                    // Wenn nextPageToken vorhanden ist, rufen Sie die nächste Seite ab
                    await this.#getPlaylistVideos(usersId, playlistId, newOnly, singleUser, nextPageToken);
                } else {
                    // Ein Benutzer wurde abgeschlossen
                }
            })
            .catch(async error => {
                if (singleUser && !newOnly) {
                    await endProcessing();
                }
            })
        console.log('Playlist fertig', pageToken);
    }

    #updateUserInfo(usersId, userTitle, privacyStatus, language) {
        const userInfo = getDBArray(`SELECT userTitle, privacyStatus, language FROM users WHERE usersId = ?;`, [usersId]);

        if (!language) {
            language = userInfo[0].language;    // Wert aus Datenbank nehmen, wenn nicht festgelegt
        }

        if (userInfo[0].userTitle !== userTitle || userInfo[0].privacyStatus !== privacyStatus || userInfo[0].language !== language) {
            console.log('User-Eintrag wird aktualisiert')
            runQuery(`UPDATE users SET userTitle = ?, privacyStatus = ?, language = ? WHERE usersId = ?;`, [userTitle, privacyStatus, language, usersId], false); // Datenbank erst am Ende speichern
        }
    }

    #setUserDeleted(usersId) {
        runQuery(`UPDATE users SET privacyStatus = 'deleted' WHERE usersId = ?;`, [usersId], false); // Datenbank erst am Ende speichern
    }

    async #checkVideoExists(usersId, videoId, title, privacyStatus) {
        const dbVideo = getDBArray(`SELECT videosId, title, privacyStatus, duration FROM videos WHERE usersId = ? AND videoId = ?;`, [usersId, videoId]);   // Nicht nur auf videoId prüfen, da Videos durch Playlists doppelt vorhanden sein können
        if (dbVideo.length === 0) {
            console.log('Neues Video in Datenbank speichern');
            const videoInfos = await this.#getVideoInfos(videoId);    // Man könnte auch usersId und videoId in eine Variable speichern und am Ende mehrere Videos auf einmal abrufen, um Quota zu sparen
            if (videoInfos && videoInfos.length > 0) {
                const videoInfo = videoInfos[0];
                runQuery(`INSERT INTO videos (usersId, videoId, title, originalTitle, duration, publishedAt, privacyStatus) VALUES(?, ?, ?, ?, ?, ?, ?);`,
                    [usersId, videoId, videoInfo.title, videoInfo.title, videoInfo.duration, videoInfo.publishedAt, videoInfo.privacyStatus], false);   // Datenbank erst am Ende speichern
                runQuery('UPDATE users SET userVideoCount = userVideoCount + 1 WHERE usersId = ?;', [usersId], false);  // Datenbank erst am Ende speichern
            }
        } else {
            if (dbVideo[0].duration === 0) { // Keine Dauer. Vermutlich Livestream, der vorab gespeichert wurde. Möglicherweise tritt das nur bei alten Daten auf
                const videoInfos = await this.#getVideoInfos(videoId);    // Man könnte auch usersId und videoId in eine Variable speichern und am Ende mehrere Videos auf einmal abrufen, um Quota zu sparen
                if (videoInfos && videoInfos.length > 0) {
                    const videoInfo = videoInfos[0];
                    console.log('Video-Eintrag wird aktualisiert (Dauer)')
                    runQuery(`UPDATE videos SET title = ?, privacyStatus = ?, duration = ?, publishedAt = ? WHERE videosId = ?;`, [videoInfo.title, videoInfo.privacyStatus, videoInfo.duration, videoInfo.publishedAt, dbVideo[0].videosId], false);   // Datenbank erst am Ende speichern
                }
            } else {
                if (dbVideo[0].title !== title || dbVideo[0].privacyStatus !== privacyStatus) {
                    console.log('Video-Eintrag wird aktualisiert')
                    runQuery(`UPDATE videos SET title = ?, privacyStatus = ? WHERE videosId = ?;`, [title, privacyStatus, dbVideo[0].videosId], false); // Datenbank erst am Ende speichern
                }
            }

            return true;
        }
    }

    async #getVideoInfos(videoIds) {
        // API-Endpunkt für die Suche nach Videos
        const part = 'id,snippet,contentDetails,status';
        const fields = 'items(id,snippet(title,publishedAt),contentDetails(duration),status(privacyStatus))';
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=${part}&fields=${fields}&id=${videoIds}&key=${this.#apiKey}`;

        return await this.#apiFetch(apiUrl)
            .then(videoResponse => {
                console.log('videoResponse', videoResponse);
                if (videoResponse.items && videoResponse.items.length > 0) {
                    const videoInfos = [];
                    for (const item of videoResponse.items) {
                        const title = item.snippet.title;
                        const duration = convertDurationToSeconds(item.contentDetails.duration);
                        const publishedAt = item.snippet.publishedAt;
                        const privacyStatus = item.status.privacyStatus;
                        const videoId = item.id;

                        console.log('title:', title);
                        console.log('duration:', duration);
                        console.log('publishedAt:', publishedAt);
                        console.log('privacyStatus:', privacyStatus);
                        console.log('videoId:', videoId);

                        videoInfos.push({ title: title, duration: duration, publishedAt: publishedAt, privacyStatus: privacyStatus, videoId: videoId });
                    }
                    return videoInfos;
                } else {
                    console.log('Kein Video gefunden', userName);
                }
            })
            .catch(error => {
            })
    }

    async getUserInfo(channelId, isPlaylist) {
        const part = 'snippet,status';
        const fields = 'items(snippet(title,defaultLanguage),status(privacyStatus))';
        let apiUrl;
        if (isPlaylist) {
            // API-Endpunkt für die Suche nach Playlists
            apiUrl = `https://www.googleapis.com/youtube/v3/playlists?part=${part}&fields=${fields}&id=${channelId}&key=${this.#apiKey}`;
        } else {
            // API-Endpunkt für die Suche nach Kanälen
            apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=${part}&fields=${fields}&id=${channelId}&key=${this.#apiKey}`;
        }

        return await this.#apiFetch(apiUrl)
            .then(async responseData => {
                console.log('responseData channel/playlist', responseData);
                if (responseData.items && responseData.items.length > 0) {
                    const title = responseData.items[0].snippet.title;
                    const privacyStatus = responseData.items[0].status.privacyStatus;
                    const language = responseData.items[0].snippet.defaultLanguage;
                    return { channelId: channelId, userTitle: title, customUserTitle: title, privacyStatus: privacyStatus, language: language, isPlaylist: isPlaylist };
                } else {
                    console.log('Der Kanal / die Playlist wurde nicht gefunden oder gelöscht.\channelId:', channelId);
                    return null;
                }
            })
            .catch(error => {
            })
    }
}