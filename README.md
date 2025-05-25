# Random Table Roller

A desktop random table roller application built with Electron, React, and TypeScript. Perfect for tabletop gaming enthusiasts who need quick access to random tables and generators.

## Features

- 🎲 **Roll Tables**: Create and roll custom random tables for your games
- 📚 **Library**: Organize your tables in collections and categories
- ⚡ **Quick Roll**: Fast access to your most-used tables
- 💾 **Save Results**: Keep track of your roll history and results
- 🖥️ **Cross-Platform**: Works on Windows, macOS, and Linux
- 🎨 **Modern UI**: Beautiful and intuitive interface

## Tech Stack

- **Electron**: Cross-platform desktop app framework
- **React**: UI library for building user interfaces
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **CSS3**: Modern styling with gradients and animations

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── main.ts     # Main application entry point
│   └── preload.ts  # Preload script for secure IPC
├── renderer/       # React renderer process
│   ├── App.tsx     # Main React component
│   ├── App.css     # Component styles
│   ├── index.html  # HTML template
│   ├── index.css   # Global styles
│   └── main.tsx    # React entry point
└── shared/         # Shared types and utilities
    └── types.ts    # TypeScript type definitions
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd random-table-roller
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Development

Start the development server:

```bash
npm run dev
```

This will:

- Start the Vite development server for the React app
- Compile the TypeScript main process
- Launch Electron with hot reload enabled
- Open DevTools automatically in development mode

## Building

Build the application for production:

```bash
npm run build
```

This creates optimized builds in the `dist/` directory.

## Packaging

Create distributable packages:

```bash
npm run package
```

This will create platform-specific installers in the `build/` directory.

## Scripts

- `npm run dev` - Start development mode with hot reload
- `npm run dev:renderer` - Start only the Vite dev server
- `npm run dev:main` - Compile and run only the Electron main process
- `npm run build` - Build both renderer and main processes
- `npm run build:renderer` - Build only the React app
- `npm run build:main` - Build only the Electron main process
- `npm run start` - Start the built application
- `npm run package` - Create distributable packages
- `npm run clean` - Clean build artifacts

## Configuration

### Window Settings

The main window is configured with:

- Default size: 800x600 pixels
- Minimum size: 600x400 pixels
- Resizable: Yes
- Title: "Random Table Roller"
- DevTools: Enabled in development mode only

### Security

The application follows Electron security best practices:

- Context isolation enabled
- Node integration disabled in renderer
- Secure preload script for IPC communication
- Content Security Policy configured

## Development Notes

### TypeScript Configuration

- Strict mode enabled for type safety
- Separate configurations for main and renderer processes
- Shared types in the `src/shared` directory

### IPC Communication

The app uses Electron's IPC (Inter-Process Communication) for secure communication between the main and renderer processes. Available channels:

- `get-app-info`: Get application information
- `window-minimize`: Minimize the window
- `window-maximize`: Maximize/restore the window
- `window-close`: Close the window

### Hot Reload

In development mode, the renderer process connects to the Vite dev server for hot module replacement. The main process is recompiled and restarted when changes are detected.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

- [ ] Table creation and editing interface
- [ ] Import/export functionality
- [ ] Roll history tracking
- [ ] Custom dice notation support
- [ ] Table categories and tags
- [ ] Search and filter functionality
- [ ] Backup and sync options
- [ ] Plugin system for custom generators
