import React, { useState, useEffect } from 'react';
import { Table, RollResult, ForcedSelection } from '../../shared/types';
import { rollOnTable, rerollSubtable, rollOnTableWithForcedSelections, forceSubtableEntry, rollOnTableSection } from '../../shared/utils/TableRoller';
import InteractiveRollResult from './InteractiveRollResult';
import TableEntryViewer from './TableEntryViewer';
import { DraggableWindow } from './DraggableWindow';
import './TableWindow.css';
import { useTranslations } from '../i18n';

interface TableWindowProps {
  table: Table;
  allTables: Table[];
  position: { x: number; y: number };
  size: { width: number; height: number };
  onClose: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  onBringToFront?: () => void;
  zIndex?: number;
  onHistoryBringToFront?: () => number; // Returns the z-index for history popup
}

export const TableWindow: React.FC<TableWindowProps> = ({
  table,
  allTables,
  position,
  size,
  onClose,
  onPositionChange,
  onSizeChange,
  onBringToFront,
  zIndex = 5,
  onHistoryBringToFront
}) => {
  // Per-table state
  const [currentResult, setCurrentResult] = useState<RollResult | null>(null);
  const [rollHistory, setRollHistory] = useState<Array<{
    result: RollResult;
    timestamp: Date;
  }>>([]);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [historyPopupZIndex, setHistoryPopupZIndex] = useState<number>(zIndex + 1);
  const [currentSection, setCurrentSection] = useState<string>(() => {
    // Auto-select the first section (prefer "output" if it exists, otherwise use the first section)
    const sections = table.sections || [];
    const outputSection = sections.find(s => s.name.toLowerCase() === 'output');
    const firstSection = outputSection || sections[0];
    return firstSection ? firstSection.name : 'output';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Roll on a specific section
  const handleRollSection = (sectionName: string) => {
    const rollResult = rollOnTableSection(table, sectionName, allTables);
    
    // Add current result to history if it exists
    if (currentResult) {
      setRollHistory(prev => [
        { result: currentResult, timestamp: new Date() },
        ...prev.slice(0, 19) // Keep only last 20 results
      ]);
    }
    
    setCurrentResult(rollResult);
    setCurrentSection(sectionName); // Track which section we rolled from
  };

  // Reroll the current result (use the current section)
  const handleReroll = () => {
    if (currentResult) {
      const rollResult = rollOnTableSection(table, currentSection, allTables);
      
      // Add current result to history
      setRollHistory(prev => [
        { result: currentResult, timestamp: new Date() },
        ...prev.slice(0, 19)
      ]);
      
      setCurrentResult(rollResult);
    }
  };

  // Reroll a specific subtable
  const handleSubtableReroll = (subrollIndex: number) => {
    if (currentResult) {
      const newRollResult = rerollSubtable(
        currentResult,
        subrollIndex,
        table,
        allTables
      );
      
      // Add current result to history
      setRollHistory(prev => [
        { result: currentResult, timestamp: new Date() },
        ...prev.slice(0, 19)
      ]);
      
      setCurrentResult(newRollResult);
    }
  };

  // Roll from history
  const handleHistoryReroll = (historyResult: RollResult) => {
    // Auto-select the first section (prefer "output" if it exists, otherwise use the first section)
    const sections = table.sections || [];
    const outputSection = sections.find(s => s.name.toLowerCase() === 'output');
    const firstSection = outputSection || sections[0];
    const defaultSection = firstSection ? firstSection.name : 'output';
    
    const rollResult = rollOnTableSection(table, defaultSection, allTables);
    
    // Add current result to history if it exists
    if (currentResult) {
      setRollHistory(prev => [
        { result: currentResult, timestamp: new Date() },
        ...prev.slice(0, 19)
      ]);
    }
    
    setCurrentResult(rollResult);
  };

  // Handle forced entry selection
  const handleForceEntry = (sectionName: string, entryIndex: number) => {
    if (!currentResult) {
      // If no current result, start fresh with forced selection
      const forcedSelections: ForcedSelection[] = [
        { sectionName, entryIndex }
      ];
      const rollResult = rollOnTableWithForcedSelections(table, allTables, forcedSelections);
      setCurrentResult(rollResult);
      setCurrentSection(sectionName); // Track which section we're now rolling from
      return;
    }

    // If we have a current result, force just this subtable entry
    const rollResult = forceSubtableEntry(
      currentResult,
      sectionName,
      entryIndex,
      table,
      allTables
    );
    
    // Add current result to history
    setRollHistory(prev => [
      { result: currentResult, timestamp: new Date() },
      ...prev.slice(0, 19)
    ]);
    
    setCurrentResult(rollResult);
    // Note: Don't update currentSection here since we're just forcing a specific entry,
    // not changing which section we're rolling from
  };

  const getTableSubtitle = (): string => {
    const parts = [];
    
    // Show number of sections (the actual functional units)
    if (table.sections && table.sections.length > 0) {
      parts.push(`${table.sections.length} ${table.sections.length === 1 ? t.tables.section : t.tables.sections}`);
    }
    
    // Show errors if any
    if (table.errors && table.errors.length > 0) {
      parts.push(`${table.errors.length} ${table.errors.length === 1 ? t.tables.error : t.tables.errors}`);
    }
    
    return parts.join(' • ');
  };

  const getWindowTitle = (): string => {
    const subtitle = getTableSubtitle();
    const filename = table.filePath ? table.filePath.split('/').pop() : '';
    
    if (subtitle && filename) {
      return `${table.title} • ${subtitle} • ${filename}`;
    } else if (subtitle) {
      return `${table.title} • ${subtitle}`;
    } else if (filename) {
      return `${table.title} • ${filename}`;
    }
    
    return table.title;
  };

  // Handle bringing history popup to front
  const handleHistoryBringToFront = () => {
    if (onHistoryBringToFront) {
      const newZIndex = onHistoryBringToFront();
      setHistoryPopupZIndex(newZIndex);
    }
  };

  // Initial roll when component mounts
  useEffect(() => {
    const rollResult = rollOnTableSection(table, currentSection, allTables);
    setCurrentResult(rollResult);
  }, [table, allTables]); // Removed currentSection dependency to prevent double-rolling

  const t = useTranslations();

  const headerContent = (
    <button
      className="history-toggle-button"
      onClick={() => setShowHistoryPopup(!showHistoryPopup)}
      title={t.tables.openHistoryWindow}
    >
      <i className="fas fa-clock-rotate-left"></i>
    </button>
  );

  return (
    <>
      <DraggableWindow
        title={getWindowTitle()}
        headerContent={headerContent}
        initialPosition={position}
        initialSize={size}
        onClose={onClose}
        onPositionChange={onPositionChange}
        onSizeChange={onSizeChange}
        onBringToFront={onBringToFront}
        zIndex={zIndex}
        minWidth={400}
        minHeight={300}
        maxWidth={700}
        maxHeight={800}
      >
      <div className="table-window-content">
        {/* Current Result at the top */}
        {currentResult && (
          <div className="current-result-section">
            <InteractiveRollResult
              rollResult={currentResult}
              onReroll={handleReroll}
              onSubtableReroll={handleSubtableReroll}
              lastRolledTable={table}
            />
          </div>
        )}

        {/* Search Box */}
        <div className="table-search-section">
          <div className="table-search-box">
            <input
              type="text"
              className="table-search-input"
              placeholder={t.tables.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="table-search-clear"
                onClick={() => setSearchQuery('')}
                title={t.tables.clearSearch}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* No results state - compact banner */}
        {!currentResult && rollHistory.length === 0 && (
          <div 
            className="table-empty-banner clickable-empty"
            onClick={() => {
              // Auto-select the first section (prefer "output" if it exists, otherwise use the first section)
              const sections = table.sections || [];
              const outputSection = sections.find(s => s.name.toLowerCase() === 'output');
              const firstSection = outputSection || sections[0];
              const defaultSection = firstSection ? firstSection.name : 'output';
              handleRollSection(defaultSection);
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="empty-message">{t.tables.clickToRoll}</div>
          </div>
        )}

        {/* Table Structure View - takes up remaining space */}
        <div className="table-structure-section">
          <TableEntryViewer 
            table={table}
            searchQuery={searchQuery}
            rollResult={currentResult || undefined}
            onForceEntry={handleForceEntry}
            onRollSection={handleRollSection}
          />
        </div>
      </div>
    </DraggableWindow>

    {/* History Popup Window */}
    {showHistoryPopup && (
      <DraggableWindow
        title={t.history.historyFor.replace('{tableName}', table.title)}
        initialPosition={{ x: position.x + 50, y: position.y + 50 }}
        initialSize={{ width: 400, height: 500 }}
        onClose={() => setShowHistoryPopup(false)}
        onPositionChange={() => {}} // No need to persist popup position
        onSizeChange={() => {}} // No need to persist popup size
        onBringToFront={handleHistoryBringToFront}
        zIndex={historyPopupZIndex}
        minWidth={300}
        minHeight={200}
        maxWidth={600}
        maxHeight={700}
      >
        <div style={{ padding: '8px', height: '100%', overflow: 'auto' }}>
          {rollHistory.length > 0 ? (
            <div className="history-list">
              {rollHistory.map((historyItem, index) => {
                // Check if we should show timestamp for this item
                const prevItem = index > 0 ? rollHistory[index - 1] : null;
                
                // Show timestamp if:
                // 1. It's the first item, OR
                // 2. More than 1 minute has passed since the previous item
                const shouldShowTimestamp =
                  !prevItem ||
                  historyItem.timestamp.getTime() - prevItem.timestamp.getTime() > 60000; // 60 seconds

                return (
                  <div 
                    key={`${historyItem.timestamp.getTime()}-${index}`} 
                    className={`history-item ${!shouldShowTimestamp ? "no-timestamp" : ""}`}
                  >
                    {shouldShowTimestamp && (
                      <div className="history-timestamp">
                        {historyItem.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                    <div className="history-item-content">
                      <InteractiveRollResult
                        rollResult={historyItem.result}
                        onReroll={() => handleHistoryReroll(historyItem.result)}
                        onSubtableReroll={(subrollIndex: number) => {
                          const newRollResult = rerollSubtable(
                            historyItem.result,
                            subrollIndex,
                            table,
                            allTables
                          );
                          
                          if (currentResult) {
                            setRollHistory(prev => [
                              { result: currentResult, timestamp: new Date() },
                              ...prev.slice(0, 19)
                            ]);
                          }
                          
                          setCurrentResult(newRollResult);
                        }}
                        lastRolledTable={table}
                        isHistoryItem={true}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'var(--text-muted)',
              fontSize: '12px'
            }}>
              {t.tables.noHistoryYet}
            </div>
          )}
        </div>
      </DraggableWindow>
    )}
    </>
  );
}; 
