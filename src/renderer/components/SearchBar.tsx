import React, {useState, useEffect, useRef} from "react";
import "./SearchBar.css";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onTab?: (event: KeyboardEvent) => void;
  onNumberKey?: (number: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
  value?: string;
  resultCount?: number;
  selectedIndex?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onTab,
  onNumberKey,
  placeholder = "Search tables...",
  autoFocus = true,
  value,
  resultCount = 0,
  selectedIndex = -1
}) => {
  const [query, setQuery] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isSearchFocused = document.activeElement === inputRef.current;

      // Ctrl/Cmd + K to focus search
      if (isCtrlOrCmd && e.key === "k") {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
        return;
      }

      // Ctrl/Cmd + L to clear search
      if (isCtrlOrCmd && e.key === "l") {
        e.preventDefault();
        handleClear();
        return;
      }

      // Number keys 1-9 for quick selection (only when search is NOT focused)
      if (
        e.key >= "1" &&
        e.key <= "9" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isSearchFocused // Only when search is not focused
      ) {
        const number = parseInt(e.key);
        if (onNumberKey) {
          e.preventDefault();
          onNumberKey(number);
          return;
        }
      }

      // Tab navigation when search is focused
      if (e.key === "Tab" && isSearchFocused && onTab) {
        e.preventDefault();
        onTab(e);
        return;
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onNumberKey, onTab, query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Escape":
        // Always unfocus on escape, don't clear the search
        if (inputRef.current) {
          inputRef.current.blur();
        }
        if (onEscape) {
          onEscape();
        }
        break;
      case "Enter":
        e.preventDefault();
        if (onEnter) {
          onEnter();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (onArrowUp) {
          onArrowUp();
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (onArrowDown) {
          onArrowDown();
        }
        break;
      case "Tab":
        // Let the global handler deal with this
        break;
    }
  };

  const getAriaLabel = () => {
    if (query && resultCount > 0) {
      const selectedText =
        selectedIndex >= 0
          ? `, ${selectedIndex + 1} of ${resultCount} selected`
          : "";
      return `Search tables, ${resultCount} results found${selectedText}`;
    } else if (query && resultCount === 0) {
      return "Search tables, no results found";
    }
    return "Search tables";
  };

  const getSearchHint = () => {
    const hints = [];
    if (query) {
      hints.push("↑↓ navigate", "Enter to roll");
    }
    hints.push("Ctrl+K focus", "Ctrl+L clear");

    // Show number shortcut hint when search is not focused (regardless of query)
    const isSearchFocused = document.activeElement === inputRef.current;
    if (!isSearchFocused) {
      hints.push("1-9 quick select");
    } else {
      // Only show "Esc back" when search is actually focused
      hints.push("Esc back");
    }

    return hints.join(" • ");
  };

  return (
    <div className="search-bar spotlight-style">
      <div className="search-input-container">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
          aria-label={getAriaLabel()}
          aria-describedby="search-hint"
          role="combobox"
          aria-expanded={!!(query && resultCount > 0)}
          aria-activedescendant={
            selectedIndex >= 0 ? `table-item-${selectedIndex}` : undefined
          }
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            onClick={handleClear}
            className="clear-button"
            title="Clear search (Ctrl+L)"
            type="button"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      <div id="search-hint" className="search-hint">
        {getSearchHint()}
      </div>
    </div>
  );
};

export default SearchBar;
