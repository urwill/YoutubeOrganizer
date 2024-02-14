const prefersDarkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');    // Wichtig, damit man immer die selbe Instanz hat. Sonst kann man den EventListener nicht entfernen

function changeTheme(theme) {
    if (theme === 'system') {
        if (prefersDarkModeMediaQuery.matches) {
            theme = 'dark';
        } else {
            theme = 'light';
        }
        prefersDarkModeMediaQuery.addEventListener('change', systemThemeChanged);
    } else {
        prefersDarkModeMediaQuery.removeEventListener('change', systemThemeChanged);
    }

    const htmlElement = document.documentElement;
    htmlElement.dataset.bsTheme = theme;
}

function systemThemeChanged() {
    changeTheme('system');
}

function loadTheme() {
    const theme = getTheme();
    changeTheme(theme);
}