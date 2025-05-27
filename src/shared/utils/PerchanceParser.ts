import { Table, TableSection } from '../types';

/**
 * Represents a parsed Perchance table section
 */
export interface ParsedTableSection {
    /** The name/identifier of the table section */
    name: string;
    /** The entries in this table section */
    entries: string[];
    /** Starting line number in the code block */
    startLine: number;
    /** Ending line number in the code block */
    endLine: number;
}

/**
 * Result of parsing a Perchance code block
 */
export interface PerchanceParseResult {
    /** The main title of the table (if found) */
    title?: string;
    /** All table sections found in the code block */
    sections: ParsedTableSection[];
    /** Array of subtable references found */
    subtableReferences: string[];
    /** Any validation errors */
    errors: string[];
    /** Whether the parse was successful */
    isValid: boolean;
}

/**
 * Parses a Perchance code block string into a Table object
 * @param codeBlockContent - The raw content of the Perchance code block
 * @param filePath - The file path where this code block was found
 * @param codeBlockIndex - The index of this code block within the file
 * @returns Parsed Table object or null if parsing failed
 */
export function parsePerchanceTable(
    codeBlockContent: string,
    filePath: string,
    codeBlockIndex: number
): Table | null {
    const parseResult = parsePerchanceContent(codeBlockContent);

    if (!parseResult.isValid || parseResult.sections.length === 0) {
        console.warn(`Failed to parse Perchance block ${codeBlockIndex + 1} from ${filePath}: ${parseResult.errors.join(', ')}`);
        return null;
    }

    // Find the main table section (usually the first one or one matching the title)
    let mainSection = parseResult.sections[0];

    // If we have a title, try to find a section that matches or is the main content
    if (parseResult.title) {
        const titleBasedSection = parseResult.sections.find(section =>
            section.name.toLowerCase().includes(parseResult.title!.toLowerCase().replace(/\s+/g, '-'))
        );
        if (titleBasedSection) {
            mainSection = titleBasedSection;
        }
    }

    // Generate a unique ID for the table
    const tableId = `${filePath.replace(/[^a-zA-Z0-9]/g, '-')}-${codeBlockIndex}-${mainSection.name}`;

    // Convert ParsedTableSection[] to TableSection[]
    const tableSections: TableSection[] = parseResult.sections.map(section => ({
        name: section.name,
        entries: section.entries
    }));

    const table = {
        id: tableId,
        title: parseResult.title || mainSection.name,
        entries: mainSection.entries, // Keep for backward compatibility
        sections: tableSections, // Store all sections
        subtables: parseResult.subtableReferences,
        filePath,
        codeBlockIndex,
        errors: parseResult.errors.length > 0 ? parseResult.errors : undefined
    };

    return table;
}

/**
 * Removes comments from a line (anything after and including //)
 * @param line - The line to process
 * @returns The line with comments removed
 */
function removeComments(line: string): string {
    const commentIndex = line.indexOf('//');
    if (commentIndex !== -1) {
        return line.substring(0, commentIndex);
    }
    return line;
}

/**
 * Parses the content of a Perchance code block
 * @param content - The raw content to parse
 * @returns Detailed parse result
 */
export function parsePerchanceContent(content: string): PerchanceParseResult {
    // Normalize line endings - handle both Windows (\r\n) and Unix (\n)
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedContent.split('\n');
    const sections: ParsedTableSection[] = [];
    const errors: string[] = [];
    let title: string | undefined;

    let currentSection: ParsedTableSection | null = null;
    let lineIndex = 0;
    let expectingTitle = false;

    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = removeComments(rawLine);
        const trimmedLine = line.trim();
        lineIndex = i + 1;

        // Skip empty lines (including lines that are only comments)
        if (trimmedLine === '') {
            continue;
        }

        // Check if this is an indented entry (2+ spaces)
        const indentMatch = line.match(/^(\s{2,})(.+)$/);

        if (indentMatch) {
            const entry = indentMatch[2].trim();

            if (expectingTitle && !title) {
                // This is the title content
                title = entry;
                expectingTitle = false;
                continue;
            }

            if (currentSection) {
                currentSection.entries.push(entry);
                currentSection.endLine = lineIndex;
            } else {
                console.warn(`Found indented entry "${entry}" without a table name at line ${lineIndex}`);
                errors.push(`Found indented entry "${entry}" without a table name at line ${lineIndex}`);
            }
            continue;
        }

        // Check if this is a table name (non-indented, non-empty line)
        if (trimmedLine && !line.startsWith(' ')) {
            // Save previous section if it exists
            if (currentSection) {
                sections.push(currentSection);
                currentSection = null;
            }

            // Check if this is a title declaration
            if (trimmedLine.toLowerCase() === 'title') {
                expectingTitle = true;
                continue;
            }

            // Check if this looks like a special Perchance keyword
            if (['output', 'import', 'plugin'].includes(trimmedLine.toLowerCase())) {
                // Start new section for special keywords
                currentSection = {
                    name: trimmedLine,
                    entries: [],
                    startLine: lineIndex,
                    endLine: lineIndex
                };
                continue;
            }

            // Check if this looks like a title (capitalized words)
            if (!title && trimmedLine.match(/^[A-Z][a-zA-Z\s]+$/)) {
                title = trimmedLine;
                continue;
            }

            // Start new section (this is a table name)
            currentSection = {
                name: trimmedLine,
                entries: [],
                startLine: lineIndex,
                endLine: lineIndex
            };
        }
    }

    // Add the last section if it exists
    if (currentSection) {
        sections.push(currentSection);
    }

    // Extract all subtable references
    const subtableReferences = extractSubtableReferences(sections);

    // Validate the structure - but be more lenient
    const validationErrors = validateTableStructure(sections, title);

    // Only add validation errors that are truly critical (prevent table from working)
    const criticalErrors = validationErrors.filter(error =>
        error.includes('No table sections found')
        // Removed "has no entries" from critical errors - empty sections are warnings, not blockers
    );
    errors.push(...criticalErrors);

    // Add non-critical errors as warnings (they don't prevent the table from being valid)
    const warnings = validationErrors.filter(error =>
        error.includes('has no entries') ||
        error.includes('contains spaces') ||
        error.includes('empty entries')
    );

    // Log warnings but don't add them to errors (which would make the table invalid)
    if (warnings.length > 0) {
        console.warn('Table validation warnings:', warnings);
    }

    const isValid = sections.length > 0 && sections.some(section => section.entries.length > 0); // At least one section with entries

    return {
        title,
        sections,
        subtableReferences,
        errors,
        isValid
    };
}

/**
 * Extracts subtable references from table entries
 * @param sections - Array of parsed table sections
 * @returns Array of unique subtable reference names
 */
export function extractSubtableReferences(sections: ParsedTableSection[]): string[] {
    const references = new Set<string>();

    for (const section of sections) {
        for (const entry of section.entries) {
            // Find all [subtable-name] patterns
            const matches = entry.match(/\[([^\]]+)\]/g);
            if (matches) {
                for (const match of matches) {
                    // Remove the brackets and add to references
                    const refName = match.slice(1, -1).trim();
                    if (refName) {
                        references.add(refName);
                    }
                }
            }
        }
    }

    return Array.from(references);
}

/**
 * Validates the structure of parsed Perchance tables
 * @param sections - Array of parsed table sections
 * @param title - The title of the table (if any)
 * @returns Array of validation error messages
 */
export function validateTableStructure(sections: ParsedTableSection[], title?: string): string[] {
    const errors: string[] = [];

    // Check if we have any sections
    if (sections.length === 0) {
        errors.push('No table sections found');
        return errors;
    }

    // Validate each section
    for (const section of sections) {
        // Check if section has a name
        if (!section.name || section.name.trim() === '') {
            errors.push('Found section without a name');
            continue;
        }

        // Check if section has entries
        if (section.entries.length === 0) {
            errors.push(`Section "${section.name}" has no entries`);
            continue;
        }

        // Validate section name format
        if (section.name.includes(' ') && section.name !== title) {
            errors.push(`Section name "${section.name}" contains spaces (should use hyphens for table names)`);
        }

        // Check for empty entries
        const emptyEntries = section.entries.filter(entry => !entry.trim());
        if (emptyEntries.length > 0) {
            errors.push(`Section "${section.name}" contains ${emptyEntries.length} empty entries`);
        }
    }

    // Check for circular references
    const circularRefs = findCircularReferences(sections);
    if (circularRefs.length > 0) {
        errors.push(`Circular references detected: ${circularRefs.join(', ')}`);
    }

    return errors;
}

/**
 * Finds circular references between table sections
 * @param sections - Array of parsed table sections
 * @returns Array of section names involved in circular references
 */
function findCircularReferences(sections: ParsedTableSection[]): string[] {
    const sectionNames = new Set(sections.map(s => s.name));
    const circularRefs: string[] = [];

    for (const section of sections) {
        const visited = new Set<string>();
        const stack = new Set<string>();

        if (hasCircularReference(section.name, sections, sectionNames, visited, stack)) {
            circularRefs.push(section.name);
        }
    }

    return [...new Set(circularRefs)];
}

/**
 * Helper function to detect circular references using DFS
 */
function hasCircularReference(
    sectionName: string,
    sections: ParsedTableSection[],
    sectionNames: Set<string>,
    visited: Set<string>,
    stack: Set<string>
): boolean {
    if (stack.has(sectionName)) {
        return true; // Circular reference found
    }

    if (visited.has(sectionName)) {
        return false; // Already processed
    }

    visited.add(sectionName);
    stack.add(sectionName);

    // Find the section
    const section = sections.find(s => s.name === sectionName);
    if (!section) {
        stack.delete(sectionName);
        return false;
    }

    // Check all references in this section
    const references = extractSubtableReferences([section]);
    for (const ref of references) {
        if (sectionNames.has(ref)) {
            if (hasCircularReference(ref, sections, sectionNames, visited, stack)) {
                stack.delete(sectionName);
                return true;
            }
        }
    }

    stack.delete(sectionName);
    return false;
}

/**
 * Parses multiple Perchance code blocks and returns an array of Table objects
 * @param codeBlocks - Array of code block contents
 * @param filePath - The file path where these code blocks were found
 * @returns Array of parsed Table objects
 */
export function parseMultiplePerchanceTables(
    codeBlocks: string[],
    filePath: string
): Table[] {
    const tables: Table[] = [];

    for (let i = 0; i < codeBlocks.length; i++) {
        const table = parsePerchanceTable(codeBlocks[i], filePath, i);
        if (table) {
            tables.push(table);
        }
    }

    return tables;
}

/**
 * Utility function to clean and normalize Perchance table names
 * @param name - The raw table name
 * @returns Cleaned table name suitable for references
 */
export function normalizeTableName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '');
}
