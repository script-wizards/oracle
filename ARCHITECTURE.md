# Architecture Documentation

## Project Overview

Random Table Roller is an Electron-based desktop application for tabletop gaming that parses and rolls on random tables using Perchance syntax.

## Architecture

### Core Components

```
src/
├── main/                    # Electron Main Process
│   ├── main.ts             # Application entry point & IPC handlers
│   └── preload.ts          # Secure API bridge
├── renderer/               # React Frontend
│   ├── App.tsx             # Main application component
│   └── services/           # Business logic services
│       ├── StorageService.ts   # Local storage management
│       └── FileService.ts      # File system operations
└── shared/                 # Shared Code
    ├── types.ts            # TypeScript interfaces
    └── utils/              # Core utilities
        ├── PerchanceParser.ts  # Table parsing logic
        └── TableRoller.ts      # Rolling & subtable resolution
```

### Key Design Patterns

#### 1. **Secure IPC Communication**

- Main process handles all file system operations
- Renderer process communicates via secure IPC channels
- Context isolation prevents direct Node.js access

#### 2. **Service Layer Architecture**

- `StorageService`: Manages localStorage persistence
- `FileService`: Handles vault operations and file parsing
- Clear separation of concerns between UI and business logic

#### 3. **Parser Architecture**

- `PerchanceParser`: Converts markdown code blocks to Table objects
- `TableRoller`: Resolves subtable references and generates results
- Supports both local section references and external table references

### Data Flow

```
User selects vault → FileService scans files → PerchanceParser extracts tables →
StorageService persists state → User rolls tables → TableRoller resolves subtables
```

## Key Features

### File System Integration

- Secure vault folder selection via Electron dialog API
- Recursive markdown file scanning with intelligent filtering
- Real-time file statistics and code block analysis
- Persistent vault path storage

### Table Parsing

- Full Perchance syntax support with sections and subtables
- Robust error handling and validation
- Backward compatibility with simple table formats
- Circular reference detection

### Table Rolling

- Intelligent subtable resolution (local sections first, then external tables)
- Configurable recursion depth limits
- Detailed roll results with subroll tracking
- Error reporting for missing references

## Security Considerations

- **File Access**: Limited to user-selected directories only
- **IPC Security**: All file operations go through secure Electron IPC
- **Input Validation**: File paths and content are validated before processing
- **Context Isolation**: Renderer process has no direct Node.js access

## Performance Optimizations

- **Asynchronous Operations**: All file I/O is non-blocking
- **Lazy Loading**: File content is read on-demand
- **Intelligent Filtering**: Skips hidden directories and non-markdown files
- **Debounced Auto-save**: Prevents excessive storage writes

## Development Guidelines

### Adding New Table Features

1. Update `Table` interface in `src/shared/types.ts`
2. Modify `PerchanceParser.ts` for syntax changes
3. Update `TableRoller.ts` for rolling behavior
4. Add UI components in `App.tsx`

### Adding New File Operations

1. Add IPC handler in `src/main/main.ts`
2. Expose API in `src/main/preload.ts`
3. Add method to `FileService.ts`
4. Update UI to use new functionality

### Testing Strategy

- Use `test-vault/` for development testing
- Console testing via `window.fileSystemTests`
- Manual UI testing for file operations
- Validate parser with various Perchance syntax examples

## Future Enhancements

### Planned Features

- **File Watching**: Auto-refresh when vault files change
- **Table Validation**: Real-time syntax checking
- **Import/Export**: Backup and restore vault configurations
- **Advanced Rolling**: Dice notation support, weighted entries

### Technical Debt

- Consider migrating to a more robust state management solution
- Add comprehensive unit tests for parser and roller
- Implement proper logging system
- Add performance monitoring for large vaults

## Troubleshooting

### Common Issues

- **Parser Failures**: Check Perchance syntax, ensure proper indentation
- **File Access Errors**: Verify vault path exists and is readable
- **Storage Issues**: Clear localStorage if state becomes corrupted
- **Subtable Resolution**: Check for circular references and missing tables

### Debug Tools

- Browser DevTools console for testing file operations
- `window.fileSystemTests` for systematic testing
- Console logs in parser for syntax debugging
- Error messages in UI for user-facing issues
