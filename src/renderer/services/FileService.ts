import { ParsedCodeBlock, extractCodeBlocks, filterPerchanceBlocks, getCodeBlockStats } from '../../shared/utils/MarkdownParser';
import { parsePerchanceTable, parseMultiplePerchanceTables } from '../../shared/utils/PerchanceParser';
import { Table } from '../../shared/types';

/**
 * Service class for handling file system operations
 * Provides a clean interface for vault selection, file scanning, and content reading
 */
export class FileService {
    /**
     * Opens a directory selection dialog and returns the selected vault path
     * @returns Promise<string | null> - The selected vault path or null if cancelled
     */
    static async selectVaultFolder(): Promise<string | null> {
        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            const selectedPath = await window.electronAPI.selectVaultFolder();

            if (selectedPath) {
                console.log('Vault folder selected:', selectedPath);
            }

            return selectedPath;
        } catch (error) {
            console.error('Failed to select vault folder:', error);
            throw new Error(`Failed to select vault folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Scans a vault directory for markdown files
     * @param vaultPath - The path to the vault directory to scan
     * @returns Promise<string[]> - Array of file paths to .md files
     */
    static async scanVaultFiles(vaultPath: string): Promise<string[]> {
        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            if (!vaultPath || typeof vaultPath !== 'string') {
                throw new Error('Invalid vault path provided');
            }

            const filePaths = await window.electronAPI.scanVaultFiles(vaultPath);
            return filePaths;
        } catch (error) {
            console.error('Failed to scan vault files:', error);
            throw new Error(`Failed to scan vault files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Reads the content of a specific file
     * @param filePath - The path to the file to read
     * @returns Promise<string> - The file content as a string
     */
    static async readFileContent(filePath: string): Promise<string> {
        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            if (!filePath || typeof filePath !== 'string') {
                throw new Error('Invalid file path provided');
            }

            const content = await window.electronAPI.readFileContent(filePath);
            return content;
        } catch (error) {
            console.error('Failed to read file content:', error);
            throw new Error(`Failed to read file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Extracts Perchance code blocks from a markdown file
     * @param filePath - The path to the markdown file
     * @returns Promise<ParsedCodeBlock[]> - Array of parsed Perchance code blocks
     */
    static async extractTablesFromFile(filePath: string): Promise<ParsedCodeBlock[]> {
        try {
            const content = await this.readFileContent(filePath);
            const allCodeBlocks = extractCodeBlocks(content);
            const perchanceBlocks = filterPerchanceBlocks(allCodeBlocks);

            // Log any validation errors
            perchanceBlocks.forEach((block, index) => {
                if (block.metadata.errors.length > 0) {
                    console.warn(`Validation errors in block ${index + 1} of ${filePath}:`, block.metadata.errors);
                }
            });

            return perchanceBlocks;
        } catch (error) {
            console.error('Failed to extract tables from file:', error);
            throw new Error(`Failed to extract tables from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Extracts Perchance code blocks from multiple files
     * @param filePaths - Array of file paths to process
     * @returns Promise<{filePath: string, blocks: ParsedCodeBlock[], error?: string}[]> - Results for each file
     */
    static async extractTablesFromFiles(filePaths: string[]): Promise<{
        filePath: string;
        blocks: ParsedCodeBlock[];
        error?: string;
    }[]> {
        const results = [];

        for (const filePath of filePaths) {
            try {
                const blocks = await this.extractTablesFromFile(filePath);
                results.push({ filePath, blocks });
            } catch (error) {
                console.error(`Failed to process file ${filePath}:`, error);
                results.push({
                    filePath,
                    blocks: [],
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return results;
    }

    /**
     * Gets comprehensive statistics about code blocks in a vault
     * @param vaultPath - The vault path to analyze
     * @returns Promise<VaultCodeBlockStats> - Detailed statistics
     */
    static async getVaultCodeBlockStats(vaultPath: string): Promise<{
        totalFiles: number;
        filesWithCodeBlocks: number;
        totalCodeBlocks: number;
        totalPerchanceBlocks: number;
        validPerchanceBlocks: number;
        invalidBlocks: number;
        languages: string[];
        fileResults: {
            filePath: string;
            stats: {
                totalBlocks: number;
                perchanceBlocks: number;
                validPerchanceBlocks: number;
                invalidBlocks: number;
                languages: string[];
            };
            error?: string;
        }[];
    }> {
        try {
            const filePaths = await this.scanVaultFiles(vaultPath);
            const fileResults = [];

            let totalCodeBlocks = 0;
            let totalPerchanceBlocks = 0;
            let validPerchanceBlocks = 0;
            let invalidBlocks = 0;
            const allLanguages = new Set<string>();
            let filesWithCodeBlocks = 0;

            for (const filePath of filePaths) {
                try {
                    const content = await this.readFileContent(filePath);
                    const stats = getCodeBlockStats(content);

                    if (stats.totalBlocks > 0) {
                        filesWithCodeBlocks++;
                    }

                    totalCodeBlocks += stats.totalBlocks;
                    totalPerchanceBlocks += stats.perchanceBlocks;
                    validPerchanceBlocks += stats.validPerchanceBlocks;
                    invalidBlocks += stats.invalidBlocks;

                    stats.languages.forEach(lang => allLanguages.add(lang));

                    fileResults.push({ filePath, stats });
                } catch (error) {
                    console.error(`Failed to analyze file ${filePath}:`, error);
                    fileResults.push({
                        filePath,
                        stats: {
                            totalBlocks: 0,
                            perchanceBlocks: 0,
                            validPerchanceBlocks: 0,
                            invalidBlocks: 0,
                            languages: []
                        },
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            return {
                totalFiles: filePaths.length,
                filesWithCodeBlocks,
                totalCodeBlocks,
                totalPerchanceBlocks,
                validPerchanceBlocks,
                invalidBlocks,
                languages: Array.from(allLanguages),
                fileResults
            };
        } catch (error) {
            console.error('Failed to get vault code block stats:', error);
            throw new Error(`Failed to get vault code block stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Validates that a path exists and is accessible
     * @param vaultPath - The vault path to validate
     * @returns Promise<boolean> - True if the path is valid and accessible
     */
    static async validateVaultPath(vaultPath: string): Promise<boolean> {
        try {
            // Try to scan the directory to see if it's accessible
            await this.scanVaultFiles(vaultPath);
            return true;
        } catch (error) {
            console.warn('Vault path validation failed:', error);
            return false;
        }
    }

    /**
     * Gets file statistics for a vault
     * @param vaultPath - The vault path to analyze
     * @returns Promise<{totalFiles: number, totalSize: number}> - Basic file statistics
     */
    static async getVaultStats(vaultPath: string): Promise<{ totalFiles: number, estimatedSize: string }> {
        try {
            const filePaths = await this.scanVaultFiles(vaultPath);
            const totalFiles = filePaths.length;

            // Estimate size based on file count (rough approximation)
            const estimatedSizeKB = totalFiles * 5; // Assume ~5KB per markdown file on average
            const estimatedSize = estimatedSizeKB > 1024
                ? `${(estimatedSizeKB / 1024).toFixed(1)} MB`
                : `${estimatedSizeKB} KB`;

            const result = {
                totalFiles,
                estimatedSize
            };

            return result;
        } catch (error) {
            console.error('Failed to get vault stats:', error);
            return {
                totalFiles: 0,
                estimatedSize: '0 KB'
            };
        }
    }

    /**
     * Checks if the Electron API is available
     * @returns boolean - True if the API is available
     */
    static isElectronAPIAvailable(): boolean {
        return typeof window !== 'undefined' && !!window.electronAPI;
    }

    /**
     * Parses Perchance tables from extracted code blocks
     * @param filePath - The path to the markdown file
     * @returns Promise<Table[]> - Array of parsed Table objects
     */
    static async parseTablesFromFile(filePath: string): Promise<Table[]> {
        try {
            const content = await this.readFileContent(filePath);
            const allCodeBlocks = extractCodeBlocks(content);
            const perchanceBlocks = filterPerchanceBlocks(allCodeBlocks);

            const tables: Table[] = [];

            for (let i = 0; i < perchanceBlocks.length; i++) {
                const block = perchanceBlocks[i];
                const table = parsePerchanceTable(block.content, filePath, i);

                if (table) {
                    tables.push(table);
                } else {
                    console.warn(`Failed to parse Perchance block ${i + 1} in ${filePath}`);
                }
            }

            return tables;
        } catch (error) {
            console.error('Failed to parse tables from file:', error);
            throw new Error(`Failed to parse tables from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Parses Perchance tables from multiple files
     * @param filePaths - Array of file paths to process
     * @returns Promise<{filePath: string, tables: Table[], error?: string}[]> - Results for each file
     */
    static async parseTablesFromFiles(filePaths: string[]): Promise<{
        filePath: string;
        tables: Table[];
        error?: string;
    }[]> {
        const results = [];

        for (const filePath of filePaths) {
            try {
                const tables = await this.parseTablesFromFile(filePath);
                results.push({ filePath, tables });
            } catch (error) {
                console.error(`Failed to parse tables from file ${filePath}:`, error);
                results.push({
                    filePath,
                    tables: [],
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return results;
    }

    /**
     * Parses all Perchance tables from a vault directory
     * @param vaultPath - The vault path to analyze
     * @returns Promise<Table[]> - All parsed tables from the vault
     */
    static async parseAllTablesFromVault(vaultPath: string): Promise<Table[]> {
        try {
            const filePaths = await this.scanVaultFiles(vaultPath);
            const allTables: Table[] = [];

            for (const filePath of filePaths) {
                try {
                    const tables = await this.parseTablesFromFile(filePath);
                    allTables.push(...tables);
                } catch (error) {
                    console.error(`Failed to parse tables from ${filePath}:`, error);
                    // Continue with other files even if one fails
                }
            }

            return allTables;
        } catch (error) {
            console.error('Failed to parse tables from vault:', error);
            throw new Error(`Failed to parse tables from vault: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
