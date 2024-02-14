// DataTable-Variable für die spätere Verwendung deklarieren
var dataTable;

async function initDataTable(dataTableArray, sortColumn) {
    await showLoadingOverlay();
    // Überprüfe, ob DataTable bereits initialisiert wurde
    if ($.fn.DataTable.isDataTable('#dataTable')) {
        const currentPage = dataTable.page();
        dataTable.clear().rows.add(dataTableArray).draw();
        dataTable.page(currentPage).draw('page');
    } else {    // Initialisiere die DataTable
        const pageName = getPageName();
        let columnDefs = [];

        if (pageName === 'index' || pageName === 'userDetails') {
            columnDefs.push({
                "targets": 'title',
                "render": function (data, type, row) {
                    const videoId = row[getColumnIndex('videoId')];
                    const youtubeLink = 'https://www.youtube.com/watch?v=' + videoId;
                    if (type === 'display') {
                        const videosId = row[getColumnIndex('videosId')];
                        const usersId = row[getColumnIndex('usersId')];
                        return '<a href="' + youtubeLink + '" target="_blank" style="text-decoration:none;" onclick="return clickVideo(' + videosId + ', ' + usersId + ');">' + data + '</a>';
                    }
                    return data;
                },
                "type": "string"
            });
            columnDefs.push({
                "targets": 'publishedAt', // Index oder Name der Spalte, für die die Konfiguration gelten soll
                "render": function (data, type, row) {
                    if (type === 'sort') {
                        return data; // Originaldaten für Sortierung
                    }
                    // Hier wird der Wert für die Sortierung Anzeige für die Tabelle und Filterung konfiguriert
                    return formatDate(data);
                },
                "type": "date"
            });
            columnDefs.push({
                "targets": 'duration', // Index oder Name der Spalte, für die die Konfiguration gelten soll
                "render": function (data, type, row) {
                    if (type === 'display') {
                        // Hier wird die Anzeige für die Tabelle konfiguriert
                        return formatDuration(data);
                    }
                    return data; // Originaldaten für Sortierung
                },
                "type": "num"
            });
        }

        if (pageName === 'users' || pageName === 'userDetails') {
            columnDefs.push({
                "targets": 'privacyStatus',
                "render": function (data) {
                    return getPrivacyStatusText(data);
                },
                "type": "string"
            });
        }

        switch (pageName) {
            case 'userDetails':
                columnDefs.push(
                    {
                        "targets": ['videosId', 'usersId', 'videoId', 'duration'], "searchable": false // Hier die Spaltennummer, die nicht durchsuchbar sein soll
                    },
                    {
                        "targets": ['videosId', 'usersId', 'videoId'], "visible": false // Hier die Spaltennummer, die nicht sichtbar sein soll
                    }
                );
                break;
            case 'index':
                columnDefs.push(
                    {
                        "targets": 'userName',
                        "render": function (data, type, row) {
                            const usersId = row[getColumnIndex('usersId')];
                            const userDetailsLink = 'userDetails.html?usersId=' + usersId;
                            if (type === 'display') {
                                return '<a href="' + userDetailsLink + '" target="_blank" style="text-decoration:none;">' + data + '</a>';
                            }
                            return data;
                        },
                        "type": "string"
                    },
                    {
                        "targets": 'videoCount', "orderable": false // Hier die Spaltennummer, die nicht sortierbar sein soll
                    },
                    {
                        "targets": ['videosId', 'usersId', 'videoId', 'duration', 'videoCount'], "searchable": false // Hier die Spaltennummer, die nicht durchsuchbar sein soll
                    },
                    {
                        "targets": ['videosId', 'usersId', 'videoId'], "visible": false // Hier die Spaltennummer, die nicht sichtbar sein soll
                    }
                );
                break;
            case 'users':
                columnDefs.push(
                    {
                        "targets": 'usersId',
                        "width": '20px',    // Kleineren Wert als benötigt werden. Wird dann automatisch an den Inhalt angepasst. Ansonsten hätte man whitespace hinter den Buttons
                        "render": function (data) {
                            if (document.getElementById('filterDeleted').value === '1') {
                                return `<i class="fas fa-trash-can-arrow-up fa-fw image-button" onclick="restoreUser(${data});"></i>
                                <i class="fas fa-eraser fa-fw image-button" onclick="eraseUser(${data});"></i>`;
                            } else {
                                return `<i class="fas fa-user-pen fa-fw image-button" onclick="editUser(${data});"></i>
                            <i class="fas fa-trash-can fa-fw image-button" onclick="deleteUser(${data});"></i>`;
                            }
                        },
                        "type": "string"
                    },
                    {
                        "targets": 'userTitle',
                        "render": function (data, type, row) {
                            const usersId = row[getColumnIndex('usersId')];
                            const userDetailsLink = 'userDetails.html?usersId=' + usersId;
                            if (type === 'display') {
                                return '<a href="' + userDetailsLink + '" target="_blank" style="text-decoration:none;">' + data + '</a>';
                            }
                            return data;
                        },
                        "type": "string"
                    },
                    {
                        "targets": 'customUserTitle',
                        "render": function (data, type, row) {
                            const usersId = row[getColumnIndex('usersId')];
                            const userDetailsLink = 'userDetails.html?usersId=' + usersId;
                            if (type === 'display') {
                                return '<a href="' + userDetailsLink + '" target="_blank" style="text-decoration:none;">' + data + '</a>';
                            }
                            return data;
                        },
                        "type": "string"
                    },
                    {
                        "targets": 'language',
                        "render": function (data) {
                            return getLanguageNameByCode(data);
                        },
                        "type": "string"
                    },
                    {
                        "targets": ['inactive', 'hidden'],
                        "render": function (data) {
                            return (data ? 'Ja' : 'Nein');
                        },
                        "type": "string"
                    },
                    {
                        "targets": ['usersId', 'videoCount'], "orderable": false // Hier die Spaltennummer, die nicht sortierbar sein soll
                    },
                    {
                        "targets": ['usersId', 'channelId', 'videoCount', 'language', 'inactive', 'hidden'], "searchable": false // Hier die Spaltennummer, die nicht durchsuchbar sein soll
                    },
                    {
                        "targets": ['channelId', 'inactive', 'hidden'], "visible": false // Hier die Spaltennummer, die nicht sichtbar sein soll
                    }
                );
                break;
        }

        const defaultConfig = {
            // Gemeinsame Konfigurationsoptionen hier...
            //"processing": true, // Bringt nichts für clientseitiges Laden
            "data": dataTableArray,
            "order": [
                [getColumnIndex(sortColumn), 'asc']
            ],
            "columnDefs": columnDefs,
            "pageLength": 25,   // Hier legst du die Anzahl der anzuzeigenden Zeilen fest
            "language": {
                "lengthMenu": "_MENU_ Zeilen",
                "emptyTable": "Keine Daten vorhanden",
                "zeroRecords": "Keine Ergebnisse gefunden",
                "info": "_START_ - _END_ von _TOTAL_ Einträgen",
                "infoEmpty": "0 Einträge",
                "infoFiltered": "(gefiltert aus _MAX_ total Datensätzen)",
                "search": "Suche:",
                "paginate": {
                    "first": "Erste",
                    "last": "Letzte",
                    "next": "Weiter",
                    "previous": "Zurück"
                },
                "aria": {
                    "sortAscending": ": Klicken, um aufsteigend zu sortieren",
                    "sortDescending": ": Klicken, um absteigend zu sortieren"
                },
                "loadingRecords": "Laden...",
            }
        };

        // // Füge zusätzliche Konfiguration hinzu, falls vorhanden
        // if (additionalConfig) {
        //     Object.assign(defaultConfig, additionalConfig);
        // }

        dataTable = $('#dataTable').DataTable(defaultConfig);

        if (['index', 'userDetails'].includes(pageName)) {
            $('#dataTable tbody').on('click', 'tr:not(:has(td.dataTables_empty))', function (event) {
                // Überprüfen, ob das geklickte Element ein Link ist
                if (!$(event.target).closest('a').length) {
                    // Hier wird die Zeile ausgewählt oder deselektiert
                    $(this).toggleClass('selected');
                }
            });
        }
    }
    await hideLoadingOverlay();
}