export type Language = 'en' | 'es' | 'de' | 'fr' | 'pt' | 'ja';

export interface Translations {
    // Search
    search: {
        placeholder: string;
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
    };

    // Tooltips
    tooltips: {
        viewOnGitHub: string;
        visitScriptWizards: string;
        selectVaultFolder: string;
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
    },

    tooltips: {
        viewOnGitHub: "View on GitHub",
        visitScriptWizards: "Visit Script Wizards",
        selectVaultFolder: "Select vault folder",
    },

    clearStorage: {
        confirmMessage: "Are you sure you want to clear all stored data?\n\nThis will:\n• Remove your vault path\n• Clear all parsed tables\n• Reset all settings\n• Clear roll history\n\nThis action cannot be undone.",
        successMessage: "Storage cleared successfully!",
        failedMessage: "Failed to clear storage",
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
    },

    tooltips: {
        viewOnGitHub: "GitHubで表示",
        visitScriptWizards: "Script Wizardsを訪問",
        selectVaultFolder: "ボルトフォルダを選択",
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
    },

    tooltips: {
        viewOnGitHub: "Voir sur GitHub",
        visitScriptWizards: "Visiter Script Wizards",
        selectVaultFolder: "Sélectionner le dossier du coffre",
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
        case 'fr':
            return fr;
        case 'ja':
            return ja;
        default:
            return en;
    }
};

// Translation hook for React components
export const useTranslations = () => {
    return getTranslations();
};
