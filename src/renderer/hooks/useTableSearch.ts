import { useState, useMemo } from 'react';
import Fuse, { FuseResult, IFuseOptions, FuseResultMatch } from 'fuse.js';
import { Table } from '../../shared/types';

interface UseTableSearchOptions {
    threshold?: number;
    includeScore?: boolean;
    minMatchCharLength?: number;
}

interface SearchResult {
    item: Table;
    score?: number;
    matches?: FuseResultMatch[];
}

export const useTableSearch = (
    tables: Table[],
    options: UseTableSearchOptions = {}
) => {
    const [searchQuery, setSearchQuery] = useState('');

    const fuseOptions: IFuseOptions<Table> = {
        // Fuzzy search configuration
        threshold: options.threshold ?? 0.4, // 0.0 = exact match, 1.0 = match anything
        includeScore: options.includeScore ?? true,
        includeMatches: true,
        minMatchCharLength: options.minMatchCharLength ?? 2,

        // Search in these fields
        keys: [
            {
                name: 'title',
                weight: 0.7 // Title matches are more important
            },
            {
                name: 'entries',
                weight: 0.15 // Legacy entry content matches
            },
            {
                // Search in section names
                name: 'sections.name',
                weight: 0.3 // Section names are important
            },
            {
                // Search in all section entries
                name: 'sections.entries',
                weight: 0.2 // Section entry content matches
            },
            {
                name: 'filePath',
                weight: 0.05 // File path matches are least important
            }
        ],

        // Advanced options
        ignoreLocation: true, // Don't care about position in string
        findAllMatches: true, // Find all matches, not just the first
        useExtendedSearch: false // Keep it simple for now
    };

    const fuse = useMemo(() => {
        return new Fuse(tables, fuseOptions);
    }, [tables]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) {
            // Return all tables when no search query
            return tables.map((table, index) => ({
                item: table,
                originalIndex: index
            }));
        }

        const results = fuse.search(searchQuery);
        return results.map((result, index) => ({
            item: result.item,
            score: result.score,
            matches: result.matches,
            originalIndex: tables.findIndex(t => t.id === result.item.id),
            searchIndex: index
        }));
    }, [fuse, searchQuery, tables]);

    const filteredTables = useMemo(() => {
        return searchResults.map(result => result.item);
    }, [searchResults]);

    return {
        searchQuery,
        setSearchQuery,
        filteredTables,
        searchResults,
        hasActiveSearch: searchQuery.trim().length > 0,
        resultCount: filteredTables.length
    };
};
