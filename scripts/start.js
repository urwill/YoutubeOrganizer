const APP_NAME = 'YouTube Organizer';

function startUp() {
    checkPermissions(); // Überprüfe, ob der Browser Zugriff auf alles benötigte hat
    setNavbarVariables();
    loadTheme();
    setQuotaExpireTrigger();
    initSQL();

    const pageName = getPageName();

    // Funktionen, die erst ausgeführt werden sollen, wenn die Datenbank geladen wurde
    const interval = setInterval(() => {
        if (db) {
            clearInterval(interval);

            switch (pageName) {
                case 'userDetails':
                    const linkYoutubeChannel = document.getElementById('linkYoutubeChannel');
                    linkYoutubeChannel.textContent = getChannelName();
                    linkYoutubeChannel.href = getChannelLink();
                    break;
                case 'index':
                case 'users':
                    setFilterLanguageOptions();
                    break;
            }

            setBackupReminderTrigger();
        }
    }, 100);
}

async function test() {
    //showDbChanges();
    //getDateTimeString();

    // setLocalStorageItem('theme', 'system');
    // const item = getLocalStorageItem('theme');
    // console.log(item);

    // const val = true;
    // setLocalStorageItem('val', val);
    // console.log('val', getLocalStorageItem('val'));
    // const val2 = 'true';
    // setLocalStorageItem('val2', val2);
    // console.log('val2', getLocalStorageItem('val2'));

    // await startProcessing();
    // for(let i = 0; i < 100; i++) {
    //     await updateProgress(i, 100);
    // }

    //bsAlert('Ihr übriges Kontingent für die YouTube Data API reicht nicht mehr für diesen Vorgang aus.', alertType.danger, false);
    // replaceHTMLEntities('customUserTitle', 'users', 'usersId');
    // replaceHTMLEntities('originalTitle', 'videos', 'videosId');
    // replaceHTMLEntities('title', 'videos', 'videosId');
    //runQuery('UPDATE users SET privacyStatus = ? WHERE usersId = ?', ['deleted', 376]);

    //showModal('userModal');
    // bsAlert('test', alertType.warning, false);
    // bsAlert('test2', alertType.warning, false);
    // showDbChanges();

    const uniqueValue = Date.now();
    console.log(uniqueValue);
    bsAlert(uniqueValue);
}