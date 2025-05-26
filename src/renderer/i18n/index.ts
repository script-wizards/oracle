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
    },
};

// Get translations for specific language
const getTranslationsForLanguage = (language: Language): Translations => {
    switch (language) {
        case 'en':
            return en;
        case 'fr':
            return fr;
        default:
            return en;
    }
};

// Translation hook for React components
export const useTranslations = () => {
    return getTranslations();
};
