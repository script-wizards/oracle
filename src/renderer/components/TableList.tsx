import React, {useEffect, useRef} from "react";
import {Table} from "../../shared/types";
import "./TableList.css";

interface TableListProps {
  tables: Table[];
  selectedIndex: number;
  onTableSelect: (index: number) => void;
  searchQuery?: string;
}

const TableList: React.FC<TableListProps> = ({
  tables,
  selectedIndex,
  onTableSelect,
  searchQuery = ""
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && listRef.current) {
      const listRect = listRef.current.getBoundingClientRect();
      const itemRect = selectedItemRef.current.getBoundingClientRect();

      if (itemRect.top < listRect.top || itemRect.bottom > listRect.bottom) {
        selectedItemRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }
    }
  }, [selectedIndex]);

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

  if (tables.length === 0) {
    return (
      <div className="table-list empty">
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
    <div className="table-list" ref={listRef}>
      {tables.map((table, index) => (
        <div
          key={table.id}
          ref={index === selectedIndex ? selectedItemRef : null}
          className={`table-item ${index === selectedIndex ? "selected" : ""} ${
            table.errors && table.errors.length > 0 ? "has-errors" : ""
          }`}
          onClick={() => onTableSelect(index)}
        >
          <div className="table-item-icon">🎲</div>
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
