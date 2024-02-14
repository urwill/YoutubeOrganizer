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

}