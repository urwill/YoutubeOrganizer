// Funktion zur Formatierung des Datums
function formatDate(inputDate) {
    const date = new Date(inputDate);
    
    const day = date.getDate();
    const month = date.getMonth() + 1; // Monate werden von 0 bis 11 gezählt
    const year = date.getFullYear();

    // Füge führende Nullen hinzu, wenn nötig
    const formattedDay = day < 10 ? `0${day}` : day;
    const formattedMonth = month < 10 ? `0${month}` : month;
    const formattedYear = year;

    // Erstelle das gewünschte Format: TT.MM.JJJJ
    return `${formattedDay}.${formattedMonth}.${formattedYear}`;
}

// Funktion zur Formatierung der Dauer in Sekunden
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const formattedHours = hours > 0 ? (hours < 10 ? `0${hours}` : hours) + ':' : '';
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

    // Erstelle das gewünschte Format: hh:mm:ss
    return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
}

// Funktion zur Konvertierung der ISO-8601-Dauer in Sekunden
function convertDurationToSeconds(duration) {
    const match = duration.match(/^P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)D)?(?:T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+(?:\.[0-9]+)?)S)?)?$/);
    
    if (!match) {
        throw new Error('Ungültiges ISO 8601-Dauerformat');
    }

    const years = parseInt(match[1]) || 0;
    const months = parseInt(match[2]) || 0;
    const days = parseInt(match[3]) || 0;
    const hours = parseInt(match[4]) || 0;
    const minutes = parseInt(match[5]) || 0;
    const seconds = parseFloat(match[6]) || 0;

    const totalSeconds = years * 31536000 + months * 2592000 + days * 86400 + hours * 3600 + minutes * 60 + seconds;

    return totalSeconds;
}

function getDateTimeString() {
	// Aktuellen Zeitpunkt abrufen
	const jetzt = new Date();

	// Jahr, Monat und Tag extrahieren
	const jahr = jetzt.getFullYear();
	const monat = (jetzt.getMonth() + 1).toString().padStart(2, '0'); // Monat ist 0-basiert, daher +1
	const tag = jetzt.getDate().toString().padStart(2, '0');

	// Stunde, Minute und Sekunde extrahieren
	const stunde = jetzt.getHours().toString().padStart(2, '0');
	const minute = jetzt.getMinutes().toString().padStart(2, '0');
	const sekunde = jetzt.getSeconds().toString().padStart(2, '0');

	// String im gewünschten Format erstellen
	const dateTimeString = jahr + '_' + monat + '_' + tag + ' ' + stunde + '_' + minute + '_' + sekunde;

	// Ausgabe des Strings
	console.log(dateTimeString);
	return dateTimeString;
}

const privacyStatusValues = [
    { value: 'public', text: 'Öffentlich'},
    { value: 'unlisted', text: 'Ungelistet'},
    { value: 'private', text: 'Privat'},    // Kann eigentlich niemals auftauchen
    { value: 'deleted', text: 'Privat oder gelöscht'}   // Kann über die API nicht festgestellt werden    
]

function getPrivacyStatusText(value) {
    const privacyStatus = privacyStatusValues.find(priv => priv.value === value.toLowerCase());
    return privacyStatus ? privacyStatus.text : value;
  }