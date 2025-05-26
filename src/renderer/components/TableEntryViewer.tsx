import React, { useState } from 'react';
import { Table, TableSection, RollResult, SubrollData } from '../../shared/types';
import './TableEntryViewer.css';

interface TableEntryViewerProps {
  table: Table;
  searchQuery?: string;
  rollResult?: RollResult;
}

interface SectionViewState {
  [sectionName: string]: boolean;
}

const TableEntryViewer: React.FC<TableEntryViewerProps> = ({ 
  table, 
  searchQuery = '',
  rollResult
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
    
    // Check if this entry was part of the main roll (output section)
    if (sectionName.toLowerCase() === 'output') {
      // For output section, check if this entry index matches any subroll that came from this table
      return rollResult.subrolls.some(subroll => 
        subroll.source === table.title && 
        subroll.type === 'subtable'
      );
    }
    
    // For other sections, check if this section was rolled and this entry was selected
    return rollResult.subrolls.some(subroll => 
      subroll.source === sectionName && 
      subroll.type === 'subtable'
    );
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

  // Sort sections to show output first, then others
  const sortedSections = [...table.sections].sort((a, b) => {
    if (a.name.toLowerCase() === 'output') return -1;
    if (b.name.toLowerCase() === 'output') return 1;
    if (a.name.toLowerCase() === 'title') return -1;
    if (b.name.toLowerCase() === 'title') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="table-entry-viewer">
      <div className="table-structure">
        {sortedSections.map((section) => {
          const isExpanded = expandedSections[section.name];
          const rolledEntryText = getRolledEntryText(section.name);
          const hasRolledEntry = !!rolledEntryText;
          
          return (
            <div key={section.name} className={`section-container ${hasRolledEntry ? 'has-rolled-entry' : ''}`}>
              <div 
                className="section-header"
                onClick={() => toggleSection(section.name)}
              >
                <div className="section-info">
                  <span className="section-name">
                    {highlightSearchTerm(section.name, searchQuery)}
                  </span>
                  <span className="section-count">
                    {section.entries.length} {section.entries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div className="section-toggle">
                  <i className={`fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
                </div>
              </div>
              
              {isExpanded && (
                <div className="section-entries">
                  {section.entries.map((entry, entryIndex) => {
                    const isRolled = rolledEntryText === entry;
                    
                    return (
                      <div key={entryIndex} className={`entry-item ${isRolled ? 'rolled-entry' : ''}`}>
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
