import { Table, RollResult, SubrollData, TableSection } from '../types';

/**
 * Rolls on a table and resolves all subtable references
 * @param table - The main table to roll on
 * @param allTables - All available tables for subtable resolution
 * @param maxDepth - Maximum recursion depth to prevent infinite loops
 * @returns RollResult with resolved text and subroll information
 */
export function rollOnTable(
    table: Table,
    allTables: Table[],
    maxDepth: number = 10
): RollResult {
    // Use the stored sections if available, otherwise fall back to reconstruction
    const sections = table.sections || reconstructTableSections(table);

    // Create a map of table names to tables for quick lookup
    const tableMap = new Map<string, Table>();
    allTables.forEach(t => {
        tableMap.set(t.title.toLowerCase(), t);
        // Also map by ID for exact matches
        tableMap.set(t.id, t);
    });

    // Find the output section
    const outputSection = sections.find(s => s.name.toLowerCase() === 'output');
    if (!outputSection || outputSection.entries.length === 0) {
        console.warn(`No output section found in table "${table.title}"`);
        // Fallback to random entry from main table
        const randomEntry = table.entries[Math.floor(Math.random() * table.entries.length)];
        return {
            text: randomEntry,
            subrolls: [{
                text: randomEntry,
                type: 'dice',
                startIndex: 0,
                endIndex: randomEntry.length
            }],
            errors: [`No output section found in table "${table.title}"`]
        };
    }

    // Get a random output entry (usually there's only one)
    const outputEntry = outputSection.entries[Math.floor(Math.random() * outputSection.entries.length)];

    // Resolve the output text using the sections from this table
    const result = resolveText(outputEntry, sections, tableMap, [], maxDepth);

    return result;
}

/**
 * Reconstructs table sections from a Table object (fallback for backward compatibility)
 * This is used when tables don't have the new sections field populated
 */
function reconstructTableSections(table: Table): TableSection[] {
    const sections: TableSection[] = [];

    // Try to parse the sections from the entries
    // This assumes the entries are stored in a specific format
    let currentSection: TableSection | null = null;

    for (let i = 0; i < table.entries.length; i++) {
        const entry = table.entries[i];

        // Check if this looks like a section name (no spaces at start, common section names)
        if (!entry.startsWith(' ') &&
            ['title', 'output', 'encounter', 'treasure', 'gold', 'gems', 'items', 'conditions', 'name', 'reaction', 'item'].includes(entry.toLowerCase())) {

            // Save previous section
            if (currentSection) {
                sections.push(currentSection);
            }

            // Start new section
            currentSection = {
                name: entry,
                entries: []
            };
        } else if (currentSection) {
            // Add entry to current section
            currentSection.entries.push(entry);
        }
    }

    // Add the last section
    if (currentSection) {
        sections.push(currentSection);
    }

    // If we didn't find any sections, create a default one
    if (sections.length === 0) {
        sections.push({
            name: 'output',
            entries: table.entries
        });
    }

    return sections;
}

/**
 * Resolves text by replacing subtable references with rolled results
 */
function resolveText(
    text: string,
    sections: TableSection[],
    tableMap: Map<string, Table>,
    subrolls: SubrollData[],
    maxDepth: number,
    depth: number = 0
): RollResult {
    if (depth >= maxDepth) {
        console.warn(`Maximum recursion depth reached while resolving: "${text}"`);
        return {
            text,
            subrolls,
            errors: [`Maximum recursion depth reached`]
        };
    }

    let resolvedText = text;
    const errors: string[] = [];

    // Find all subtable references in the format [tableName]
    const subtableRegex = /\[([^\]]+)\]/g;
    let match;

    while ((match = subtableRegex.exec(text)) !== null) {
        const fullMatch = match[0]; // e.g., "[encounter]"
        const tableName = match[1]; // e.g., "encounter"
        const startIndex = match.index;
        const endIndex = match.index + fullMatch.length;

        // Try to resolve this subtable reference
        const subtableResult = resolveSubtable(tableName, sections, tableMap, maxDepth, depth + 1);

        if (subtableResult.success) {
            // Replace the reference with the resolved text
            resolvedText = resolvedText.replace(fullMatch, subtableResult.text);

            // Add subroll information
            subrolls.push({
                text: subtableResult.text,
                type: 'subtable',
                source: tableName,
                startIndex,
                endIndex
            });

            // Add any nested subrolls
            if (subtableResult.subrolls) {
                subrolls.push(...subtableResult.subrolls);
            }
        } else {
            console.warn(`Failed to resolve subtable: "${tableName}"`);
            errors.push(`Could not resolve subtable reference: [${tableName}]`);
        }
    }

    return {
        text: resolvedText,
        subrolls,
        errors: errors.length > 0 ? errors : undefined
    };
}

/**
 * Resolves a single subtable reference
 */
function resolveSubtable(
    tableName: string,
    sections: TableSection[],
    tableMap: Map<string, Table>,
    maxDepth: number,
    depth: number
): { success: boolean; text: string; subrolls?: SubrollData[] } {
    // First, try to find the subtable within the current table's sections
    const localSection = sections.find(s => s.name.toLowerCase() === tableName.toLowerCase());
    if (localSection && localSection.entries.length > 0) {
        const randomEntry = localSection.entries[Math.floor(Math.random() * localSection.entries.length)];

        // Recursively resolve this entry in case it has more references
        const resolved = resolveText(randomEntry, sections, tableMap, [], maxDepth, depth);
        return {
            success: true,
            text: resolved.text,
            subrolls: resolved.subrolls
        };
    }

    // If not found locally, try to find it in other tables
    const externalTable = tableMap.get(tableName.toLowerCase());
    if (externalTable) {
        const result = rollOnTable(externalTable, Array.from(tableMap.values()), maxDepth);
        return {
            success: true,
            text: result.text,
            subrolls: result.subrolls
        };
    }

    console.warn(`Subtable "${tableName}" not found`);
    return {
        success: false,
        text: `[${tableName}]` // Return the original reference
    };
}
