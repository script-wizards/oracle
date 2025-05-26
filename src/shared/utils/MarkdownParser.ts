/**
 * Represents a parsed code block from markdown
 */
export interface ParsedCodeBlock {
    /** The raw content of the code block */
    content: string;
    /** The language specified in the code block (e.g., 'perchance') */
    language: string;
    /** Starting line number in the original markdown (1-indexed) */
    startLine: number;
    /** Ending line number in the original markdown (1-indexed) */
    endLine: number;
    /** Metadata about the code block */
    metadata: {
        /** Whether this appears to be valid Perchance content */
        isValidPerchance: boolean;
        /** Number of non-empty lines in the block */
        lineCount: number;
        /** Number of indented lines (potential list items) */
        indentedLineCount: number;
        /** Any validation errors found */
        errors: string[];
    };
}

/**
 * Extracts all code blocks from markdown content
 * @param markdownContent - The raw markdown content
 * @returns Array of parsed code blocks
 */
export function extractCodeBlocks(markdownContent: string): ParsedCodeBlock[] {
    const codeBlocks: ParsedCodeBlock[] = [];
    const lines = markdownContent.split('\n');

    let inCodeBlock = false;
    let currentBlock: {
        language: string;
        content: string[];
        startLine: number;
    } | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1; // 1-indexed

        // Check for code block start
        const codeBlockStart = line.match(/^```(\w+)?/);
        if (codeBlockStart && !inCodeBlock) {
            inCodeBlock = true;
            currentBlock = {
                language: codeBlockStart[1] || '',
                content: [],
                startLine: lineNumber
            };
            continue;
        }

        // Check for code block end
        if (line.match(/^```/) && inCodeBlock && currentBlock) {
            inCodeBlock = false;

            const content = currentBlock.content.join('\n');
            const validation = validateCodeBlock(content);

            codeBlocks.push({
                content,
                language: currentBlock.language,
                startLine: currentBlock.startLine,
                endLine: lineNumber,
                metadata: {
                    isValidPerchance: validation.isValid && currentBlock.language.toLowerCase() === 'perchance',
                    lineCount: currentBlock.content.filter(line => line.trim().length > 0).length,
                    indentedLineCount: currentBlock.content.filter(line => line.match(/^\s{2,}/)).length,
                    errors: validation.errors
                }
            });

            currentBlock = null;
            continue;
        }

        // Add line to current code block
        if (inCodeBlock && currentBlock) {
            currentBlock.content.push(line);
        }
    }

    // Handle unclosed code block
    if (inCodeBlock && currentBlock) {
        const content = currentBlock.content.join('\n');
        const validation = validateCodeBlock(content);

        codeBlocks.push({
            content,
            language: currentBlock.language,
            startLine: currentBlock.startLine,
            endLine: lines.length,
            metadata: {
                isValidPerchance: validation.isValid && currentBlock.language.toLowerCase() === 'perchance',
                lineCount: currentBlock.content.filter(line => line.trim().length > 0).length,
                indentedLineCount: currentBlock.content.filter(line => line.match(/^\s{2,}/)).length,
                errors: [...validation.errors, 'Code block not properly closed']
            }
        });
    }

    return codeBlocks;
}

/**
 * Validates if a code block contains valid Perchance-style content
 * @param content - The code block content to validate
 * @returns Validation result with errors
 */
export function validateCodeBlock(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = content.split('\n');

    // Check for empty content
    if (content.trim().length === 0) {
        errors.push('Code block is empty');
        return { isValid: false, errors };
    }

    // Check for at least one non-empty line
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    if (nonEmptyLines.length === 0) {
        errors.push('No non-empty lines found');
        return { isValid: false, errors };
    }

    // Check for indented list structure (Perchance style)
    const indentedLines = lines.filter(line => line.match(/^\s{2,}\S/));
    if (indentedLines.length === 0) {
        errors.push('No indented list items found (expected Perchance-style indented entries)');
    }

    // Check for potential Perchance syntax patterns
    const hasPerchancePatterns = content.match(/^\s{2,}[^\s]/m) || // Indented entries
        content.match(/\[.*\]/) ||          // Brackets (weights/references)
        content.match(/\{.*\}/) ||          // Curly braces (variables)
        content.match(/^\s*\w+\s*$/m);      // Simple word entries

    if (!hasPerchancePatterns) {
        errors.push('Content does not appear to follow Perchance syntax patterns');
    }

    // Validate indentation consistency
    const indentationLevels = indentedLines.map(line => {
        const match = line.match(/^(\s+)/);
        return match ? match[1].length : 0;
    });

    const uniqueIndentations = [...new Set(indentationLevels)];
    if (uniqueIndentations.length > 3) {
        errors.push('Inconsistent indentation levels detected (too many different levels)');
    }

    // Check for common Perchance list patterns
    const hasListItems = lines.some(line => line.match(/^\s{2,}[a-zA-Z0-9]/));
    if (!hasListItems) {
        errors.push('No valid list items found');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Filters code blocks to only include Perchance blocks
 * @param codeBlocks - Array of parsed code blocks
 * @returns Array of only Perchance code blocks
 */
export function filterPerchanceBlocks(codeBlocks: ParsedCodeBlock[]): ParsedCodeBlock[] {
    return codeBlocks.filter(block =>
        block.language.toLowerCase() === 'perchance' ||
        block.metadata.isValidPerchance
    );
}

/**
 * Gets statistics about code blocks in markdown content
 * @param markdownContent - The raw markdown content
 * @returns Statistics object
 */
export function getCodeBlockStats(markdownContent: string): {
    totalBlocks: number;
    perchanceBlocks: number;
    validPerchanceBlocks: number;
    invalidBlocks: number;
    languages: string[];
} {
    const blocks = extractCodeBlocks(markdownContent);
    const perchanceBlocks = filterPerchanceBlocks(blocks);
    const validPerchanceBlocks = perchanceBlocks.filter(block => block.metadata.isValidPerchance);

    const languages = [...new Set(blocks.map(block => block.language).filter(lang => lang.length > 0))];

    return {
        totalBlocks: blocks.length,
        perchanceBlocks: perchanceBlocks.length,
        validPerchanceBlocks: validPerchanceBlocks.length,
        invalidBlocks: blocks.filter(block => block.metadata.errors.length > 0).length,
        languages
    };
}
