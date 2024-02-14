const languageCodes = [
	{ code: 'af', name: 'Afrikaans' },
	{ code: 'sq', name: 'Albanisch' },
	{ code: 'am', name: 'Amharisch' },
	{ code: 'ar', name: 'Arabisch' },
	{ code: 'hy', name: 'Armenisch' },
	{ code: 'az', name: 'Aserbaidschanisch' },
	{ code: 'eu', name: 'Baskisch' },
	{ code: 'bn', name: 'Bengalisch' },
	{ code: 'bs', name: 'Bosnisch' },
	{ code: 'bg', name: 'Bulgarisch' },
	{ code: 'my', name: 'Burmesisch' },
	{ code: 'ceb', name: 'Cebuano' },
	{ code: 'ny', name: 'Chichewa' },
	{ code: 'zh', name: 'Chinesisch (Vereinfacht)' },
	{ code: 'de', name: 'Deutsch' },
	{ code: 'da', name: 'Dänisch' },
	{ code: 'en', name: 'Englisch' },
	{ code: 'eo', name: 'Esperanto' },
	{ code: 'et', name: 'Estnisch' },
	{ code: 'tl', name: 'Filipino' },
	{ code: 'fi', name: 'Finnisch' },
	{ code: 'fr', name: 'Französisch' },
	{ code: 'fy', name: 'Friesisch' },
	{ code: 'gl', name: 'Galicisch' },
	{ code: 'ka', name: 'Georgisch' },
	{ code: 'el', name: 'Griechisch' },
	{ code: 'gu', name: 'Gujarati' },
	{ code: 'ht', name: 'Haitianisch' },
	{ code: 'ha', name: 'Haussa' },
	{ code: 'haw', name: 'Hawaiianisch' },
	{ code: 'iw', name: 'Hebräisch' },
	{ code: 'hi', name: 'Hindi' },
	{ code: 'hmn', name: 'Hmong' },
	{ code: 'ig', name: 'Igbo' },
	{ code: 'id', name: 'Indonesisch' },
	{ code: 'ga', name: 'Irisch' },
	{ code: 'is', name: 'Isländisch' },
	{ code: 'it', name: 'Italienisch' },
	{ code: 'ja', name: 'Japanisch' },
	{ code: 'jw', name: 'Javanisch' },
	{ code: 'yi', name: 'Jiddisch' },
	{ code: 'kn', name: 'Kannada' },
	{ code: 'kk', name: 'Kasachisch' },
	{ code: 'ca', name: 'Katalanisch' },
	{ code: 'km', name: 'Khmer' },
	{ code: 'ky', name: 'Kirgisisch' },
	{ code: 'ko', name: 'Koreanisch' },
	{ code: 'co', name: 'Korsisch' },
	{ code: 'hr', name: 'Kroatisch' },
	{ code: 'ku', name: 'Kurdisch (Kurmanji)' },
	{ code: 'lo', name: 'Laotisch' },
	{ code: 'la', name: 'Lateinisch' },
	{ code: 'lv', name: 'Lettisch' },
	{ code: 'lt', name: 'Litauisch' },
	{ code: 'lb', name: 'Luxemburgisch' },
	{ code: 'mg', name: 'Madagassisch' },
	{ code: 'ms', name: 'Malaiisch' },
	{ code: 'ml', name: 'Malayalam' },
	{ code: 'mt', name: 'Maltesisch' },
	{ code: 'mi', name: 'Maori' },
	{ code: 'mr', name: 'Marathi' },
	{ code: 'mk', name: 'Mazedonisch' },
	{ code: 'mn', name: 'Mongolisch' },
	{ code: 'ne', name: 'Nepali' },
	{ code: 'nl', name: 'Niederländisch' },
	{ code: 'no', name: 'Norwegisch' },
	{ code: 'ps', name: 'Paschtu' },
	{ code: 'fa', name: 'Persisch' },
	{ code: 'pl', name: 'Polnisch' },
	{ code: 'pt', name: 'Portugiesisch' },
	{ code: 'pa', name: 'Punjabi' },
	{ code: 'ro', name: 'Rumänisch' },
	{ code: 'ru', name: 'Russisch' },
	{ code: 'sm', name: 'Samoanisch' },
	{ code: 'gd', name: 'Schottisches Gälisch' },
	{ code: 'sv', name: 'Schwedisch' },
	{ code: 'sr', name: 'Serbisch' },
	{ code: 'st', name: 'Sesotho' },
	{ code: 'sn', name: 'Shona' },
	{ code: 'sd', name: 'Sindhi' },
	{ code: 'si', name: 'Singhalesisch' },
	{ code: 'sk', name: 'Slowakisch' },
	{ code: 'sl', name: 'Slowenisch' },
	{ code: 'so', name: 'Somali' },
	{ code: 'es', name: 'Spanisch' },
	{ code: 'sw', name: 'Suaheli' },
	{ code: 'su', name: 'Sundanesisch' },
	{ code: 'tg', name: 'Tadschikisch' },
	{ code: 'ta', name: 'Tamilisch' },
	{ code: 'te', name: 'Telugu' },
	{ code: 'th', name: 'Thailändisch' },
	{ code: 'cs', name: 'Tschechisch' },
	{ code: 'tr', name: 'Türkisch' },
	{ code: 'ug', name: 'Uigurisch' },
	{ code: 'uk', name: 'Ukrainisch' },
	{ code: 'hu', name: 'Ungarisch' },
	{ code: 'ur', name: 'Urdu' },
	{ code: 'uz', name: 'Usbekisch' },
	{ code: 'vi', name: 'Vietnamesisch' },
	{ code: 'cy', name: 'Walisisch' },
	{ code: 'be', name: 'Weißrussisch' },
	{ code: 'xh', name: 'Xhosa' },
	{ code: 'yo', name: 'Yoruba' },
	{ code: 'zu', name: 'Zulu' }
];

console.log(languageCodes);


function getLanguageNameByCode(languageCode) {
	const language = languageCodes.find(lang => lang.code === languageCode.toLowerCase());
	return language ? language.name : '';
}

function setFilterLanguageOptions(resetOptions = false, updateTabs = false) {
	const languages = getDBArray(`SELECT DISTINCT language FROM users ORDER BY language`);
	const filterLanguage = document.getElementById('filterLanguage');
	if(resetOptions) {
		filterLanguage.innerHTML = '<option value="%">Alle</option>';   // Options zurücksetzen
	}

	for (const language of languages) {
		const option = document.createElement("option");
		option.value = language.language;
		option.text = getLanguageNameByCode(language.language);
		filterLanguage.add(option);
	}

	if (updateTabs) {
        broadcastChannel.postMessage({ type: 'setFilterLanguageOptions' });
    }
}