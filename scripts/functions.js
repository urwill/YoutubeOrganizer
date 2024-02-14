function openTab(url) {
	return window.open(url, '_blank');
}

function showModal(modalId) {
	return new Promise((resolve) => {
		const modalElement = document.getElementById(modalId);

		modalElement.addEventListener('shown.bs.modal', () => {
			resolve();
		})

		const modal = new bootstrap.Modal(modalElement);
		modal.show();
	});
}

function hideModal(modalId) {
	return new Promise((resolve) => {
		const modalElement = document.getElementById(modalId);

		modalElement.addEventListener('hidden.bs.modal', () => {
			resolve();
		})

		//const modal = new bootstrap.Modal(modalElement);	// funktioniert nicht. Vermutlich weil das Modal durch showModal schon existiert
		const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
		modal.hide();
	});
}

function reloadPage() {
	// Seite neu laden
	//location.reload();
	location.href = location;
}

function getParam(paramName) {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const paramValue = urlParams.get(paramName);

	return paramValue;
}

function getPageName() {
	const path = window.location.pathname;
	const file = path.split("/").pop();
	let page = file.split(".").shift();

	if (page === '') {    // Bei gehosteten Anwendungen ist der Name der index-Datei nicht in der URL
		page = 'index';
	}

	return page;
}

function getColumnIndex(columnName) {
	switch (getPageName()) {
		case 'userDetails':
			return displayedColumnsUserDetails.findIndex(([colName, _]) => colName === columnName);
		case 'users':
			return displayedColumnsUsers.findIndex(([colName, _]) => colName === columnName);
		case 'index':
		default:
			return displayedColumnsIndex.findIndex(([colName, _]) => colName === columnName);
	}
}

function createPlaylistLink(videoIds) {
	// Inspiriert von https://codepen.io/Xyrio/pen/dXarpv
	const link = 'https://www.youtube.com/watch_videos?video_ids=';

	const playlistArrays = splitArrayIntoChunks(videoIds, 50);
	for (const playlistArray of playlistArrays) {
		window.open(link + playlistArray.join(','), '_blank');
	}
}

function splitArrayIntoChunks(list, chunkSize) {
	const result = [];
	for (let i = 0; i < list.length; i += chunkSize) {
		result.push(list.slice(i, i + chunkSize));
	}
	return result;
}

function getChannelName() {
	return getDBValue(`CASE WHEN customUserTitle IS NOT NULL AND customUserTitle <> '' THEN customUserTitle ELSE userTitle END AS userName`, 'users', 'usersId = ?', [getParam('usersId')]);
}

function getChannelId() {
	return getDBValue('channelId', 'users', 'usersId = ?', [getParam('usersId')]);
}

function getChannelLink() {
	if (getIsPlaylist()) {
		return 'https://www.youtube.com/playlist?list=' + getChannelId();
	} else {
		return 'https://www.youtube.com/channel/' + getChannelId() + '/videos?view=0';
	}
}

function getIsPlaylist() {
	return getDBValue('isPlaylist', 'users', 'usersId = ?', [getParam('usersId')]);
}

function uploadFile(callbackFunction, acceptedExtension = '*') {
	// Erstellen Sie ein unsichtbares <input type="file"> Element
	const fileInput = document.createElement('input');
	fileInput.type = 'file';
	fileInput.style.display = 'none';
	fileInput.accept = acceptedExtension;

	// Fügen Sie das Element zum Dokument hinzu
	document.body.appendChild(fileInput);

	// Fügen Sie einen Event-Listener für die Änderung des Datei-Eingabe-Elements hinzu
	fileInput.addEventListener('change', function (event) {
		const selectedFile = event.target.files[0];

		if (selectedFile) {
			callbackFunction(selectedFile);
		} else {
			console.error('Es wurde keine Datei ausgewählt.');
		}

		// Entfernen Sie das Datei-Eingabe-Element nach der Auswahl der Datei
		document.body.removeChild(fileInput);
	});

	// Klicken Sie auf das unsichtbare Datei-Eingabe-Element, um den Datei-Auswahldialog zu öffnen
	fileInput.click();
}

function downloadFile(blob, fileName) {
	// Erstelle einen Download-Link für die Blob-Daten
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = fileName;

	// Füge den Link zum Dokument hinzu und klicke ihn an, um den Download zu starten
	document.body.appendChild(link);
	link.click();

	// Entferne den Link aus dem Dokument
	document.body.removeChild(link);
}

async function showLoadingOverlay() {
	await showModal('loadingOverlay');
}

async function hideLoadingOverlay() {
	await hideModal('loadingOverlay');
}

function updateVideoCount(usersId) {
	runQuery(`UPDATE users SET seenVideoCount = (SELECT COUNT(*) FROM videos WHERE seen = 1 AND usersId = $usersId), userVideoCount = (SELECT COUNT(*) FROM videos WHERE usersId = $usersId) WHERE usersId = $usersId;`, { '$usersId': usersId }, false);
}

function refreshScreen() {
	// Doppeltes requestAnimationFrame abwarten, damit sich der Bildschirm aktualisiert hat
	return new Promise((resolve) => {
		requestAnimationFrame(function () {
			requestAnimationFrame(function () {
				resolve();
			});
		});
	});
}

function reloadPages() {
	broadcastChannel.postMessage({ type: 'reload' });
}

function removeClassFromElements(elements, classToRemove) {
	// for (const element of elements) {
	// 	element.classList.remove(classToRemove);
	// }
	// Die vorherige Funktion würde das Elemnt, dessen Klasse entfernt wurde, direkt aus elements entfernen, falls die Element anhand der Klasse ausgewählt wurden, und somit jedes zweite Element überspringen
	for (let i = elements.length - 1; i >= 0; i--) {
		const element = elements[i];
		element.classList.remove(classToRemove);
	}
}

function addClassToElements(elements, classToAdd) {
	// for (const element of elements) {
	// 	element.classList.add(classToAdd);
	// }
	// Die vorherige Funktion würde das Elemnt, dessen Klasse entfernt wurde, direkt aus elements entfernen, falls die Element anhand des Fehlens der Klasse ausgewählt wurden, und somit jedes zweite Element überspringen
	for (let i = elements.length - 1; i >= 0; i--) {
		const element = elements[i];
		element.classList.add(classToAdd);
	}
}

function capitalizeFirstLetter(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}