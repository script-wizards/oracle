import React, {useEffect, useRef} from "react";
import {Table} from "../../shared/types";
import "./TableList.css";

interface TableListProps {
  tables: Table[];
  selectedIndex: number;
  onTableSelect: (index: number) => void;
  searchQuery?: string;
  isKeyboardNavigating?: boolean;
}

const TableList: React.FC<TableListProps> = ({
  tables,
  selectedIndex,
  onTableSelect,
  searchQuery = "",
  isKeyboardNavigating = false
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

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
      parts.push(`${table.entries.length} entries`);
    }

    if (table.subtables && table.subtables.length > 0) {
      parts.push(`${table.subtables.length} subtables`);
    }

    if (table.errors && table.errors.length > 0) {
      parts.push(`${table.errors.length} errors`);
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
            {searchQuery ? "No tables found" : "No tables loaded"}
          </div>
          {searchQuery && (
            <div className="empty-hint">Try a different search term</div>
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
        <div
          key={table.id}
          id={`table-item-${index}`}
          ref={index === selectedIndex ? selectedItemRef : null}
          className={`table-item ${index === selectedIndex ? "selected" : ""} ${
            isKeyboardNavigating && index === selectedIndex
              ? "keyboard-selected"
              : ""
          } ${table.errors && table.errors.length > 0 ? "has-errors" : ""}`}
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
            <div className="table-item-subtitle">{getTableSubtitle(table)}</div>
            {table.filePath && (
              <div className="table-item-path">
                {table.filePath.split("/").pop()}
              </div>
            )}
          </div>
          {table.errors && table.errors.length > 0 && (
            <div className="table-item-status">
              <span className="error-indicator" title={table.errors.join(", ")}>
                ⚠️
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TableList;
