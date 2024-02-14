const THEME_KEY = 'color_theme';
const BACKUP_TIME = 'backup_time';
const BACKUP_REMINDER_CHECK_KEY = 'backup_reminder_check';
const BACKUP_REMINDER_DAYS_KEY = 'backup_reminder_days';
const QUOTA_KEY = 'youtube_quota';
const QUOTA_EXPIRE_KEY = 'youtube_quota_expire';
const TOTAL_QUOTA_KEY = 'total_youtube_quota';
const API_KEY = 'youtube_api_key';

// Änderungen aus anderen Tabs
function settingsChanged(name, value) {
    value = JSON.parse(value);

    switch (name) {
        case THEME_KEY:
            refreshTheme(value);
            break;
        case BACKUP_TIME:
            hideBackupToast();
            break;
        case BACKUP_REMINDER_CHECK_KEY:
            refreshBackupReminderCheck(value);
            break;
        case BACKUP_REMINDER_DAYS_KEY:
            refreshBackupReminderDays(value);
            break;
        case QUOTA_KEY:
            refreshQuota(value);
            break;
        case TOTAL_QUOTA_KEY:
            refreshTotalQuota(value);
            break;
        case API_KEY:
            refreshApiKey(value);
            break;
    }
}

// Theme (dark/light/system)
function getTheme() {
    const value = getLocalStorageItem(THEME_KEY) || 'system';   // Systemeinstellung verwenden, falls kein Wert festgelegt wurde
    return value;
}

function setTheme(value) {
    setLocalStorageItem(THEME_KEY, value);
    changeTheme(value);
}

function refreshTheme(value) {
    document.getElementById('selectTheme').value = value;
    changeTheme(value);
}


// Zeitpunkt von letztem Backup
function getBackupTime() {
    let value = getLocalStorageItem(BACKUP_TIME);
    if (value) {
        value = new Date(value);
    } else {
        setBackupTime();    // Wenn noch kein Backupzeitpunkt gespeichert ist, aktuellen Zeitpunkt eintragen
        value = new Date();
    }
    return value;
}

function setBackupTime() {
    const d = new Date();   // aktueller Zeitpunkt
    setLocalStorageItem(BACKUP_TIME, d);
    hideBackupToast();
}

let backupReminderTimeout;

function setBackupReminderTrigger() {
    clearTimeout(backupReminderTimeout);    // Timeout abbrechen, falls vorhanden

    const backupReminderCheck = (getBackupReminderCheck() === 'checked');
    if (backupReminderCheck) {
        const backupTime = getBackupTime();
        const backupReminderDays = getBackupReminderDays();
        backupTime.setDate(backupTime.getDate() + backupReminderDays);  // Zeitpunkt für das nächste Backup berechnen

        const d = new Date();
        if (backupTime < d) {
            showBackupToast(backupReminderDays);
        } else {
            const remainingTime = backupTime - d;
            console.log('Nächstes Backup in', remainingTime);

            backupReminderTimeout = setTimeout(function () {
                showBackupToast(backupReminderDays);
            }, remainingTime);
        }
    }
}

function showBackupToast(backupReminderDays) {
    showToast({
        toastId: 'backupToast',
        header: '<span class="fa-stack toastInfo" style="margin-right: 5px;"><i class="fas fa-circle fa-stack-2x" style="color: #006699;"></i><i class="fas fa-info fa-stack-1x fa-inverse"></i></span>Backup empfohlen',
        body: `Es wurde seit mindestens ${backupReminderDays} ${backupReminderDays === 1 ? 'Tag' : 'Tagen'} kein Backup erstellt.`,
        buttons: [{
            text: 'Backup erstellen',
            clickFunction: exportDB,
            type: 'primary'
        }],
        closeButton: false
    });
}

function hideBackupToast() {
    const myToast = document.getElementById('backupToast');
    if (myToast) {
        const myBsToast = new bootstrap.Toast(myToast);
        myToast.addEventListener('hidden.bs.toast', () => {
            myToast.remove();
        });
        myBsToast.hide();
    }

    setBackupReminderTrigger(); //Timeout erneuern
}

// An Backup erinnern
function getBackupReminderCheck() {
    const value = getLocalStorageItem(BACKUP_REMINDER_CHECK_KEY) ?? 'checked';  // Standardmäßig als checked markieren, wenn kein Wert festgelegt wurde
    return value;
}

function setBackupReminderCheck(value) {
    value = value ? 'checked' : '';
    setLocalStorageItem(BACKUP_REMINDER_CHECK_KEY, value);
    setBackupReminderTrigger(); //Timeout hinzufügen oder abbrechen
}

function refreshBackupReminderCheck(value) {
    document.getElementById('checkboxBackupReminderCheck').checked = (value === 'checked');
    setBackupReminderTrigger(); //Timeout hinzufügen oder abbrechen
}


// Tage bis zur Backup Erinnerung
function getBackupReminderDays() {
    const value = parseInt(getLocalStorageItem(BACKUP_REMINDER_DAYS_KEY)) || 7; // Falls keine Zahl oder 0 ausgelesen wurde, erhält man standardmäßig 7
    return value;
}

function setBackupReminderDays(value) {
    value = parseInt(value) || 7;   // Falls keine Zahl oder 0 eingetragen wurde, erhält man standardmäßig 7
    setLocalStorageItem(BACKUP_REMINDER_DAYS_KEY, value);
    refreshBackupReminderDays(value);   // Falls es eine ungültige Eingabe gab
}

function refreshBackupReminderDays(value) {
    document.getElementById('textInputBackupReminderDays').value = value;
    setBackupReminderTrigger(); //Timeout anpassen
}


// Ablaufzeitpunkt für verbrauchtes Kontingent
function getQuotaExpire() {
    const value = Date.parse(getLocalStorageItem(QUOTA_EXPIRE_KEY)) || new Date(0); // Bereits vergangenes Datum zurückgeben, wenn noch kein Wert festgelegt wurde
    return value;
}

function setQuotaExpire() {
    const d = new Date();   // aktueller Zeitpunkt

    // Falls es nach 8 Uhr UTC / 0 Uhr PST ist, addiere einen Tag
    if (d.getUTCHours() >= 8) {
        d.setDate(d.getDate() + 1);
    }
    // Setze die Uhrzeit auf 8 Uhr UTC / 0 Uhr PST
    d.setUTCHours(8, 0, 0, 0);

    setLocalStorageItem(QUOTA_EXPIRE_KEY, d);
}

function setQuotaExpireTrigger() {
    const d = new Date();   // aktueller Zeitpunkt
    let e = getQuotaExpire();  // Ablaufdatum
    if (d > e) {
        setQuota(0);    // Kontingent zurücksetzen
        setQuotaExpire();  // Neues Ablaufdatum setzen
        e = getQuotaExpire();   // Ablaufzeitpunkt erneut auslesen, nachdem er aktualisiert wurde
    }

    const remainingTime = e - d;
    console.log('Kontingent wird zurückgesetzt in', remainingTime);

    setTimeout(function () {
        setQuota(0);    // Kontingent zurücksetzen
        setQuotaExpire();   // Neues Ablaufdatum setzen
        setQuotaExpireTrigger();    // Neuen Trigger starten
    }, remainingTime);
}


// Verbrauchtes Kontingent für die YouTube API
function getQuota() {
    const d = new Date();   // aktueller Zeitpunkt
    let e = getQuotaExpire();  // Ablaufdatum
    if (d > e) {
        setQuota(0);    // Kontingent zurücksetzen
        setQuotaExpire();  // Neues Ablaufdatum setzen
    }

    const value = parseInt(getLocalStorageItem(QUOTA_KEY)) || 0;    // Falls keine Zahl ausgelesen wurde, erhält man standardmäßig 0
    return value;
}

function setQuota(value) {
    value = parseInt(value) || 0;   // Falls keine Zahl ausgelesen wurde, erhält man standardmäßig 0
    setLocalStorageItem(QUOTA_KEY, value);
    refreshQuota(value);   // Falls es eine ungültige Eingabe gab oder das Kontingent zurückgesetzt wurde
}

function increaseQuota(value) {
    const quota = getQuota();
    setQuota(quota + value);
}

function refreshQuota(value) {
    const textInputQuota = document.getElementById('textInputQuota');
    if (textInputQuota) {   // Wenn das Ablaufdatum beim Init überschritten ist, wird versucht in das Feld zu schreiben, obwohl es noch nicht existiert
        textInputQuota.value = value;
    }
}


// Gesamtkontingent für die YouTube API
function getTotalQuota() {
    const value = parseInt(getLocalStorageItem(TOTAL_QUOTA_KEY)) || 10000;  // Falls keine Zahl oder 0 ausgelesen wurde, erhält man standardmäßig 10000
    return value;
}

function setTotalQuota(value) {
    value = parseInt(value) || 10000;   // Falls keine Zahl oder 0 eingetragen wurde, erhält man standardmäßig 10000
    setLocalStorageItem(TOTAL_QUOTA_KEY, value);
    refreshTotalQuota(value);   // Falls es eine ungültige Eingabe gab
}

function refreshTotalQuota(value) {
    document.getElementById('textInputTotalQuota').value = value;
}


// YouTube Data API Key
function getApiKey() {
    const value = getLocalStorageItem(API_KEY) ?? '';
    return value;
}

function setApiKey(value) {
    setLocalStorageItem(API_KEY, value);
    refreshApiKey(value);   // Falls der API Key durch den Prompt in der YtAPI Klasse eingetragen wurde
}

function refreshApiKey(value) {
    document.getElementById('textInputApiKey').value = value;
}