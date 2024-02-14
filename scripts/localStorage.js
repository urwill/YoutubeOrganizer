window.addEventListener("storage", storageItemChanged);

// Funktioniert für localStorage oder sessionStorage
function storageAvailable(type) {
    let storage;
    try {
        storage = window[type];
        const x = "__storage_test__";
        storage.setItem(x, JSON.stringify(x));
        storage.removeItem(x);
        return true;
    } catch (e) {
        return (
            e instanceof DOMException &&
            // everything except Firefox
            (e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === "QuotaExceededError" ||
                // Firefox
                e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage &&
            storage.length !== 0
        );
    }
}

function getLocalStorageItem(key) {
	try {
		const value = localStorage.getItem(key);
		const parsedValue = JSON.parse(value);
		if (parsedValue === 'null') {
			return null;
		} else {
			return parsedValue;
		}
	} catch (error) {
		console.error(`Error reading localStorage item "${key}": ${error}`);
		return null;
	}
}

// Funktion zum Schreiben von Werten in den localStorage
function setLocalStorageItem(key, value) {
	try {
		const serializedValue = JSON.stringify(value);
		localStorage.setItem(key, serializedValue);
	} catch (error) {
		console.error(`Error setting localStorage item "${key}": ${error}`);
	}
}

function storageItemChanged(event) {
    // console.log('key', event.key);
    // console.log('oldValue', event.oldValue);
    // console.log('newValue', event.newValue);
    // console.log('url', event.url);
    // console.log('storageArea', JSON.stringify(event.storageArea));

    settingsChanged(event.key, event.newValue);
}