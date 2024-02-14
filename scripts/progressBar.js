let processedItems = 0;

async function startProcessing() {
    processedItems = 0; // Zurücksetzen der Zählvariable
    setProgressValues(0);
    await showModal('progressModal');
}

function setProgressValues(value) {
    const progress = document.getElementById('progress');
    const progressBar = document.getElementById('progressBar');
    const progressModalLabel = document.getElementById('progressModalLabel');

    progress.setAttribute('aria-valuenow', value);
    progressBar.style.width = `${value}%`;
    progressModalLabel.textContent = `${value}%`;
}

async function updateProgress(currentIndex, totalCount, autoend = true) {
    return new Promise(async (resolve) => {
        const updateInterval = totalCount / 100; // Anzahl der Einträge pro Prozent
        processedItems++;

        if (processedItems >= updateInterval || currentIndex + 1 === totalCount) {
            processedItems = 0; // Zurücksetzen der Zählvariable
            const progressReal = (currentIndex + 1) / totalCount * 100;
            const progress = progressReal.toFixed(0);

            // Fortschrittsbalken aktualisieren
            setProgressValues(progress);

            if (autoend && currentIndex + 1 === totalCount) {
                await endProcessing();
            }

            if(document.hidden) {   // Sonst würde alles pausiert werden, wenn man den Tab wechselt
                resolve();
            } else {
                requestAnimationFrame(() => {
                    // Hier wird der Code ausgeführt, wenn das UI aktualisiert wurde
                    resolve();
                });
            }

            console.log(progressReal);
        } else {
            resolve();
        }
    });
}

async function endProcessing() {
    await hideModal('progressModal');
}