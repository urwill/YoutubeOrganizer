const alertType = {
	primary: 'primary',
	secondary: 'secondary',
	success: 'success',
	danger: 'danger',
	warning: 'warning',
	info: 'info',
	light: 'light',
	dark: 'dark'
}

function bsAlert(message, type = 'primary', autoDismiss = true, dismissDelay = 5000) {
	const alertClasses = ["alert", "fade", "show", "mt-2", "mx-2"];
	alertClasses.push("alert-" + type.toLowerCase());
	alertClasses.push("alert-dismissible");

	let alertPlaceholder = document.getElementById('alertPlaceholder');
	if (!alertPlaceholder) {
		alertPlaceholder = $("<div />", {
			"class": "fixed-top", //"class" in Anführungszeichen setzen, da es ein reserviertes Wort ist
			"id": "alertPlaceholder"
		}).appendTo(document.body)[0];	// [0], um das JQuery Objekt in ein DOM Objekt umzuwandeln. Sonst funktioniert alertPlaceholder.querySelector nicht
	}

	if (!autoDismiss) { //Bei Fehlermeldungen, die nicht von alleine verschwinden, prüfen, ob bereits ein vorheriger Alert mit der gleichen Nachricht vorhanden ist und diese dann verschwinden lassen    
		const prevAlert = alertPlaceholder.querySelector('div.' + alertClasses.join('.') + '[data-message="' + CSS.escape(message) + '"]');
		if (prevAlert) {
			// Das gewünschte Element wurde gefunden
			const bsPrevAlert = new bootstrap.Alert(prevAlert);
			bsPrevAlert.close();
		}
	}

	const alert = $("<div />", {
		"class": alertClasses.join(" "),  //"class" in Anführungszeichen setzen, da es ein reserviertes Wort ist
		"data-message": message,
		role: 'alert'
	}).append(message);

	const alertClose = $("<button />", {
		"class": "btn-close", //"class" in Anführungszeichen setzen, da es ein reserviertes Wort ist
		"data-bs-dismiss": "alert"
	}).appendTo(alert);

	$(alertPlaceholder).append(alert);

	if (autoDismiss) {
		setTimeout(function () {
			const bsAlertElem = new bootstrap.Alert(alert);
			bsAlertElem.close();
		}, dismissDelay);
	}
}