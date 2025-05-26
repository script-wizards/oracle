# Oracle

A desktop application for tabletop gaming that parses and rolls on random tables using Perchance syntax.

## Features

- **Perchance Table Parsing**: Parse tables from markdown files using Perchance syntax
- **Subtable Resolution**: Automatically resolve nested table references like `[encounter]` and `[treasure]`
- **Vault Management**: Scan and manage collections of markdown files containing tables
- **Cross-Platform**: Built with Electron for Windows, macOS, and Linux
- **Local Storage**: Persistent storage of vault paths and table data

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd oracle

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### First Use

1. Click "📁 Select Vault" to choose a folder with markdown files
2. Click "🔍 Scan & Analyze" to find tables
3. Click "🎲 Parse Tables" to load them
4. Select a table and click "🎲 Roll Table" to test

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and design patterns
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development workflow and testing guide

## Table Format

Tables should be written in Perchance syntax within markdown code blocks:

````markdown
```perchance
title
  Forest Encounters

output
  You encounter [encounter]

encounter
  A pack of wolves
  A wandering merchant
  An ancient tree spirit
  Bandits demanding toll
```
````

### Subtables

Tables can reference other sections or external tables:

````markdown
```perchance
title
  Minor Treasures

output
  You find [treasure]

treasure
  [gold] gold pieces
  [gems]
  [items]

gold
  2d6
  1d10+5
  3d4

gems
  A small ruby
  An emerald shard
  A polished sapphire

items
  A masterwork dagger (+1 to hit)
  A potion of healing
  A scroll of magic missile
```
````

## Project Structure

```
src/
├── main/           # Electron main process
├── renderer/       # React frontend
└── shared/         # Shared types and utilities
    ├── types.ts    # TypeScript interfaces
    └── utils/
        ├── PerchanceParser.ts  # Table parsing logic
        └── TableRoller.ts      # Rolling and resolution logic
```

## Key Components

### PerchanceParser

- Parses Perchance syntax from markdown code blocks
- Extracts table sections, entries, and subtable references
- Validates table structure and reports errors

### TableRoller

- Rolls on tables with proper subtable resolution
- Supports both local section references and external table references
- Prevents infinite recursion with depth limits

### Table Interface

```typescript
interface Table {
  id: string;
  title: string;
  entries: string[];           // Backward compatibility
  sections?: TableSection[];   // Full section structure
  subtables: string[];
  filePath: string;
  codeBlockIndex: number;
  errors?: string[];
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run dist` - Package for distribution
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### Architecture

- **Main Process**: Handles file system operations and window management
- **Renderer Process**: React-based UI for table management and rolling
- **IPC Communication**: Secure communication between main and renderer processes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Add your license here]

## Acknowledgments

- Built with [Electron](https://electronjs.org/)
- UI powered by [React](https://reactjs.org/)
- Inspired by [Perchance](https://perchance.org/) table syntax
