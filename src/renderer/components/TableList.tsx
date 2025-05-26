import React, {useEffect, useRef, useState} from "react";
import {Table} from "../../shared/types";
import "./TableList.css";
import {useTranslations} from "../i18n";

interface TableListProps {
  tables: Table[];
  selectedIndex: number;
  onTableSelect: (index: number) => void;
  onTableOpen?: (table: Table) => void;
  searchQuery?: string;
  isKeyboardNavigating?: boolean;
}

const TableList: React.FC<TableListProps> = ({
  tables,
  selectedIndex,
  onTableSelect,
  onTableOpen,
  searchQuery = "",
  isKeyboardNavigating = false
}) => {
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  // Generate Perchance table definition for viewing
  const generateTableDefinition = (table: Table): string => {
    let definition = `title\n  ${table.title}\n\n`;

    // Add each section
    if (table.sections) {
      table.sections.forEach((section) => {
        definition += `${section.name}\n`;
        section.entries.forEach((entry) => {
          definition += `  ${entry}\n`;
        });
        definition += "\n";
      });
    }

    return definition.trim();
  };

  // Handle viewing a table
  const handleViewTable = (table: Table) => {
    if (expandedTableId === table.id) {
      // Collapse if already expanded
      setExpandedTableId(null);
    } else {
      // Expand this table
      setExpandedTableId(table.id);
    }
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

    if (table.entries.length > 0) {
      parts.push(`${table.entries.length} ${t.tables.entries}`);
    }

    if (table.subtables && table.subtables.length > 0) {
      parts.push(`${table.subtables.length} ${t.tables.subtables}`);
    }

    if (table.errors && table.errors.length > 0) {
      parts.push(`${table.errors.length} ${t.tables.errors}`);
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
      <div className="table-list empty" role="listbox" aria-label="Table list">
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
      aria-label={`Table list, ${tables.length} tables`}
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
              expandedTableId === table.id ? "expanded" : ""
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
              {table.filePath && (
                <div className="table-item-path">
                  {table.filePath.split("/").pop()}
                </div>
              )}
            </div>
            <div className="table-item-status">
              {onTableOpen && (
                <button
                  className="table-open-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTableOpen(table);
                  }}
                  title="Open table in new window"
                  aria-label={`Open ${table.title} in new window`}
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
                  expandedTableId === table.id
                    ? t.tables.hideDefinition
                    : t.tables.viewDefinition
                }
                aria-label={`${
                  expandedTableId === table.id ? t.tables.hide : t.tables.view
                } ${table.title} definition`}
              >
                <i
                  className={`fas ${
                    expandedTableId === table.id
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
          {expandedTableId === table.id && (
            <div className="table-viewer-inline">
              <div className="table-viewer-content">
                <div className="table-viewer-info">
                  <p className="table-viewer-path">
                    <strong>{t.tables.file}:</strong> {table.filePath}
                  </p>
                  {table.errors && table.errors.length > 0 && (
                    <div className="table-viewer-errors">
                      <strong>{t.tables.errorsLabel}:</strong>
                      <ul>
                        {table.errors.map((error, errorIndex) => (
                          <li key={errorIndex}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="table-definition">
                  <pre>
                    <code>{generateTableDefinition(table)}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default TableList;
