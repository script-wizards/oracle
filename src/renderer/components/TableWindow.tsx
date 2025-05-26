import React, { useState } from 'react';
import { Table, RollResult } from '../../shared/types';
import { rollOnTable, rerollSubtable } from '../../shared/utils/TableRoller';
import InteractiveRollResult from './InteractiveRollResult';
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
  zIndex = 5
}) => {
  // Per-table state
  const [currentResult, setCurrentResult] = useState<RollResult | null>(null);
  const [rollHistory, setRollHistory] = useState<Array<{
    result: RollResult;
    timestamp: Date;
  }>>([]);

  // Roll on this table
  const handleRoll = () => {
    const rollResult = rollOnTable(table, allTables);
    
    // Add current result to history if it exists
    if (currentResult) {
      setRollHistory(prev => [
        { result: currentResult, timestamp: new Date() },
        ...prev.slice(0, 4) // Keep only last 5 results
      ]);
    }
    
    setCurrentResult(rollResult);
  };

  // Reroll the current result
  const handleReroll = () => {
    if (currentResult) {
      const rollResult = rollOnTable(table, allTables);
      
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
    const rollResult = rollOnTable(table, allTables);
    
    // Add current result to history if it exists
    if (currentResult) {
      setRollHistory(prev => [
        { result: currentResult, timestamp: new Date() },
        ...prev.slice(0, 4)
      ]);
    }
    
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

  return (
    <DraggableWindow
      title={table.title}
      initialPosition={position}
      initialSize={size}
      onClose={onClose}
      onPositionChange={onPositionChange}
      onSizeChange={onSizeChange}
      zIndex={zIndex}
      minWidth={350}
      minHeight={250}
      maxWidth={600}
      maxHeight={700}
    >
      <div 
        className={`table-window-content ${!currentResult && rollHistory.length === 0 ? 'clickable-empty' : ''}`}
        onClick={!currentResult && rollHistory.length === 0 ? handleRoll : undefined}
        style={{ cursor: !currentResult && rollHistory.length === 0 ? 'pointer' : 'default' }}
      >
        {/* Table Info */}
        <div className="table-window-header">
          <div className="table-info">
            <div className="table-subtitle">
              {getTableSubtitle()}
              {table.filePath && (
                <span className="table-path-inline">{table.filePath.split('/').pop()}</span>
              )}
            </div>
          </div>
        </div>

        {/* Current Result - no wrapper box */}
        {currentResult && (
          <InteractiveRollResult
            rollResult={currentResult}
            onReroll={handleReroll}
            onSubtableReroll={handleSubtableReroll}
            lastRolledTable={table}
          />
        )}

        {/* Recent History */}
        {rollHistory.length > 0 && (
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
                );
              })}
            </div>
          </div>
        )}

        {/* No results state */}
        {!currentResult && rollHistory.length === 0 && (
          <div className="table-empty-state">
            <div className="empty-message">Click anywhere to roll!</div>
            <div className="empty-hint">
              This table has {table.entries.length} possible results
            </div>
          </div>
        )}
      </div>
    </DraggableWindow>
  );
}; 
