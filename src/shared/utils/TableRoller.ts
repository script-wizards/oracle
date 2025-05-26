import { Table, RollResult, SubrollData, TableSection, ForcedSelection } from '../types';

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
    const outputEntryIndex = Math.floor(Math.random() * outputSection.entries.length);
    const outputEntry = outputSection.entries[outputEntryIndex];

    // Resolve the output text using the sections from this table
    const result = resolveText(outputEntry, sections, tableMap, [], maxDepth);

    // Add a subroll to track which output entry was selected
    // This allows the table viewer to highlight the correct output entry
    const outputSubroll: SubrollData = {
        text: result.text,
        type: 'subtable',
        source: 'output',
        startIndex: 0,
        endIndex: result.text.length,
        originalEntry: outputEntry,
        entryIndex: outputEntryIndex
    };

    // Add the output subroll at the beginning so it encompasses the entire result
    result.subrolls.unshift(outputSubroll);

    return result;
}

/**
 * Rolls on a table with forced selections for specific sections
 * @param table - The main table to roll on
 * @param allTables - All available tables for subtable resolution
 * @param forcedSelections - Array of forced selections for specific sections
 * @param maxDepth - Maximum recursion depth to prevent infinite loops
 * @returns RollResult with resolved text and subroll information
 */
export function rollOnTableWithForcedSelections(
    table: Table,
    allTables: Table[],
    forcedSelections: ForcedSelection[],
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

    // Create a map of forced selections for quick lookup
    const forcedMap = new Map<string, number>();
    forcedSelections.forEach(selection => {
        forcedMap.set(selection.sectionName.toLowerCase(), selection.entryIndex);
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

    // Get output entry (forced or random)
    const forcedOutputIndex = forcedMap.get('output');
    const outputEntryIndex = forcedOutputIndex !== undefined ? forcedOutputIndex : Math.floor(Math.random() * outputSection.entries.length);
    const outputEntry = outputSection.entries[outputEntryIndex];

    // Resolve the output text using the sections from this table
    const result = resolveTextWithForcedSelections(outputEntry, sections, tableMap, [], forcedMap, maxDepth);

    // Add a subroll to track which output entry was selected
    // This allows the table viewer to highlight the correct output entry
    const outputSubroll: SubrollData = {
        text: result.text,
        type: 'subtable',
        source: 'output',
        startIndex: 0,
        endIndex: result.text.length,
        originalEntry: outputEntry,
        entryIndex: outputEntryIndex
    };

    // Add the output subroll at the beginning so it encompasses the entire result
    result.subrolls.unshift(outputSubroll);

    return result;
}

/**
 * Rolls on a specific section of a table
 * @param table - The main table to roll on
 * @param sectionName - The name of the section to roll from
 * @param allTables - All available tables for subtable resolution
 * @param maxDepth - Maximum recursion depth to prevent infinite loops
 * @returns RollResult with resolved text and subroll information
 */
export function rollOnTableSection(
    table: Table,
    sectionName: string,
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

    // Find the specified section
    const targetSection = sections.find(s => s.name.toLowerCase() === sectionName.toLowerCase());
    if (!targetSection || targetSection.entries.length === 0) {
        console.warn(`No section "${sectionName}" found in table "${table.title}"`);
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
            errors: [`No section "${sectionName}" found in table "${table.title}"`]
        };
    }

    // Get a random entry from the target section
    const entryIndex = Math.floor(Math.random() * targetSection.entries.length);
    const selectedEntry = targetSection.entries[entryIndex];

    // Resolve the selected entry using the sections from this table
    const result = resolveText(selectedEntry, sections, tableMap, [], maxDepth);

    // Add a subroll to track which entry was selected from the target section
    // Only add this if there are no nested subrolls to avoid duplication
    if (!result.subrolls || result.subrolls.length === 0) {
        const sectionSubroll: SubrollData = {
            text: result.text,
            type: 'subtable',
            source: sectionName,
            startIndex: 0,
            endIndex: result.text.length,
            originalEntry: selectedEntry,
            entryIndex: entryIndex
        };

        result.subrolls.unshift(sectionSubroll);
    } else {
        // If there are nested subrolls, add the section subroll as a parent
        const sectionSubroll: SubrollData = {
            text: selectedEntry, // Use original entry text, not resolved
            type: 'subtable',
            source: sectionName,
            startIndex: 0,
            endIndex: result.text.length,
            originalEntry: selectedEntry,
            entryIndex: entryIndex,
            hasNestedRefs: true
        };

        result.subrolls.unshift(sectionSubroll);
    }

    return result;
}

/**
 * Forces a specific subtable entry while preserving the rest of the current roll
 * @param originalResult - The current roll result to modify
 * @param sectionName - The section to force an entry in
 * @param entryIndex - The index of the entry to force
 * @param table - The main table
 * @param allTables - All available tables for subtable resolution
 * @param maxDepth - Maximum recursion depth
 * @returns New RollResult with the forced entry
 */
export function forceSubtableEntry(
    originalResult: RollResult,
    sectionName: string,
    entryIndex: number,
    table: Table,
    allTables: Table[],
    maxDepth: number = 10
): RollResult {
    // If forcing the output section, use the full forced rolling
    if (sectionName.toLowerCase() === 'output') {
        const forcedSelections: ForcedSelection[] = [
            { sectionName, entryIndex }
        ];
        return rollOnTableWithForcedSelections(table, allTables, forcedSelections, maxDepth);
    }

    // For other sections, find the subroll for that section and replace it
    const targetSubrollIndex = originalResult.subrolls.findIndex(subroll => 
        subroll.source === sectionName && 
        subroll.type === 'subtable'
    );

    if (targetSubrollIndex === -1) {
        console.warn(`No subroll found for section: ${sectionName}`);
        return originalResult;
    }

    const targetSubroll = originalResult.subrolls[targetSubrollIndex];
    
    // Get the table sections
    const sections = table.sections || reconstructTableSections(table);
    
    // Create a map of table names to tables for quick lookup
    const tableMap = new Map<string, Table>();
    allTables.forEach(t => {
        tableMap.set(t.title.toLowerCase(), t);
        tableMap.set(t.id, t);
    });

    // Find the section and get the forced entry
    const section = sections.find(s => s.name.toLowerCase() === sectionName.toLowerCase());
    if (!section || entryIndex >= section.entries.length) {
        console.warn(`Invalid section or entry index: ${sectionName}[${entryIndex}]`);
        return originalResult;
    }

    const forcedEntry = section.entries[entryIndex];
    
    // Resolve the forced entry
    const forcedMap = new Map<string, number>();
    forcedMap.set(sectionName.toLowerCase(), entryIndex);
    
    const resolved = resolveTextWithForcedSelections(forcedEntry, sections, tableMap, [], forcedMap, maxDepth, 0);

    // Calculate the new text by replacing the target subroll's text
    const newText = originalResult.text.substring(0, targetSubroll.startIndex) +
        resolved.text +
        originalResult.text.substring(targetSubroll.endIndex);

    // Calculate the length difference
    const lengthDiff = resolved.text.length - targetSubroll.text.length;

    // Update all subrolls
    const newSubrolls: SubrollData[] = [];

    for (let i = 0; i < originalResult.subrolls.length; i++) {
        const subroll = originalResult.subrolls[i];

        if (i === targetSubrollIndex) {
            // Replace the target subroll with the new one
            const newSubroll: SubrollData = {
                text: resolved.text,
                type: 'subtable',
                source: sectionName,
                startIndex: subroll.startIndex,
                endIndex: subroll.startIndex + resolved.text.length,
                originalEntry: forcedEntry,
                entryIndex: entryIndex,
                hasNestedRefs: !!(resolved.subrolls && resolved.subrolls.length > 0)
            };
            newSubrolls.push(newSubroll);

            // Add any nested subrolls from the forced resolution
            if (resolved.subrolls) {
                const adjustedNestedSubrolls = resolved.subrolls.map((nestedSubroll: SubrollData) => ({
                    ...nestedSubroll,
                    startIndex: subroll.startIndex + nestedSubroll.startIndex,
                    endIndex: subroll.startIndex + nestedSubroll.endIndex
                }));
                newSubrolls.push(...adjustedNestedSubrolls);
            }
        } else if (subroll.startIndex >= targetSubroll.endIndex) {
            // Adjust positions for subrolls that come after the replaced one
            newSubrolls.push({
                ...subroll,
                startIndex: subroll.startIndex + lengthDiff,
                endIndex: subroll.endIndex + lengthDiff
            });
        } else if (subroll.endIndex <= targetSubroll.startIndex) {
            // Keep subrolls before the replaced one unchanged
            newSubrolls.push(subroll);
        } else {
            // This subroll overlaps with the target - remove overlapping ones
            // This handles nested subrolls that were part of the original resolution
            if (subroll.startIndex >= targetSubroll.startIndex && subroll.endIndex <= targetSubroll.endIndex) {
                // This subroll was nested within the target - remove it
                continue;
            } else {
                // Keep non-overlapping subrolls
                newSubrolls.push(subroll);
            }
        }
    }

    return {
        text: newText,
        subrolls: newSubrolls,
        errors: originalResult.errors
    };
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
 * Resolves text by replacing subtable references with rolled results, using forced selections when available
 */
function resolveTextWithForcedSelections(
    text: string,
    sections: TableSection[],
    tableMap: Map<string, Table>,
    subrolls: SubrollData[],
    forcedMap: Map<string, number>,
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
    const newSubrolls: SubrollData[] = [...subrolls];

    // Find all subtable references in the format [tableName]
    const subtableRegex = /\[([^\]]+)\]/g;
    const matches: Array<{
        fullMatch: string;
        tableName: string;
        startIndex: number;
        endIndex: number;
    }> = [];

    let match;
    while ((match = subtableRegex.exec(text)) !== null) {
        matches.push({
            fullMatch: match[0], // e.g., "[encounter]"
            tableName: match[1], // e.g., "encounter"
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }

    // Process matches in reverse order to maintain correct positions
    for (let i = matches.length - 1; i >= 0; i--) {
        const matchInfo = matches[i];

        // Try to resolve this subtable reference with forced selection
        const subtableResult = resolveSubtableWithForcedSelection(
            matchInfo.tableName,
            sections,
            tableMap,
            forcedMap,
            maxDepth,
            depth + 1
        );

        if (subtableResult.success) {
            // Replace the reference with the resolved text
            const beforeText = resolvedText.substring(0, matchInfo.startIndex);
            const afterText = resolvedText.substring(matchInfo.endIndex);
            resolvedText = beforeText + subtableResult.text + afterText;

            // Calculate the length difference for this replacement
            const lengthDiff = subtableResult.text.length - matchInfo.fullMatch.length;

            // Update positions of existing subrolls that come after this replacement
            for (let j = 0; j < newSubrolls.length; j++) {
                const existingSubroll = newSubrolls[j];
                if (existingSubroll.startIndex >= matchInfo.endIndex) {
                    existingSubroll.startIndex += lengthDiff;
                    existingSubroll.endIndex += lengthDiff;
                }
            }

            // Add subroll information with correct positions in the final text
            // Always create a subroll for this subtable to enable proper highlighting
            const mainSubroll: SubrollData = {
                text: subtableResult.text,
                type: 'subtable',
                source: matchInfo.tableName,
                startIndex: matchInfo.startIndex,
                endIndex: matchInfo.startIndex + subtableResult.text.length,
                originalEntry: subtableResult.originalEntry,
                entryIndex: subtableResult.entryIndex,
                hasNestedRefs: !!(subtableResult.subrolls && subtableResult.subrolls.length > 0)
            };

            // Add the main subroll to the list
            newSubrolls.push(mainSubroll);

            // Add any nested subrolls (adjust their positions relative to the main subroll)
            if (subtableResult.subrolls) {
                const adjustedNestedSubrolls = subtableResult.subrolls.map((nestedSubroll: SubrollData) => ({
                    ...nestedSubroll,
                    startIndex: matchInfo.startIndex + nestedSubroll.startIndex,
                    endIndex: matchInfo.startIndex + nestedSubroll.endIndex
                }));

                // Add nested subrolls
                newSubrolls.push(...adjustedNestedSubrolls);
            }
        } else {
            console.warn(`Failed to resolve subtable: "${matchInfo.tableName}"`);
            errors.push(`Could not resolve subtable reference: [${matchInfo.tableName}]`);
        }
    }

    // Sort subrolls by start position to ensure correct order
    newSubrolls.sort((a, b) => a.startIndex - b.startIndex);

    return {
        text: resolvedText,
        subrolls: newSubrolls,
        errors: errors.length > 0 ? errors : undefined
    };
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
    const newSubrolls: SubrollData[] = [...subrolls];

    // Find all subtable references in the format [tableName]
    const subtableRegex = /\[([^\]]+)\]/g;
    const matches: Array<{
        fullMatch: string;
        tableName: string;
        startIndex: number;
        endIndex: number;
    }> = [];

    let match;
    while ((match = subtableRegex.exec(text)) !== null) {
        matches.push({
            fullMatch: match[0], // e.g., "[encounter]"
            tableName: match[1], // e.g., "encounter"
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }

    // Process matches in reverse order to maintain correct positions
    for (let i = matches.length - 1; i >= 0; i--) {
        const matchInfo = matches[i];

        // Try to resolve this subtable reference
        const subtableResult = resolveSubtable(
            matchInfo.tableName,
            sections,
            tableMap,
            maxDepth,
            depth + 1
        );

        if (subtableResult.success) {
            // Replace the reference with the resolved text
            const beforeText = resolvedText.substring(0, matchInfo.startIndex);
            const afterText = resolvedText.substring(matchInfo.endIndex);
            resolvedText = beforeText + subtableResult.text + afterText;

            // Calculate the length difference for this replacement
            const lengthDiff = subtableResult.text.length - matchInfo.fullMatch.length;

            // Update positions of existing subrolls that come after this replacement
            for (let j = 0; j < newSubrolls.length; j++) {
                const existingSubroll = newSubrolls[j];
                if (existingSubroll.startIndex >= matchInfo.endIndex) {
                    existingSubroll.startIndex += lengthDiff;
                    existingSubroll.endIndex += lengthDiff;
                }
            }

            // Add subroll information with correct positions in the final text
            // Always create a subroll for this subtable to enable proper highlighting
            const mainSubroll: SubrollData = {
                text: subtableResult.text,
                type: 'subtable',
                source: matchInfo.tableName,
                startIndex: matchInfo.startIndex,
                endIndex: matchInfo.startIndex + subtableResult.text.length,
                originalEntry: subtableResult.originalEntry,
                entryIndex: subtableResult.entryIndex,
                hasNestedRefs: !!(subtableResult.subrolls && subtableResult.subrolls.length > 0)
            };

            // Add the main subroll to the list
            newSubrolls.push(mainSubroll);

            // Add any nested subrolls (adjust their positions relative to the main subroll)
            if (subtableResult.subrolls) {
                const adjustedNestedSubrolls = subtableResult.subrolls.map(nestedSubroll => ({
                    ...nestedSubroll,
                    startIndex: matchInfo.startIndex + nestedSubroll.startIndex,
                    endIndex: matchInfo.startIndex + nestedSubroll.endIndex
                }));

                // Add nested subrolls
                newSubrolls.push(...adjustedNestedSubrolls);
            }
        } else {
            console.warn(`Failed to resolve subtable: "${matchInfo.tableName}"`);
            errors.push(`Could not resolve subtable reference: [${matchInfo.tableName}]`);
        }
    }

    // Sort subrolls by start position to ensure correct order
    newSubrolls.sort((a, b) => a.startIndex - b.startIndex);

    return {
        text: resolvedText,
        subrolls: newSubrolls,
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
): { success: boolean; text: string; subrolls?: SubrollData[]; originalEntry?: string; entryIndex?: number } {
    // First, try to find the subtable within the current table's sections
    const localSection = sections.find(s => s.name.toLowerCase() === tableName.toLowerCase());
    if (localSection && localSection.entries.length > 0) {
        const randomEntryIndex = Math.floor(Math.random() * localSection.entries.length);
        const randomEntry = localSection.entries[randomEntryIndex];

        // Recursively resolve this entry in case it has more references
        const resolved = resolveText(randomEntry, sections, tableMap, [], maxDepth, depth);
        return {
            success: true,
            text: resolved.text,
            subrolls: resolved.subrolls,
            originalEntry: randomEntry, // Store the original entry before resolution
            entryIndex: randomEntryIndex // Store the index of the selected entry
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

/**
 * Resolves a single subtable reference with forced selection support
 */
function resolveSubtableWithForcedSelection(
    tableName: string,
    sections: TableSection[],
    tableMap: Map<string, Table>,
    forcedMap: Map<string, number>,
    maxDepth: number,
    depth: number
): { success: boolean; text: string; subrolls?: SubrollData[]; originalEntry?: string; entryIndex?: number } {
    // First, try to find the subtable within the current table's sections
    const localSection = sections.find(s => s.name.toLowerCase() === tableName.toLowerCase());
    if (localSection && localSection.entries.length > 0) {
        // Check if we have a forced selection for this section
        const forcedIndex = forcedMap.get(tableName.toLowerCase());
        const entryIndex = forcedIndex !== undefined ? forcedIndex : Math.floor(Math.random() * localSection.entries.length);
        const selectedEntry = localSection.entries[entryIndex];

        // Recursively resolve this entry in case it has more references
        const resolved = resolveTextWithForcedSelections(selectedEntry, sections, tableMap, [], forcedMap, maxDepth, depth);
        return {
            success: true,
            text: resolved.text,
            subrolls: resolved.subrolls,
            originalEntry: selectedEntry, // Store the original entry before resolution
            entryIndex: entryIndex // Store the index of the selected entry
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

/**
 * Rerolls a specific subtable within an existing roll result
 * @param originalResult - The original roll result
 * @param subrollIndex - Index of the subroll to reroll
 * @param table - The main table that was rolled on
 * @param allTables - All available tables for subtable resolution
 * @param maxDepth - Maximum recursion depth
 * @returns New RollResult with the specified subtable rerolled
 */
export function rerollSubtable(
    originalResult: RollResult,
    subrollIndex: number,
    table: Table,
    allTables: Table[],
    maxDepth: number = 10
): RollResult {
    if (subrollIndex < 0 || subrollIndex >= originalResult.subrolls.length) {
        console.warn(`Invalid subroll index: ${subrollIndex}`);
        return originalResult;
    }

    const targetSubroll = originalResult.subrolls[subrollIndex];

    // Only reroll subtable types, not dice rolls
    if (targetSubroll.type !== 'subtable' || !targetSubroll.source) {
        console.warn(`Cannot reroll subroll at index ${subrollIndex}: not a subtable`);
        return originalResult;
    }

    // Create a map of table names to tables for quick lookup
    const tableMap = new Map<string, Table>();
    allTables.forEach(t => {
        tableMap.set(t.title.toLowerCase(), t);
        tableMap.set(t.id, t);
    });

    // Get the table sections
    const sections = table.sections || reconstructTableSections(table);

    // Reroll the specific subtable
    const newSubtableResult = resolveSubtable(
        targetSubroll.source,
        sections,
        tableMap,
        maxDepth,
        0
    );

    if (!newSubtableResult.success) {
        console.warn(`Failed to reroll subtable: ${targetSubroll.source}`);
        return originalResult;
    }

    // Rebuild the text by replacing the specific subtable result
    const newSubtableText = newSubtableResult.text;
    const oldText = originalResult.text;

    // Build new text by replacing the exact range
    const newText = oldText.substring(0, targetSubroll.startIndex) +
        newSubtableText +
        oldText.substring(targetSubroll.endIndex);

    // Calculate the length difference
    const lengthDiff = newSubtableText.length - targetSubroll.text.length;

    // Update all subrolls with corrected positions
    const newSubrolls: SubrollData[] = [];

    for (let i = 0; i < originalResult.subrolls.length; i++) {
        const subroll = originalResult.subrolls[i];

        if (i === subrollIndex) {
            // Update the target subroll with new text and correct end position
            newSubrolls.push({
                ...subroll,
                text: newSubtableText,
                endIndex: subroll.startIndex + newSubtableText.length
            });
        } else if (subroll.startIndex >= targetSubroll.endIndex) {
            // Adjust positions for subrolls that come after the rerolled one
            newSubrolls.push({
                ...subroll,
                startIndex: subroll.startIndex + lengthDiff,
                endIndex: subroll.endIndex + lengthDiff
            });
        } else if (subroll.endIndex <= targetSubroll.startIndex) {
            // Keep subrolls before the rerolled one unchanged
            newSubrolls.push(subroll);
        } else {
            // This subroll overlaps with the target - remove nested subrolls to prevent stacking
            // Only keep subrolls that are NOT completely contained within the target
            if (!(subroll.startIndex >= targetSubroll.startIndex && subroll.endIndex <= targetSubroll.endIndex)) {
                newSubrolls.push(subroll);
            }
            // If it's completely contained, skip it (it will be replaced by new nested subrolls)
        }
    }

    // Add any nested subrolls from the new subtable result
    if (newSubtableResult.subrolls) {
        const adjustedNestedSubrolls = newSubtableResult.subrolls.map(nestedSubroll => ({
            ...nestedSubroll,
            startIndex: targetSubroll.startIndex + nestedSubroll.startIndex,
            endIndex: targetSubroll.startIndex + nestedSubroll.endIndex
        }));

        // Insert nested subrolls in the correct position (after the parent subroll)
        newSubrolls.splice(subrollIndex + 1, 0, ...adjustedNestedSubrolls);
    }

    return {
        text: newText,
        subrolls: newSubrolls,
        errors: originalResult.errors
    };
}
