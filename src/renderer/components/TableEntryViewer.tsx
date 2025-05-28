import React, { useState } from 'react';
import { Table, TableSection, RollResult, SubrollData } from '../../shared/types';
import './TableEntryViewer.css';

interface TableEntryViewerProps {
  table: Table;
  searchQuery?: string;
  rollResult?: RollResult;
  onForceEntry?: (sectionName: string, entryIndex: number) => void;
  onRollSection?: (sectionName: string) => void;
}

interface SectionViewState {
  [sectionName: string]: boolean;
}

// Helper functions extracted for better organization
const getSectionSubrolls = (rollResult: RollResult | undefined, sectionName: string): SubrollData[] => {
  if (!rollResult) return [];
  
  return rollResult.subrolls.filter(subroll => 
    subroll.source === sectionName && 
    subroll.type === 'subtable'
  );
};

const getEntryRollCount = (rollResult: RollResult | undefined, table: Table, sectionName: string, entryIndex: number): number => {
  const sectionSubrolls = getSectionSubrolls(rollResult, sectionName);
  
  if (sectionSubrolls.length === 0) return 0;
  
  // Count how many subrolls match this entry
  return sectionSubrolls.filter(sectionSubroll => {
    // If we have the entry index, use that for exact matching
    if (sectionSubroll.entryIndex !== undefined) {
      return entryIndex === sectionSubroll.entryIndex;
    }
    
    // Fallback: compare against the original entry text
    const section = table.sections?.find(s => s.name.toLowerCase() === sectionName.toLowerCase());
    if (!section) return false;
    
    const entryToMatch = sectionSubroll.originalEntry || sectionSubroll.text;
    return section.entries[entryIndex] === entryToMatch;
  }).length;
};

const canForceEntrySelection = (rollResult: RollResult | undefined, sectionName: string): boolean => {
  const matchingSubrolls = getSectionSubrolls(rollResult, sectionName);
  
  // If the section is referenced multiple times, disable forcing to avoid ambiguity
  // The user can still click on individual subrolls in the result text
  if (matchingSubrolls.length > 1) {
    return false;
  }
  
  // Also check if this section has nested subrolls that would create ambiguity
  if (matchingSubrolls.length === 1) {
    const mainSubroll = matchingSubrolls[0];
    // If this subroll has nested refs, it means there are child subrolls
    // In this case, disable forcing to avoid confusion about which part to reroll
    if (mainSubroll.hasNestedRefs) {
      return false;
    }
  }
  
  return matchingSubrolls.length === 1;
};

const shouldAutoExpandSection = (section: TableSection, table: Table): boolean => {
  // Auto-expand the first section (prefer "output" if it exists, otherwise the first section)
  const sections = table.sections || [];
  const outputSection = sections.find(s => s.name.toLowerCase() === 'output');
  const firstSection = outputSection || sections[0];
  
  const isFirstSection = firstSection && section.name.toLowerCase() === firstSection.name.toLowerCase();
  
  return isFirstSection || section.entries.length <= 3;
};

const TableEntryViewer: React.FC<TableEntryViewerProps> = ({ 
  table, 
  searchQuery = '',
  rollResult,
  onForceEntry,
  onRollSection
}) => {
  const [expandedSections, setExpandedSections] = useState<SectionViewState>(() => {
    // Auto-expand output section and sections with few entries
    const initialState: SectionViewState = {};
    if (table.sections) {
      table.sections.forEach(section => {
        initialState[section.name] = shouldAutoExpandSection(section, table);
      });
    }
    return initialState;
  });

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Helper function to check if an entry was rolled
  const isEntryRolled = (sectionName: string, entryIndex: number): boolean => {
    return getEntryRollCount(rollResult, table, sectionName, entryIndex) > 0;
  };

  // Helper function to get the rolled entry text for a section
  const getRolledEntryText = (sectionName: string): string | null => {
    const subrolls = getSectionSubrolls(rollResult, sectionName);
    
    // If multiple subrolls, return the first one's text (for section highlighting purposes)
    return subrolls.length > 0 ? subrolls[0].text : null;
  };

  // Helper function to check if a section was rolled (and thus allows forced entry selection)
  const wasSectionRolled = (sectionName: string): boolean => {
    return canForceEntrySelection(rollResult, sectionName);
  };

  // Handle clicking on an entry to force it
  const handleEntryClick = (sectionName: string, entryIndex: number) => {
    if (onForceEntry && wasSectionRolled(sectionName)) {
      onForceEntry(sectionName, entryIndex);
    }
  };

  const highlightSearchTerm = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="entry-search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Helper function to check if a section matches the search query
  const sectionMatchesSearch = (section: TableSection, query: string): boolean => {
    if (!query.trim()) return true; // Show all sections when no search query
    
    const searchLower = query.toLowerCase();
    
    // Check section name (fuzzy matching - split query into words)
    const queryWords = searchLower.split(/\s+/).filter(word => word.length > 0);
    const sectionNameLower = section.name.toLowerCase();
    
    // Section matches if all query words are found in section name
    const sectionNameMatches = queryWords.every(word => sectionNameLower.includes(word));
    if (sectionNameMatches) {
      return true;
    }
    
    // Check if any entry contains all the search terms (fuzzy matching)
    return section.entries.some(entry => {
      const entryLower = entry.toLowerCase();
      return queryWords.every(word => entryLower.includes(word));
    });
  };

  const formatEntry = (entry: string): React.ReactNode => {
    // Highlight subtable references in brackets
    const bracketRegex = /\[([^\]]+)\]/g;
    const parts = entry.split(bracketRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is inside brackets - it's a subtable reference
        const isValidSubtable = table.subtables.includes(part);
        return (
          <span 
            key={index} 
            className={`subtable-reference ${isValidSubtable ? 'valid clickable' : 'invalid'}`}
            title={isValidSubtable ? `Click to toggle ${part} section` : `Unknown subtable: ${part}`}
            onClick={isValidSubtable ? (e) => {
              e.stopPropagation();
              toggleSection(part);
            } : undefined}
          >
            [{highlightSearchTerm(part, searchQuery)}]
          </span>
        );
      } else {
        // Regular text
        return highlightSearchTerm(part, searchQuery);
      }
    });
  };

  if (!table.sections || table.sections.length === 0) {
    return (
      <div className="table-entry-viewer">
        <div className="no-sections-message">
          <i className="fas fa-exclamation-triangle"></i>
          <span>No structured sections found in this table</span>
        </div>
      </div>
    );
  }

  // Filter sections based on search query, preserving original order
  const sectionsToRender = (table.sections || []).filter(section => 
    sectionMatchesSearch(section, searchQuery || '')
  );

  return (
    <div className="table-entry-viewer">
      <div className="table-structure">
        {sectionsToRender.map((section) => {
          const isExpanded = expandedSections[section.name];
          const rolledEntryText = getRolledEntryText(section.name);
          const hasRolledEntry = !!rolledEntryText;
          
          return (
            <div key={section.name} className={`section-container ${hasRolledEntry ? 'has-rolled-entry' : ''}`}>
              <div 
                className="section-header"
                onClick={() => toggleSection(section.name)}
                title={`${isExpanded ? 'Collapse' : 'Expand'} ${section.name} section`}
              >
                <div 
                  className={`section-info ${onRollSection ? 'rollable-section' : ''}`}
                  onClick={onRollSection ? (e) => {
                    e.stopPropagation();
                    onRollSection(section.name);
                  } : undefined}
                  title={onRollSection ? `Click to roll from ${section.name} section` : undefined}
                >
                  <span className="section-name">
                    {highlightSearchTerm(section.name, searchQuery)}
                  </span>
                  <span className="section-count">
                    {section.entries.length} {section.entries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div 
                  className="section-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection(section.name);
                  }}
                  title={`${isExpanded ? 'Collapse' : 'Expand'} ${section.name} section`}
                >
                  <i className={`fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
                </div>
              </div>
              
              {isExpanded && (
                <div className="section-entries">
                  {section.entries.map((entry, entryIndex) => {
                    const rollCount = getEntryRollCount(rollResult, table, section.name, entryIndex);
                    const isRolled = rollCount > 0;
                    const sectionWasRolled = wasSectionRolled(section.name);
                    const isClickable = sectionWasRolled && onForceEntry;
                    
                    return (
                      <div 
                        key={entryIndex} 
                        className={`entry-item ${isRolled ? 'rolled-entry' : ''} ${isClickable ? 'clickable-entry' : ''}`}
                        onClick={isClickable ? () => handleEntryClick(section.name, entryIndex) : undefined}
                        title={isClickable ? 'Click to force this entry to be rolled' : undefined}
                        style={rollCount > 1 ? { 
                          boxShadow: `0 0 0 2px var(--accent-color), 0 0 0 4px var(--accent-color-alpha)`,
                          borderRadius: '4px'
                        } : undefined}
                      >
                        <div className="entry-bullet">
                          •
                        </div>
                        <div className="entry-text">
                          {formatEntry(entry)}
                          {rollCount > 1 && (
                            <span className="roll-count-indicator" title={`Selected ${rollCount} times`}>
                              ×{rollCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {table.errors && table.errors.length > 0 && (
        <div className="table-errors">
          <div className="errors-header">
            <i className="fas fa-exclamation-triangle"></i>
            <span>Parsing Errors</span>
          </div>
          <ul className="error-list">
            {table.errors.map((error, index) => (
              <li key={index} className="error-item">{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TableEntryViewer; 
