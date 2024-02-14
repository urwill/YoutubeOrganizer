const broadcastChannel = new BroadcastChannel('myDatabaseChannel');

broadcastChannel.onmessage = async (event) => {
    switch (event.data.type) {
        case 'reload':
            initSQL();
            break;
        case 'databaseChanges':
            runQuery(event.data.query, event.data.params, false, false);   // Datenbank muss nicht gespeichert werden. Das passiert alles schon im Tab, der die Nachricht geschickt hat
            showDbChanges();
            break;
        case 'showUserToast':
            showUserToast(event.data.channelId, event.data.title, event.data.isPlaylist);
            break;
        case 'hideUserToast':
            hideUserToast(event.data.channelId, false);
            break;
        case 'setFilterLanguageOptions':
            setFilterLanguageOptions(true, false);
            break;
    }
};

function changedDB(query, params) {
    broadcastChannel.postMessage({ type: 'databaseChanges', query: query, params: params });
}


function showDbChanges() {
    showToast({
        toastId: 'dbChangesToast',
        header: '<span class="fa-stack toastInfo" style="margin-right: 5px;"><i class="fas fa-circle fa-stack-2x change-indicator-icon" style="color: #006699;"></i><i class="fas fa-info fa-stack-1x fa-inverse"></i></span>Datenbank aktualisiert',
        body: "In einem anderen Tab wurden Änderungen an der Datenbank durchgeführt.",
        buttons: [{
            text: 'Tabelle aktualisieren',
            clickFunction: loadTable,
            type: 'primary'
        }],
        closeButton: false,
        existsFunction: triggerBlinkAnimation
    });
}

function hideDbChanges() {
    const myToast = document.getElementById('dbChangesToast');
    if (myToast) {
        const myBsToast = new bootstrap.Toast(myToast);
        myToast.addEventListener('hidden.bs.toast', () => {
            myToast.remove();
        });
        myBsToast.hide();
    }
}

function triggerBlinkAnimation() {
    const icon = document.querySelector('.change-indicator-icon');

    if (icon) {
        // Entferne vorhandene Blink-Klasse
        icon.classList.remove('blink');

        // Füge die Blink-Klasse hinzu (triggert die Animation)
        void icon.offsetWidth; // Force reflow, um die Animation bei jedem Aufruf auszulösen
        icon.classList.add('blink');
    }
}