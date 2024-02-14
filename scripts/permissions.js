function checkPermissions() {
    if (isPopupBlocked()) {
        showBlockedPermissionModal('Popups sind blockiert', 'Damit die Anwendung ordnungsgemäß funktioniert, müssen Popups erlaubt sein.<br><br>Erlauben Sie Popups in Ihrem Browser und klicken Sie dann auf "OK".');
    } else if (!storageAvailable("localStorage")) {
        showBlockedPermissionModal('localStorage nicht verfügbar', 'Damit die Anwendung ordnungsgemäß funktioniert, muss localStorage verfügbar sein.<br><br>Aktivieren Sie localStorage in Ihrem Browser und klicken Sie dann auf "OK" oder verwenden Sie einen anderen Browser.');
    } else if (!indexedDBAvailable()) {
        showBlockedPermissionModal('IndexedDB nicht verfügbar', 'Damit die Anwendung ordnungsgemäß funktioniert, muss IndexedDB verfügbar sein.<br><br>Aktivieren Sie IndexedDB in Ihrem Browser und klicken Sie dann auf "OK" oder verwenden Sie einen anderen Browser.');
    }
}

function showBlockedPermissionModal(headerText, bodyText, callbackFunctionString = 'reloadPage();') {
    const htmlFile = './html/blockedPermissionModal.html';
    const dynamicData = {
        headerText: headerText,
        bodyText: bodyText,
        callbackFunctionString: callbackFunctionString
    };

    fetchAndInsertHtml(htmlFile, dynamicData)
        .then(() => showModal('blockedPermissionModal'));
}

function isPopupBlocked() {
    const newTab = openTab('https://google.com');
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        return true; // Popup-Blocker aktiv
    } else {
        newTab.close(); // Popup-Blocker nicht aktiv, schließe das leere Popup
        return false;
    }
}

function indexedDBAvailable() {
    //return window.indexedDB;

    // try {
    //     const request = indexedDB.open('testDB', 1);
    //     return true;
    // } catch {
    //     return false;
    // }

    // if ('indexedDB' in window) {
    //     return true;
    // } else {
    //     return false;
    // }

    // Funktioniert alles nicht, aber sollte sowieso in so ziemlich allen Browsern verfügbar sein
    return true;
}