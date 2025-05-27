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
        initialState[section.name] = 
          section.name.toLowerCase() === 'output' || 
          section.entries.length <= 3;
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
    if (!rollResult) return false;
    
    // Find the subroll for this section
    const sectionSubroll = rollResult.subrolls.find(subroll => 
      subroll.source === sectionName && 
      subroll.type === 'subtable'
    );
    
    if (!sectionSubroll) return false;
    
    // If we have the entry index, use that for exact matching
    if (sectionSubroll.entryIndex !== undefined) {
      return entryIndex === sectionSubroll.entryIndex;
    }
    
    // Fallback: compare against the original entry text
    const section = table.sections?.find(s => s.name.toLowerCase() === sectionName.toLowerCase());
    if (!section) return false;
    
    const entryToMatch = sectionSubroll.originalEntry || sectionSubroll.text;
    return section.entries[entryIndex] === entryToMatch;
  };

  // Helper function to get the rolled entry text for a section
  const getRolledEntryText = (sectionName: string): string | null => {
    if (!rollResult) return null;
    
    const subroll = rollResult.subrolls.find(subroll => 
      subroll.source === sectionName && 
      subroll.type === 'subtable'
    );
    
    return subroll ? subroll.text : null;
  };

  // Helper function to check if a section was rolled (and thus allows forced entry selection)
  const wasSectionRolled = (sectionName: string): boolean => {
    if (!rollResult) return false;
    
    return rollResult.subrolls.some(subroll => 
      subroll.source === sectionName && 
      subroll.type === 'subtable'
    );
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
                    const isRolled = isEntryRolled(section.name, entryIndex);
                    const sectionWasRolled = wasSectionRolled(section.name);
                    const isClickable = sectionWasRolled && onForceEntry;
                    
                    return (
                      <div 
                        key={entryIndex} 
                        className={`entry-item ${isRolled ? 'rolled-entry' : ''} ${isClickable ? 'clickable-entry' : ''}`}
                        onClick={isClickable ? () => handleEntryClick(section.name, entryIndex) : undefined}
                        title={isClickable ? 'Click to force this entry to be rolled' : undefined}
                      >
                        <div className="entry-bullet">
                          •
                        </div>
                        <div className="entry-text">
                          {formatEntry(entry)}
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
