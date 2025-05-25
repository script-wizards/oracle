import React, {useState, useEffect, useRef} from "react";
import "./SearchBar.css";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  value?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  placeholder = "Search tables...",
  autoFocus = true,
  value
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
        if (query) {
          handleClear();
        } else if (onEscape) {
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
    }
  };

  return (
    <div className="search-bar spotlight-style">
      <div className="search-input-container">
        <div className="search-icon">🔍</div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
        />
        {query && (
          <button
            onClick={handleClear}
            className="clear-button"
            title="Clear search (Esc)"
            type="button"
          >
            ×
          </button>
        )}
      </div>
      {query && (
        <div className="search-hint">
          Use ↑↓ to navigate, Enter to roll, Esc to clear
        </div>
      )}
    </div>
  );
};

export default SearchBar;
