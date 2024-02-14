
const defaultProps = {
	toastId: undefined,	// Id, um den Toast zu identifizieren
	header: "",	//	Text oder HTML des Headers. Wird nichts angegeben, wird kein Header erzeugt
	headerSmall: "",	//	Zusätzlichen kleinen Text oben rechts im Header (hat keine Wirkung, wenn header nicht angegeben wurde)
	body: "",	// Text oder HTML des Bodys
	buttons: [{	// Array of Objects mit Buttons, die im toastBody erstellt werden sollen
		text: '',
		clickFunction: undefined,
		clickFunctionParams: [],
		type: 'primary'
	}],
	closeButton: true,	// Schließen-Button oben rechts anzeigen (hat keine Wirkung, wenn header nicht angegeben wurde)
	closeButtonAriaLabel: "Schließen",	// aria-label für den Schließen-Button
	toastClass: "",	//	Zusätzliche Klassen für das Toast
	animation: true,	// Einblenden des Toasts animieren
	delay: Infinity,	// Verzögerung zum automatischen Ausblenden des Toasts in Millisekunden oder Infinity, damit er nicht automatisch ausgeblendet wird
	position: "top-afterNavbar end-offcanvas",	// Postion des toastPlaceholder. Standardmäßig rechts oben unter der Navbar
	direction: "append",	// neue Toasts unten (append) oder oben (prepend) einfügen
	zIndex: undefined,	// z-index des toastPlaceholder
	ariaLive: "assertive",
	existsFunction: undefined	// Funktion, die ausgeführt werden soll, wenn ein Toast mit diese Id schon existiert. Wenn nichts angegeben wird, wird das alte Toast entfernt und ein neues erstellt
}

function showToast(props) {
	if (props.toastId) {
		const prevToast = document.getElementById(props.toastId);
		if (prevToast) {
			if (prevToast.classList.contains('show')) {
				if (props.existsFunction) {
					props.existsFunction();
				} else {
					prevToast.addEventListener('hidden.bs.toast', () => {
						prevToast.remove();	// Altes Toast entfernen
						showToast(props);	// Neuen Aufruf starten, wenn das alte Toast ausgeblendet wurde
					});
					const bsPrevToast = new bootstrap.Toast(prevToast);
					bsPrevToast.hide();
				}

				return;
			} else {	// Falls das Toast schon ausgeblendet wurde
				prevToast.remove();	// Altes Toast entfernen
			}
		}
	}

	const toastClasses = ['toast'];
	if (props.toastClass ?? defaultProps.toastClass) {
		toastClasses.push(props.toastClass ?? defaultProps.toastClass);
	}

	let toastPlaceholder = document.getElementById('toastPlaceholder');
	if (!toastPlaceholder) {
		toastPlaceholder = $('<div />', {
			'class': `toast-container position-fixed p-3 ${props.position ?? defaultProps.position}`, //'class' in Anführungszeichen setzen, da es ein reserviertes Wort ist
			'id': 'toastPlaceholder',
			'style': (defaultProps.zIndex ?? props.zIndex) ? 'z-index: ' + (defaultProps.zIndex ?? props.zIndex) : ''
		}).appendTo(document.body);
	}

	const toast = $('<div />', {
		'class': toastClasses.join(' '),  //'class' in Anführungszeichen setzen, da es ein reserviertes Wort ist
		role: 'alert',
		'aria-live': props.ariaLive ?? defaultProps.ariaLive,
		'aria-atomic': 'true',
		'id': props.toastId
	});

	if (props.header) {
		props.header = `<strong class="me-auto">${props.header}</strong>`;
		if (props.headerSmall) {
			props.header += `<small class="text-body-secondary">${props.headerSmall}</small>`;
		}
		if (props.closeButton ?? defaultProps.closeButton) {
			props.header += `<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="${props.closeButtonLabel ?? defaultProps.closeButtonLabel}"></button>`;
		}

		const toastHeader = $('<div />', {
			'class': 'toast-header'
		}).append(props.header);

		toast.append(toastHeader);
	}

	const toastBody = $('<div />', {
		'class': 'toast-body'
	}).append(props.body);
	toast.append(toastBody);

	if (props.buttons && props.buttons.length > 0) {
		const toastButtons = $('<div />', {
			'class': 'mt-2 pt-2'
		});
		for (const button of props.buttons) {
			const toastButton = $('<button />', {
				'type': 'button',
				'class': `btn btn-${button.type ?? defaultProps.buttons[0].type} btn-sm`,
				'text': button.text ?? ''
			});
			toastButtons.append(toastButton);
			if (button.clickFunction) {
				toastButton.on("click", function () {
					let params = button.clickFunctionParams ?? defaultProps.buttons[0].clickFunctionParams;
					if (!Array.isArray(params)) {
						params = [params];
					}
					button.clickFunction(...params);
				});
			}
		}
		toastBody.append(toastButtons);
	}

	if ((props.direction ?? defaultProps.direction) === 'prepend') {
		$(toastPlaceholder).prepend(toast);
	} else {
		$(toastPlaceholder).append(toast);
	}

	const bsToast = new bootstrap.Toast(toast, {
		animation: props.animation ?? defaultProps.animation,
		autohide: (props.delay ?? defaultProps.delay) !== Infinity,
		delay: props.delay ?? defaultProps.delay

	});
	bsToast.show();
}

// Für den Abstand des Toasts
function setNavbarVariables() {
    // Höhe der Navbar auslesen
    const navbar = document.querySelector('.navbar');
    const navbarHeight = navbar ? navbar.offsetHeight : 0;

    // Setze die CSS-Variable mit der Navbar-Höhe
    document.documentElement.style.setProperty('--navbar-height', `${navbarHeight}px`);

    const myOffcanvas = document.getElementById('offcanvasNavbar');
    const myOffcanvasTransition = getComputedStyle(myOffcanvas).getPropertyValue('--bs-offcanvas-transition');
    const myOffcanvasWidth = myOffcanvas.offsetWidth;
    document.documentElement.style.setProperty('--offcanvas-transition', myOffcanvasTransition);    // Eigene Variable mit den Werten aus dem Offcanvas erstellen, da ich keinen Zugriff auf den Bereich habe

    myOffcanvas.addEventListener('show.bs.offcanvas', () => {
        // Setze die CSS-Variable mit der Offcanvas-Breite
        document.documentElement.style.setProperty('--offcanvas-width', `-${myOffcanvasWidth}px`);
    });
    myOffcanvas.addEventListener('hide.bs.offcanvas', () => {
        // Zurücksetzen
        document.documentElement.style.setProperty('--offcanvas-width', '0');
    });
}