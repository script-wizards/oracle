import React, {useEffect, useRef, useState} from "react";
import {Table, RollResult} from "../../shared/types";
import "./TableList.css";
import {useTranslations} from "../i18n";
import TableEntryViewer from "./TableEntryViewer";

interface TableListProps {
  tables: Table[];
  selectedIndex: number;
  onTableSelect: (index: number) => void;
  onTableOpen?: (table: Table) => void;
  searchQuery?: string;
  isKeyboardNavigating?: boolean;
  rollResult?: RollResult;
  lastRolledTable?: Table;
  onForceEntry?: (table: Table, sectionName: string, entryIndex: number) => void;
  onRollSection?: (table: Table, sectionName: string) => void;
}

const TableList: React.FC<TableListProps> = ({
  tables,
  selectedIndex,
  onTableSelect,
  onTableOpen,
  searchQuery = "",
  isKeyboardNavigating = false,
  rollResult,
  lastRolledTable,
  onForceEntry,
  onRollSection
}) => {
  const [expandedTableIds, setExpandedTableIds] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  // Handle viewing a table (inline expansion)
  const handleViewTable = (table: Table) => {
    setExpandedTableIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(table.id)) {
        // Collapse if already expanded
        newSet.delete(table.id);
      } else {
        // Expand this table
        newSet.add(table.id);
      }
      return newSet;
    });
  };



  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && listRef.current && isKeyboardNavigating) {
      const listRect = listRef.current.getBoundingClientRect();
      const itemRect = selectedItemRef.current.getBoundingClientRect();

      if (itemRect.top < listRect.top || itemRect.bottom > listRect.bottom) {
        selectedItemRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }
    }
  }, [selectedIndex, isKeyboardNavigating]);

  const highlightSearchTerm = (
    text: string,
    query: string
  ): React.ReactNode => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getTableSubtitle = (table: Table): string => {
    const parts = [];

    // Show number of sections (the actual functional units)
    if (table.sections && table.sections.length > 0) {
      parts.push(`${table.sections.length} ${table.sections.length === 1 ? t.tables.section : t.tables.sections}`);
    }

    // Show errors if any
    if (table.errors && table.errors.length > 0) {
      parts.push(`${table.errors.length} ${table.errors.length === 1 ? t.tables.error : t.tables.errors}`);
    }

    return parts.join(" • ");
  };

  const getTableIcon = (index: number): string => {
    // Show numbers 1-9 for the first 9 tables, then use a generic icon
    if (index < 9) {
      return (index + 1).toString();
    }
    return "•";
  };

  if (tables.length === 0) {
    return (
      <div className="table-list empty" role="listbox" aria-label={t.tables.tableList}>
        <div className="empty-state">
          <div className="empty-message">
            {searchQuery ? t.tables.noTablesFound : t.tables.noTablesLoaded}
          </div>
          {searchQuery && (
            <div className="empty-hint">{t.tables.tryDifferentSearch}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="table-list"
      ref={listRef}
      role="listbox"
      aria-label={t.tables.tableList}
      aria-activedescendant={
        selectedIndex >= 0 ? `table-item-${selectedIndex}` : undefined
      }
    >
      {tables.map((table, index) => (
        <React.Fragment key={table.id}>
          <div
            id={`table-item-${index}`}
            ref={index === selectedIndex ? selectedItemRef : null}
            className={`table-item ${
              index === selectedIndex ? "selected" : ""
            } ${
              isKeyboardNavigating && index === selectedIndex
                ? "keyboard-selected"
                : ""
            } ${table.errors && table.errors.length > 0 ? "has-errors" : ""} ${
              expandedTableIds.has(table.id) ? "expanded" : ""
            }`}
            onClick={() => onTableSelect(index)}
            role="option"
            aria-selected={index === selectedIndex}
            aria-label={`Table ${index + 1}: ${table.title}, ${getTableSubtitle(
              table
            )}`}
            tabIndex={-1}
          >
            <div className="table-item-icon">{getTableIcon(index)}</div>
            <div className="table-item-content">
              <div className="table-item-title">
                {highlightSearchTerm(table.title, searchQuery)}
              </div>
              <div className="table-item-subtitle">
                {getTableSubtitle(table)}
              </div>
            </div>
            <div className="table-item-status">
              {onTableOpen && (
                <button
                  className="table-open-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTableOpen(table);
                  }}
                  title={t.tables.openInNewWindow}
                  aria-label={`${t.tables.openInNewWindow}: ${table.title}`}
                >
                  <i className="fas fa-external-link-alt"></i>
                </button>
              )}
              <button
                className="table-view-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewTable(table);
                }}
                title={
                  expandedTableIds.has(table.id)
                    ? t.tables.hideDefinition
                    : t.tables.viewDefinition
                }
                aria-label={`${
                  expandedTableIds.has(table.id) ? t.tables.hide : t.tables.view
                } ${table.title} definition`}
              >
                <i
                  className={`fas ${
                    expandedTableIds.has(table.id)
                      ? "fa-caret-up"
                      : "fa-caret-down"
                  }`}
                ></i>
              </button>
              {table.errors && table.errors.length > 0 && (
                <span
                  className="error-indicator"
                  title={table.errors.join(", ")}
                >
                  ⚠️
                </span>
              )}
            </div>
          </div>

          {/* Inline Table Viewer */}
          {expandedTableIds.has(table.id) && (
            <div className="table-viewer-inline">
              <div className="table-viewer-content">
                <TableEntryViewer 
                  table={table} 
                  searchQuery={searchQuery}
                  rollResult={rollResult && lastRolledTable?.id === table.id ? rollResult : undefined}
                  onForceEntry={onForceEntry ? (sectionName, entryIndex) => onForceEntry(table, sectionName, entryIndex) : undefined}
                  onRollSection={onRollSection ? (sectionName) => onRollSection(table, sectionName) : undefined}
                />
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default TableList;
