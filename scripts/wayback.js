let archiveQueue = [];
let isArchiving = false;

async function saveToWaybackMachine(videoId) {
    archiveQueue.push('https://www.youtube.com/watch?v=' + videoId);
    archiveLinksSequentially();
}

async function archiveLinksSequentially() {
    if (isArchiving || archiveQueue.length === 0) return;
    isArchiving = true;

    const currentUrl = archiveQueue.shift();
    console.log("Archivierung gestartet.", currentUrl);
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