import React, { useState, useEffect } from 'react';
import { Table, RollResult, ForcedSelection } from '../../shared/types';
import { rollOnTable, rerollSubtable, rollOnTableWithForcedSelections, forceSubtableEntry, rollOnTableSection } from '../../shared/utils/TableRoller';
import InteractiveRollResult from './InteractiveRollResult';
import TableEntryViewer from './TableEntryViewer';
import { DraggableWindow } from './DraggableWindow';
import './TableWindow.css';

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
  zIndex = 5
}) => {
  // Per-table state
  const [currentResult, setCurrentResult] = useState<RollResult | null>(null);
  const [rollHistory, setRollHistory] = useState<Array<{
    result: RollResult;
    timestamp: Date;
  }>>([]);
  const [showHistory, setShowHistory] = useState(true);

  // Roll on a specific section
  const handleRollSection = (sectionName: string) => {
    const rollResult = rollOnTableSection(table, sectionName, allTables);
    
    // Add current result to history if it exists
    if (currentResult) {
      setRollHistory(prev => [
        { result: currentResult, timestamp: new Date() },
        ...prev.slice(0, 4) // Keep only last 5 results
      ]);
    }
    
    setCurrentResult(rollResult);
  };

  // Reroll the current result (use output section by default)
  const handleReroll = () => {
    if (currentResult) {
      // Auto-select the first section, or "output" if it exists
      const sections = table.sections || [];
      const outputSection = sections.find(s => s.name.toLowerCase() === 'output');
      const defaultSection = outputSection ? outputSection.name : (sections[0]?.name || 'output');
      
      const rollResult = rollOnTableSection(table, defaultSection, allTables);
      
      // Add current result to history
      setRollHistory(prev => [
        { result: currentResult, timestamp: new Date() },
        ...prev.slice(0, 4)
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
        ...prev.slice(0, 4)
      ]);
      
      setCurrentResult(newRollResult);
    }
  };

  // Roll from history
  const handleHistoryReroll = (historyResult: RollResult) => {
    // Auto-select the first section, or "output" if it exists
    const sections = table.sections || [];
    const outputSection = sections.find(s => s.name.toLowerCase() === 'output');
    const defaultSection = outputSection ? outputSection.name : (sections[0]?.name || 'output');
    
    const rollResult = rollOnTableSection(table, defaultSection, allTables);
    
    // Add current result to history if it exists
    if (currentResult) {
      setRollHistory(prev => [
        { result: currentResult, timestamp: new Date() },
        ...prev.slice(0, 4)
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
      ...prev.slice(0, 4)
    ]);
    
    setCurrentResult(rollResult);
  };

  const getTableSubtitle = (): string => {
    const parts = [];
    
    if (table.entries.length > 0) {
      parts.push(`${table.entries.length} entries`);
    }
    
    if (table.subtables && table.subtables.length > 0) {
      parts.push(`${table.subtables.length} subtables`);
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

  // Initial roll when component mounts
  useEffect(() => {
    // Auto-select the first section, or "output" if it exists
    const sections = table.sections || [];
    const outputSection = sections.find(s => s.name.toLowerCase() === 'output');
    const defaultSection = outputSection ? outputSection.name : (sections[0]?.name || 'output');
    
    const rollResult = rollOnTableSection(table, defaultSection, allTables);
    setCurrentResult(rollResult);
  }, [table, allTables]);

  const headerContent = rollHistory.length > 0 ? (
    <button
      className="history-toggle-button"
      onClick={() => setShowHistory(!showHistory)}
      title={showHistory ? "Hide history" : "Show history"}
    >
      <i className="fas fa-clock-rotate-left"></i>
    </button>
  ) : null;

  return (
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
      minHeight={showHistory && rollHistory.length > 0 ? 400 : 300}
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

        {/* Recent History - right below result */}
        {rollHistory.length > 0 && showHistory && (
          <div className="table-recent-history">
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
                              ...prev.slice(0, 4)
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
          </div>
        )}

        {/* No results state - compact banner */}
        {!currentResult && rollHistory.length === 0 && (
          <div 
            className="table-empty-banner clickable-empty"
            onClick={() => {
              // Auto-select the first section, or "output" if it exists
              const sections = table.sections || [];
              const outputSection = sections.find(s => s.name.toLowerCase() === 'output');
              const defaultSection = outputSection ? outputSection.name : (sections[0]?.name || 'output');
              handleRollSection(defaultSection);
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="empty-message">Click here to roll!</div>
          </div>
        )}

        {/* Table Structure View - takes up remaining space */}
        <div className="table-structure-section">
          <TableEntryViewer 
            table={table}
            rollResult={currentResult || undefined}
            onForceEntry={handleForceEntry}
            onRollSection={handleRollSection}
          />
        </div>
      </div>
    </DraggableWindow>
  );
}; 
