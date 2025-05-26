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
            hideRollHistory: string;
        };
    };

    // Welcome screen
    welcome: {
        title: string;
        description: string;
        tableInstructions: string;
        bracketInstructions: string;
        madeBy: string;
        sourceCode: string;
        feedback: string;
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

    // History
    history: {
        title: string;
    };

    // Results
    results: {
        clickToReroll: string;
        clickAnywhereToReroll: string;
        howToReroll: string;
        clickHighlightedParts: string;
    };

    // Footer
    footer: {
        copyright: string;
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
            hideRollHistory: "Hide roll history",
        },
    },

    welcome: {
        title: "Welcome to Oracle",
        description: "A random table roller for your Obsidian vault. Search through your tables, click to roll, get interactive results with clickable subtables. Built to handle Perchance syntax.",
        tableInstructions: "Tables should be in markdown code blocks tagged with perchance:",
        bracketInstructions: "You can also use [brackets] to reference other sections:",
        madeBy: "Made by Script Wizards",
        sourceCode: "Source code on GitHub",
        feedback: "if you want to contribute or give feedback.",
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

    history: {
        title: "History",
    },

    results: {
        clickToReroll: "Click to reroll",
        clickAnywhereToReroll: "Click anywhere to reroll everything, or click highlighted parts to reroll individual results",
        howToReroll: "How to reroll",
        clickHighlightedParts: "Click highlighted parts to reroll individual results",
    },

    footer: {
        copyright: "© SCRIPT WIZARDS",
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

// Get translations for specific language
const getTranslationsForLanguage = (language: Language): Translations => {
    switch (language) {
        case 'en':
            return en;
        // TODO: Add other languages
        default:
            return en;
    }
};

// Translation hook for React components
export const useTranslations = () => {
    return getTranslations();
};
