export type Language = 'en' | 'es' | 'de' | 'fr' | 'pt' | 'ja';

export interface Translations {
    // Search
    search: {
        placeholder: string;
        ariaLabel: {
            searchTables: string;
            resultsFound: string;
            noResultsFound: string;
            selectedOf: string;
        };
        hints: {
            navigate: string;
            enterToRoll: string;
            focus: string;
            clear: string;
            history: string;
            quickSelect: string;
            back: string;
        };
    };

    // Mobile menu
    mobileMenu: {
        menu: string;
        loadVault: string;
        changeVault: string;
        refreshVault: string;
        showHistory: string;
        hideHistory: string;
        clearStorage: string;
    };

    // Header buttons
    header: {
        loadVault: string;
        tooltips: {
            changeVault: string;
            selectVault: string;
            refreshVault: string;
            selectVaultFirst: string;
            showHistory: string;
            hideHistory: string;
            clearStorage: string;
            closeWelcome: string;
        };
    };

    // Welcome screen
    welcome: {
        title: string;
        description: string;
        tableInstructions: string;
        bracketInstructions: string;
        credits: string;
        setupInstruction: string;
        obsidianVault: string;
        letsRoll: string;
    };

    // Table list
    tables: {
        noTablesFound: string;
        noTablesLoaded: string;
        tryDifferentSearch: string;
        viewDefinition: string;
        hideDefinition: string;
        entries: string;
        subtables: string;
        errors: string;
        view: string;
        hide: string;
        file: string;
        errorsLabel: string;
        section: string;
        sections: string;
        error: string;
        table: string;
        tables: string;
        tableList: string;
        openInNewWindow: string;
        searchPlaceholder: string;
        openHistoryWindow: string;
        clearSearch: string;
        clickToRoll: string;
        noHistoryYet: string;
    };

    // Roll results
    rollResults: {
        clickToRerollEntire: string;
        clickToRerollSubtable: string;
        clickAnywhereToRerollEverything: string;
        clickHighlightedPartsToRerollIndividual: string;
        clickToReroll: string;
        howToReroll: string;
        clickHighlightedParts: string;
        clickAnywhereElse: string;
    };

    // App status
    status: {
        loading: string;
        saving: string;
        saved: string;
        saveFailed: string;
    };

    // History
    history: {
        title: string;
        hideHistory: string;
        historyFor: string;
    };

    // Tooltips
    tooltips: {
        viewOnGitHub: string;
        visitScriptWizards: string;
        selectVaultFolder: string;
        toggleCanvasMode: string;
        addWindow: string;
        welcome: string;
        search: string;
        rollHistory: string;
        currentRoll: string;
    };

    // Clear storage dialog
    clearStorage: {
        confirmMessage: string;
        successMessage: string;
        failedMessage: string;
    };

}

const en: Translations = {
    search: {
        placeholder: "Search...",
        ariaLabel: {
            searchTables: "Search tables",
            resultsFound: "Results found",
            noResultsFound: "No results found",
            selectedOf: "Selected of",
        },
        hints: {
            navigate: "↑↓ navigate",
            enterToRoll: "Enter to roll",
            focus: "Ctrl+K focus",
            clear: "Ctrl+L clear",
            history: "Ctrl+H history",
            quickSelect: "1-9 quick select",
            back: "Esc back",
        },
    },

    mobileMenu: {
        menu: "Menu",
        loadVault: "Load vault",
        changeVault: "Change vault",
        refreshVault: "Refresh vault",
        showHistory: "Show history",
        hideHistory: "Hide history",
        clearStorage: "Clear storage",
    },

    header: {
        loadVault: "load vault",
        tooltips: {
            changeVault: "Click to change vault",
            selectVault: "Click to select vault",
            refreshVault: "Refresh vault and parse tables",
            selectVaultFirst: "Select a vault first",
            showHistory: "Show roll history (Ctrl+H)",
            hideHistory: "Hide roll history (Ctrl+H)",
            clearStorage: "Clear all stored data",
            closeWelcome: "Close welcome screen",
        },
    },

    welcome: {
        title: "Welcome to Oracle",
        description: "A random table roller for your Obsidian vault. Search through your tables, click to roll, get interactive results with clickable subtables. Built to handle {perchanceLink}.",
        tableInstructions: "Tables should be in markdown code blocks tagged with ```perchance:",
        bracketInstructions: "You can also use [brackets] to reference other sections:",
        credits: "Made by {scriptWizardsLink}. Source code on {githubLink} if you want to contribute or give feedback.",
        setupInstruction: "Point it at your",
        obsidianVault: "Obsidian vault",
        letsRoll: "and let's roll.",
    },

    tables: {
        noTablesFound: "No tables found",
        noTablesLoaded: "No tables loaded",
        tryDifferentSearch: "Try a different search term",
        viewDefinition: "View table definition",
        hideDefinition: "Hide table definition",
        entries: "entries",
        subtables: "subtables",
        errors: "errors",
        view: "View",
        hide: "Hide",
        file: "File",
        errorsLabel: "Errors",
        section: "section",
        sections: "sections",
        error: "error",
        table: "table",
        tables: "tables",
        tableList: "Table List",
        openInNewWindow: "Open in new window",
        searchPlaceholder: "Search...",
        openHistoryWindow: "Open history window",
        clearSearch: "Clear search",
        clickToRoll: "Click to roll",
        noHistoryYet: "No history yet",
    },

    rollResults: {
        clickToRerollEntire: "Click to reroll entire result",
        clickToRerollSubtable: "Click to reroll [{source}]",
        clickAnywhereToRerollEverything: "Click anywhere to reroll everything, or click highlighted parts to reroll individual results",
        clickHighlightedPartsToRerollIndividual: "Click anywhere to reroll everything, or click highlighted parts to reroll individual results",
        clickToReroll: "Click to reroll",
        howToReroll: "How to reroll",
        clickHighlightedParts: "Click highlighted parts to reroll individual results",
        clickAnywhereElse: "Click anywhere else to reroll everything",
    },

    status: {
        loading: "Loading...",
        saving: "Saving...",
        saved: "Saved",
        saveFailed: "Save failed",
    },

    history: {
        title: "History",
        hideHistory: "Hide roll history",
        historyFor: "History - {tableName}",
    },

    tooltips: {
        viewOnGitHub: "View on GitHub",
        visitScriptWizards: "Visit Script Wizards",
        selectVaultFolder: "Select vault folder",
        toggleCanvasMode: "Toggle canvas mode",
        addWindow: "Add window",
        welcome: "Welcome",
        search: "Search",
        rollHistory: "Roll history",
        currentRoll: "Current roll",
    },

    clearStorage: {
        confirmMessage: "Are you sure you want to clear all stored data?\n\nThis will:\n• Remove your vault path\n• Clear all parsed tables\n• Reset all settings\n• Clear roll history\n\nThis action cannot be undone.",
        successMessage: "Storage cleared successfully!",
        failedMessage: "Failed to clear storage",
    },
};

const es: Translations = {
    search: {
        placeholder: "Buscar...",
        ariaLabel: {
            searchTables: "Buscar tablas",
            resultsFound: "Resultados encontrados",
            noResultsFound: "No se encontraron resultados",
            selectedOf: "Seleccionado de",
        },
        hints: {
            navigate: "↑↓ navegar",
            enterToRoll: "Enter para tirar",
            focus: "Ctrl+K enfocar",
            clear: "Ctrl+L limpiar",
            history: "Ctrl+H historial",
            quickSelect: "1-9 selección rápida",
            back: "Esc volver",
        },
    },

    mobileMenu: {
        menu: "Menú",
        loadVault: "Cargar bóveda",
        changeVault: "Cambiar bóveda",
        refreshVault: "Actualizar bóveda",
        showHistory: "Mostrar historial",
        hideHistory: "Ocultar historial",
        clearStorage: "Limpiar almacenamiento",
    },

    header: {
        loadVault: "cargar bóveda",
        tooltips: {
            changeVault: "Haz clic para cambiar de bóveda",
            selectVault: "Haz clic para seleccionar una bóveda",
            refreshVault: "Actualizar bóveda y analizar tablas",
            selectVaultFirst: "Selecciona una bóveda primero",
            showHistory: "Mostrar historial de tiradas (Ctrl+H)",
            hideHistory: "Ocultar historial de tiradas (Ctrl+H)",
            clearStorage: "Limpiar todos los datos almacenados",
            closeWelcome: "Cerrar pantalla de bienvenida",
        },
    },

    welcome: {
        title: "Bienvenido a Oracle",
        description: "Un generador de tablas aleatorias para tu bóveda de Obsidian. Busca entre tus tablas, haz clic para tirar, obtén resultados interactivos con subtablas clicables. Construido para manejar {perchanceLink}.",
        tableInstructions: "Las tablas deben estar en bloques de código markdown etiquetados con ```perchance:",
        bracketInstructions: "También puedes usar [corchetes] para referenciar otras secciones:",
        credits: "Hecho por {scriptWizardsLink}. Código fuente en {githubLink} si quieres contribuir o dar retroalimentación.",
        setupInstruction: "Apúntalo a tu",
        obsidianVault: "bóveda de Obsidian",
        letsRoll: "y empecemos a tirar.",
    },

    tables: {
        noTablesFound: "No se encontraron tablas",
        noTablesLoaded: "No hay tablas cargadas",
        tryDifferentSearch: "Prueba con un término de búsqueda diferente",
        viewDefinition: "Ver definición de tabla",
        hideDefinition: "Ocultar definición de tabla",
        entries: "entradas",
        subtables: "subtablas",
        errors: "errores",
        view: "Ver",
        hide: "Ocultar",
        file: "Archivo",
        errorsLabel: "Errores",
        section: "sección",
        sections: "secciones",
        error: "error",
        table: "tabla",
        tables: "tablas",
        tableList: "Lista de tablas",
        openInNewWindow: "Abrir en nueva ventana",
        searchPlaceholder: "Buscar...",
        openHistoryWindow: "Abrir ventana de historial",
        clearSearch: "Limpiar búsqueda",
        clickToRoll: "Haz clic para tirar",
        noHistoryYet: "Aún no hay historial",
    },

    rollResults: {
        clickToRerollEntire: "Haz clic para volver a tirar todo el resultado",
        clickToRerollSubtable: "Haz clic para volver a tirar [{source}]",
        clickAnywhereToRerollEverything: "Haz clic en cualquier lugar para volver a tirar todo, o haz clic en las partes resaltadas para volver a tirar resultados individuales",
        clickHighlightedPartsToRerollIndividual: "Haz clic en cualquier lugar para volver a tirar todo, o haz clic en las partes resaltadas para volver a tirar resultados individuales",
        clickToReroll: "Haz clic para volver a tirar",
        howToReroll: "Cómo volver a tirar",
        clickHighlightedParts: "Haz clic en las partes resaltadas para volver a tirar resultados individuales",
        clickAnywhereElse: "Haz clic en cualquier otro lugar para volver a tirar todo",
    },

    status: {
        loading: "Cargando...",
        saving: "Guardando...",
        saved: "Guardado",
        saveFailed: "Error al guardar",
    },

    history: {
        title: "Historial",
        hideHistory: "Ocultar historial de tiradas",
        historyFor: "Historial - {tableName}",
    },

    tooltips: {
        viewOnGitHub: "Ver en GitHub",
        visitScriptWizards: "Visitar Script Wizards",
        selectVaultFolder: "Seleccionar carpeta de bóveda",
        toggleCanvasMode: "Alternar modo lienzo",
        addWindow: "Agregar ventana",
        welcome: "Bienvenida",
        search: "Buscar",
        rollHistory: "Historial de tiradas",
        currentRoll: "Tirada actual",
    },

    clearStorage: {
        confirmMessage: "¿Estás seguro de que quieres limpiar todos los datos almacenados?\n\nEsto hará:\n• Eliminar la ruta de tu bóveda\n• Limpiar todas las tablas analizadas\n• Restablecer todas las configuraciones\n• Limpiar historial de tiradas\n\nEsta acción no se puede deshacer.",
        successMessage: "¡Almacenamiento limpiado exitosamente!",
        failedMessage: "Error al limpiar almacenamiento",
    },
};

const de: Translations = {
    search: {
        placeholder: "Suchen...",
        ariaLabel: {
            searchTables: "Tabellen durchsuchen",
            resultsFound: "Ergebnisse gefunden",
            noResultsFound: "Keine Ergebnisse gefunden",
            selectedOf: "Ausgewählt von",
        },
        hints: {
            navigate: "↑↓ navigieren",
            enterToRoll: "Enter zum Würfeln",
            focus: "Strg+K fokussieren",
            clear: "Strg+L löschen",
            history: "Strg+H Verlauf",
            quickSelect: "1-9 Schnellauswahl",
            back: "Esc zurück",
        },
    },

    mobileMenu: {
        menu: "Menü",
        loadVault: "Tresor laden",
        changeVault: "Tresor wechseln",
        refreshVault: "Tresor aktualisieren",
        showHistory: "Verlauf anzeigen",
        hideHistory: "Verlauf ausblenden",
        clearStorage: "Speicher löschen",
    },

    header: {
        loadVault: "Tresor laden",
        tooltips: {
            changeVault: "Klicken zum Tresor wechseln",
            selectVault: "Klicken zum Tresor auswählen",
            refreshVault: "Tresor aktualisieren und Tabellen analysieren",
            selectVaultFirst: "Zuerst einen Tresor auswählen",
            showHistory: "Würfel-Verlauf anzeigen (Strg+H)",
            hideHistory: "Würfel-Verlauf ausblenden (Strg+H)",
            clearStorage: "Alle gespeicherten Daten löschen",
            closeWelcome: "Willkommensbildschirm schließen",
        },
    },

    welcome: {
        title: "Willkommen bei Oracle",
        description: "Ein Zufallstabellen-Würfler für deinen Obsidian-Tresor. Durchsuche deine Tabellen, klicke zum Würfeln, erhalte interaktive Ergebnisse mit anklickbaren Untertabellen. Entwickelt für {perchanceLink}.",
        tableInstructions: "Tabellen sollten in Markdown-Codeblöcken mit ```perchance-Tag stehen:",
        bracketInstructions: "Du kannst auch [Klammern] verwenden, um andere Abschnitte zu referenzieren:",
        credits: "Erstellt von {scriptWizardsLink}. Quellcode auf {githubLink}, wenn du beitragen oder Feedback geben möchtest.",
        setupInstruction: "Richte es auf deinen",
        obsidianVault: "Obsidian-Tresor",
        letsRoll: "aus und lass uns würfeln.",
    },

    tables: {
        noTablesFound: "Keine Tabellen gefunden",
        noTablesLoaded: "Keine Tabellen geladen",
        tryDifferentSearch: "Versuche einen anderen Suchbegriff",
        viewDefinition: "Tabellendefinition anzeigen",
        hideDefinition: "Tabellendefinition ausblenden",
        entries: "Einträge",
        subtables: "Untertabellen",
        errors: "Fehler",
        view: "Anzeigen",
        hide: "Ausblenden",
        file: "Datei",
        errorsLabel: "Fehler",
        section: "Abschnitt",
        sections: "Abschnitte",
        error: "Fehler",
        table: "Tabelle",
        tables: "Tabellen",
        tableList: "Tabellenliste",
        openInNewWindow: "In neuem Fenster öffnen",
        searchPlaceholder: "Suchen...",
        openHistoryWindow: "Verlaufsfenster öffnen",
        clearSearch: "Suche löschen",
        clickToRoll: "Klicken zum Würfeln",
        noHistoryYet: "Noch kein Verlauf",
    },

    rollResults: {
        clickToRerollEntire: "Klicken, um das gesamte Ergebnis neu zu würfeln",
        clickToRerollSubtable: "Klicken, um [{source}] neu zu würfeln",
        clickAnywhereToRerollEverything: "Klicke irgendwo, um alles neu zu würfeln, oder klicke auf hervorgehobene Teile, um einzelne Ergebnisse neu zu würfeln",
        clickHighlightedPartsToRerollIndividual: "Klicke irgendwo, um alles neu zu würfeln, oder klicke auf hervorgehobene Teile, um einzelne Ergebnisse neu zu würfeln",
        clickToReroll: "Klicken zum neu würfeln",
        howToReroll: "Wie neu würfeln",
        clickHighlightedParts: "Klicke auf hervorgehobene Teile, um einzelne Ergebnisse neu zu würfeln",
        clickAnywhereElse: "Klicke irgendwo anders, um alles neu zu würfeln",
    },

    status: {
        loading: "Lädt...",
        saving: "Speichert...",
        saved: "Gespeichert",
        saveFailed: "Speichern fehlgeschlagen",
    },

    history: {
        title: "Verlauf",
        hideHistory: "Würfel-Verlauf ausblenden",
        historyFor: "Verlauf - {tableName}",
    },

    tooltips: {
        viewOnGitHub: "Auf GitHub anzeigen",
        visitScriptWizards: "Script Wizards besuchen",
        selectVaultFolder: "Tresor-Ordner auswählen",
        toggleCanvasMode: "Canvas-Modus umschalten",
        addWindow: "Fenster hinzufügen",
        welcome: "Willkommen",
        search: "Suchen",
        rollHistory: "Würfel-Verlauf",
        currentRoll: "Aktueller Wurf",
    },

    clearStorage: {
        confirmMessage: "Bist du sicher, dass du alle gespeicherten Daten löschen möchtest?\n\nDies wird:\n• Deinen Tresor-Pfad entfernen\n• Alle analysierten Tabellen löschen\n• Alle Einstellungen zurücksetzen\n• Den Würfel-Verlauf löschen\n\nDiese Aktion kann nicht rückgängig gemacht werden.",
        successMessage: "Speicher erfolgreich gelöscht!",
        failedMessage: "Fehler beim Löschen des Speichers",
    },
};

const pt: Translations = {
    search: {
        placeholder: "Pesquisar...",
        ariaLabel: {
            searchTables: "Pesquisar tabelas",
            resultsFound: "Resultados encontrados",
            noResultsFound: "Nenhum resultado encontrado",
            selectedOf: "Selecionado de",
        },
        hints: {
            navigate: "↑↓ navegar",
            enterToRoll: "Enter para rolar",
            focus: "Ctrl+K focar",
            clear: "Ctrl+L limpar",
            history: "Ctrl+H histórico",
            quickSelect: "1-9 seleção rápida",
            back: "Esc voltar",
        },
    },

    mobileMenu: {
        menu: "Menu",
        loadVault: "Carregar cofre",
        changeVault: "Mudar cofre",
        refreshVault: "Atualizar cofre",
        showHistory: "Mostrar histórico",
        hideHistory: "Ocultar histórico",
        clearStorage: "Limpar armazenamento",
    },

    header: {
        loadVault: "carregar cofre",
        tooltips: {
            changeVault: "Clique para mudar de cofre",
            selectVault: "Clique para selecionar um cofre",
            refreshVault: "Atualizar cofre e analisar tabelas",
            selectVaultFirst: "Selecione um cofre primeiro",
            showHistory: "Mostrar histórico de rolagens (Ctrl+H)",
            hideHistory: "Ocultar histórico de rolagens (Ctrl+H)",
            clearStorage: "Limpar todos os dados armazenados",
            closeWelcome: "Fechar tela de boas-vindas",
        },
    },

    welcome: {
        title: "Bem-vindo ao Oracle",
        description: "Um rolador de tabelas aleatórias para seu cofre Obsidian. Pesquise suas tabelas, clique para rolar, obtenha resultados interativos com subtabelas clicáveis. Construído para lidar com {perchanceLink}.",
        tableInstructions: "As tabelas devem estar em blocos de código markdown marcados com ```perchance:",
        bracketInstructions: "Você também pode usar [colchetes] para referenciar outras seções:",
        credits: "Feito por {scriptWizardsLink}. Código fonte no {githubLink} se você quiser contribuir ou dar feedback.",
        setupInstruction: "Aponte para seu",
        obsidianVault: "cofre Obsidian",
        letsRoll: "e vamos rolar.",
    },

    tables: {
        noTablesFound: "Nenhuma tabela encontrada",
        noTablesLoaded: "Nenhuma tabela carregada",
        tryDifferentSearch: "Tente um termo de pesquisa diferente",
        viewDefinition: "Ver definição da tabela",
        hideDefinition: "Ocultar definição da tabela",
        entries: "entradas",
        subtables: "subtabelas",
        errors: "erros",
        view: "Ver",
        hide: "Ocultar",
        file: "Arquivo",
        errorsLabel: "Erros",
        section: "seção",
        sections: "seções",
        error: "erro",
        table: "tabela",
        tables: "tabelas",
        tableList: "Lista de tabelas",
        openInNewWindow: "Abrir em nova janela",
        searchPlaceholder: "Pesquisar...",
        openHistoryWindow: "Abrir janela de histórico",
        clearSearch: "Limpar pesquisa",
        clickToRoll: "Clique para rolar",
        noHistoryYet: "Ainda sem histórico",
    },

    rollResults: {
        clickToRerollEntire: "Clique para rolar novamente o resultado inteiro",
        clickToRerollSubtable: "Clique para rolar novamente [{source}]",
        clickAnywhereToRerollEverything: "Clique em qualquer lugar para rolar tudo novamente, ou clique nas partes destacadas para rolar resultados individuais",
        clickHighlightedPartsToRerollIndividual: "Clique em qualquer lugar para rolar tudo novamente, ou clique nas partes destacadas para rolar resultados individuais",
        clickToReroll: "Clique para rolar novamente",
        howToReroll: "Como rolar novamente",
        clickHighlightedParts: "Clique nas partes destacadas para rolar resultados individuais",
        clickAnywhereElse: "Clique em qualquer outro lugar para rolar tudo novamente",
    },

    status: {
        loading: "Carregando...",
        saving: "Salvando...",
        saved: "Salvo",
        saveFailed: "Falha ao salvar",
    },

    history: {
        title: "Histórico",
        hideHistory: "Ocultar histórico de rolagens",
        historyFor: "Histórico - {tableName}",
    },

    tooltips: {
        viewOnGitHub: "Ver no GitHub",
        visitScriptWizards: "Visitar Script Wizards",
        selectVaultFolder: "Selecionar pasta do cofre",
        toggleCanvasMode: "Alternar modo canvas",
        addWindow: "Adicionar janela",
        welcome: "Boas-vindas",
        search: "Pesquisar",
        rollHistory: "Histórico de rolagens",
        currentRoll: "Rolagem atual",
    },

    clearStorage: {
        confirmMessage: "Tem certeza de que deseja limpar todos os dados armazenados?\n\nIsso irá:\n• Remover o caminho do seu cofre\n• Limpar todas as tabelas analisadas\n• Redefinir todas as configurações\n• Limpar histórico de rolagens\n\nEsta ação não pode ser desfeita.",
        successMessage: "Armazenamento limpo com sucesso!",
        failedMessage: "Falha ao limpar armazenamento",
    },
};

// Language storage key
const LANGUAGE_STORAGE_KEY = 'oracle-language';

// Current language state
let currentLanguage: Language = 'en';
let currentTranslations: Translations = en;

// Load saved language preference (only call from renderer process)
export const initializeLanguage = (): Language => {
    try {
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved && isValidLanguage(saved)) {
            currentLanguage = saved as Language;
            currentTranslations = getTranslationsForLanguage(currentLanguage);
        }
    } catch (error) {
        console.warn('Failed to load language preference:', error);
    }
    return currentLanguage;
};

// Save language preference (only call from renderer process)
export const setLanguage = (language: Language): void => {
    currentLanguage = language;
    currentTranslations = getTranslationsForLanguage(language);

    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
        console.warn('Failed to save language preference:', error);
    }
};

// Get current language
export const getCurrentLanguage = (): Language => currentLanguage;

// Get current translations
export const getTranslations = (): Translations => currentTranslations;

// Validate language code
const isValidLanguage = (lang: string): boolean => {
    return ['en', 'es', 'de', 'fr', 'pt', 'ja'].includes(lang);
};

const ja: Translations = {
    search: {
        placeholder: "検索...",
        ariaLabel: {
            searchTables: "テーブルを検索",
            resultsFound: "結果が見つかりました",
            noResultsFound: "結果が見つかりません",
            selectedOf: "選択された",
        },
        hints: {
            navigate: "↑↓ ナビゲート",
            enterToRoll: "Enter でロール",
            focus: "Ctrl+K フォーカス",
            clear: "Ctrl+L クリア",
            history: "Ctrl+H 履歴",
            quickSelect: "1-9 クイック選択",
            back: "Esc 戻る",
        },
    },

    mobileMenu: {
        menu: "メニュー",
        loadVault: "ボルトを読み込み",
        changeVault: "ボルトを変更",
        refreshVault: "ボルトを更新",
        showHistory: "履歴を表示",
        hideHistory: "履歴を非表示",
        clearStorage: "ストレージをクリア",
    },

    header: {
        loadVault: "ボルトを読み込み",
        tooltips: {
            changeVault: "クリックしてボルトを変更",
            selectVault: "クリックしてボルトを選択",
            refreshVault: "ボルトを更新してテーブルを解析",
            selectVaultFirst: "最初にボルトを選択してください",
            showHistory: "ロール履歴を表示 (Ctrl+H)",
            hideHistory: "ロール履歴を非表示 (Ctrl+H)",
            clearStorage: "すべての保存データをクリア",
            closeWelcome: "ウェルカム画面を閉じる",
        },
    },

    welcome: {
        title: "Oracleへようこそ",
        description: "Obsidianボルト用のランダムテーブルローラーです。テーブルを検索し、クリックしてロールし、クリック可能なサブテーブルでインタラクティブな結果を取得できます。{perchanceLink}に対応しています。",
        tableInstructions: "テーブルは```perchanceタグ付きのマークダウンコードブロックに記述してください：",
        bracketInstructions: "[ブラケット]を使用して他のセクションを参照することもできます：",
        credits: "{scriptWizardsLink}によって作成されました。貢献やフィードバックをお寄せいただける場合は{githubLink}のソースコードをご覧ください。",
        setupInstruction: "あなたの",
        obsidianVault: "Obsidianボルト",
        letsRoll: "を指定して、ロールを始めましょう。",
    },

    tables: {
        noTablesFound: "テーブルが見つかりません",
        noTablesLoaded: "テーブルが読み込まれていません",
        tryDifferentSearch: "別の検索語句を試してください",
        viewDefinition: "テーブル定義を表示",
        hideDefinition: "テーブル定義を非表示",
        entries: "エントリ",
        subtables: "サブテーブル",
        errors: "エラー",
        view: "表示",
        hide: "非表示",
        file: "ファイル",
        errorsLabel: "エラー",
        section: "セクション",
        sections: "セクション",
        error: "エラー",
        table: "テーブル",
        tables: "テーブル",
        tableList: "テーブルリスト",
        openInNewWindow: "新しいウィンドウで開く",
        searchPlaceholder: "検索...",
        openHistoryWindow: "履歴ウィンドウを開く",
        clearSearch: "検索をクリア",
        clickToRoll: "ロールをクリック",
        noHistoryYet: "履歴がありません",
    },

    rollResults: {
        clickToRerollEntire: "クリックして結果全体を再ロール",
        clickToRerollSubtable: "クリックして[{source}]を再ロール",
        clickAnywhereToRerollEverything: "どこでもクリックしてすべてを再ロール、またはハイライト部分をクリックして個別の結果を再ロール",
        clickHighlightedPartsToRerollIndividual: "どこでもクリックしてすべてを再ロール、またはハイライト部分をクリックして個別の結果を再ロール",
        clickToReroll: "クリックして再ロール",
        howToReroll: "再ロール方法",
        clickHighlightedParts: "ハイライト部分をクリックして個別の結果を再ロール",
        clickAnywhereElse: "他の場所をクリックしてすべてを再ロール",
    },

    status: {
        loading: "読み込み中...",
        saving: "保存中...",
        saved: "保存済み",
        saveFailed: "保存に失敗しました",
    },

    history: {
        title: "履歴",
        hideHistory: "ロール履歴を非表示",
        historyFor: "履歴 - {tableName}",
    },

    tooltips: {
        viewOnGitHub: "GitHubで表示",
        visitScriptWizards: "Script Wizardsを訪問",
        selectVaultFolder: "ボルトフォルダを選択",
        toggleCanvasMode: "キャンバスモードを切り替える",
        addWindow: "ウィンドウを追加",
        welcome: "ウェルカム",
        search: "検索",
        rollHistory: "ロール履歴",
        currentRoll: "現在のロール",
    },

    clearStorage: {
        confirmMessage: "すべての保存データをクリアしてもよろしいですか？\n\nこれにより以下が実行されます：\n• ボルトパスの削除\n• すべての解析済みテーブルのクリア\n• すべての設定のリセット\n• ロール履歴のクリア\n\nこの操作は元に戻せません。",
        successMessage: "ストレージが正常にクリアされました！",
        failedMessage: "ストレージのクリアに失敗しました",
    },
};

const fr: Translations = {
    search: {
        placeholder: "Rechercher...",
        ariaLabel: {
            searchTables: "Rechercher des tables",
            resultsFound: "Résultats trouvés",
            noResultsFound: "Aucun résultat trouvé",
            selectedOf: "Sélectionné de",
        },
        hints: {
            navigate: "↑↓ naviguer",
            enterToRoll: "Entrée pour lancer",
            focus: "Ctrl+K focus",
            clear: "Ctrl+L effacer",
            history: "Ctrl+H historique",
            quickSelect: "1-9 sélection rapide",
            back: "Échap retour",
        },
    },

    mobileMenu: {
        menu: "Menu",
        loadVault: "Charger coffre",
        changeVault: "Changer coffre",
        refreshVault: "Actualiser coffre",
        showHistory: "Afficher historique",
        hideHistory: "Masquer historique",
        clearStorage: "Effacer stockage",
    },

    header: {
        loadVault: "charger coffre",
        tooltips: {
            changeVault: "Cliquer pour changer de coffre",
            selectVault: "Cliquer pour sélectionner un coffre",
            refreshVault: "Actualiser le coffre et analyser les tables",
            selectVaultFirst: "Sélectionner d'abord un coffre",
            showHistory: "Afficher l'historique des lancers (Ctrl+H)",
            hideHistory: "Masquer l'historique des lancers (Ctrl+H)",
            clearStorage: "Effacer toutes les données stockées",
            closeWelcome: "Fermer l'écran d'accueil",
        },
    },

    welcome: {
        title: "Bienvenue dans Oracle",
        description: "Un lanceur de tables aléatoires pour votre coffre Obsidian. Recherchez dans vos tables, cliquez pour lancer, obtenez des résultats interactifs avec des sous-tables cliquables. Conçu pour gérer la {perchanceLink}.",
        tableInstructions: "Les tables doivent être dans des blocs de code markdown étiquetés avec ```perchance:",
        bracketInstructions: "Vous pouvez aussi utiliser [crochets] pour référencer d'autres sections:",
        credits: "Créé par {scriptWizardsLink}. Code source sur {githubLink} si vous voulez contribuer ou donner des commentaires.",
        setupInstruction: "Pointez-le vers votre",
        obsidianVault: "coffre Obsidian",
        letsRoll: "et c'est parti.",
    },

    tables: {
        noTablesFound: "Aucune table trouvée",
        noTablesLoaded: "Aucune table chargée",
        tryDifferentSearch: "Essayez un terme de recherche différent",
        viewDefinition: "Voir la définition de la table",
        hideDefinition: "Masquer la définition de la table",
        entries: "entrées",
        subtables: "sous-tables",
        errors: "erreurs",
        view: "Voir",
        hide: "Masquer",
        file: "Fichier",
        errorsLabel: "Erreurs",
        section: "section",
        sections: "sections",
        error: "erreur",
        table: "table",
        tables: "tables",
        tableList: "Liste des tables",
        openInNewWindow: "Ouvrir dans une nouvelle fenêtre",
        searchPlaceholder: "Rechercher...",
        openHistoryWindow: "Ouvrir la fenêtre d'historique",
        clearSearch: "Effacer la recherche",
        clickToRoll: "Cliquer pour lancer",
        noHistoryYet: "Historique vide",
    },

    rollResults: {
        clickToRerollEntire: "Cliquer pour relancer le résultat entier",
        clickToRerollSubtable: "Cliquer pour relancer [{source}]",
        clickAnywhereToRerollEverything: "Cliquez n'importe où pour tout relancer, ou cliquez sur les parties surlignées pour relancer les résultats individuels",
        clickHighlightedPartsToRerollIndividual: "Cliquez n'importe où pour tout relancer, ou cliquez sur les parties surlignées pour relancer les résultats individuels",
        clickToReroll: "Cliquer pour relancer",
        howToReroll: "Comment relancer",
        clickHighlightedParts: "Cliquez sur les parties surlignées pour relancer les résultats individuels",
        clickAnywhereElse: "Cliquez n'importe où ailleurs pour tout relancer",
    },

    status: {
        loading: "Chargement...",
        saving: "Sauvegarde...",
        saved: "Sauvegardé",
        saveFailed: "Échec de sauvegarde",
    },

    history: {
        title: "Histoire",
        hideHistory: "Masquer l'historique des lancers",
        historyFor: "Historique - {tableName}",
    },

    tooltips: {
        viewOnGitHub: "Voir sur GitHub",
        visitScriptWizards: "Visiter Script Wizards",
        selectVaultFolder: "Sélectionner le dossier du coffre",
        toggleCanvasMode: "Basculer le mode de canevas",
        addWindow: "Ajouter une fenêtre",
        welcome: "Bienvenue",
        search: "Rechercher",
        rollHistory: "Historique des lancers",
        currentRoll: "Lancer actuel",
    },

    clearStorage: {
        confirmMessage: "Êtes-vous sûr de vouloir effacer toutes les données stockées ?\n\nCeci va :\n• Supprimer le chemin de votre coffre\n• Effacer toutes les tables analysées\n• Réinitialiser tous les paramètres\n• Effacer l'historique des lancers\n\nCette action ne peut pas être annulée.",
        successMessage: "Stockage effacé avec succès !",
        failedMessage: "Échec de l'effacement du stockage",
    },
};

// Get translations for specific language
const getTranslationsForLanguage = (language: Language): Translations => {
    switch (language) {
        case 'en':
            return en;
        case 'es':
            return es;
        case 'de':
            return de;
        case 'fr':
            return fr;
        case 'ja':
            return ja;
        case 'pt':
            return pt;
        default:
            return en;
    }
};

// Translation hook for React components
export const useTranslations = () => {
    return getTranslations();
};
