let archiveQueue = [];
let isArchiving = false;

async function saveToWaybackMachine(videoId) {
    archiveQueue.push('https://www.youtube.com/watch?v=' + videoId);
    archiveLinksSequentially();
}

async function archiveLinksSequentially() {
    if (isArchiving) return;
    if (archiveQueue.length === 0) {
        console.log('Archivierungsliste abgearbeitet.')
        return;
    }
    isArchiving = true;

    console.log('Archivierungsliste:', archiveQueue);
    const currentUrl = archiveQueue.shift();
    console.log("Archivierung gestartet.", currentUrl);

    // Zuerst prüfen, ob schon archiviert
    fetch("https://archive.org/wayback/available?url=" + encodeURIComponent(currentUrl))
        .then(r => r.json())
        .then(data => {
            console.log(data);
            const exists = data.archived_snapshots && data.archived_snapshots.closest && data.archived_snapshots.closest.available;
            if (exists) {
                console.log("Bereits archiviert:", data.archived_snapshots.closest.url);
                isArchiving = false;
                archiveLinksSequentially();
            } else {
                console.log("Noch nicht archiviert, also jetzt iFrame anlegen.", currentUrl);
                let iframe = document.createElement("iframe");
                iframe.style.display = "none";
                //iframe.style.width = "1500px";
                //iframe.style.height = "800px";
                iframe.src = "https://web.archive.org/save/" + encodeURIComponent(currentUrl);
                iframe.onload = function () {
                    document.body.removeChild(iframe);
                    console.log("Archivierung fertig.", currentUrl);
                    isArchiving = false;
                    archiveLinksSequentially();
                };
                document.body.appendChild(iframe);
            }
        })
        .catch(err => {
            console.error("Fehler bei der Wayback-Abfrage:", err);
            isArchiving = false;
            archiveLinksSequentially(); // Fehler überspringen und weitermachen
        });
}