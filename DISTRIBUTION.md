# Oracle Distribution Guide

## 🚀 Building for Distribution

### Prerequisites

- Node.js 18+ installed
- All dependencies installed: `npm install`

### Build Commands

```bash
# Build for all platforms (requires platform-specific tools)
npm run package:all

# Build for specific platforms
npm run package:mac     # macOS (DMG + ZIP)
npm run package:win     # Windows (NSIS installer + Portable + ZIP)
npm run package:linux   # Linux (AppImage + tar.gz)

# Build portable versions only (great for itch.io)
npm run package:portable
```

## 📦 Distribution Formats

### macOS

- **DMG**: Standard macOS installer with drag-to-Applications
- **ZIP**: Portable app bundle for direct download
- **Architectures**: Intel (x64) + Apple Silicon (arm64)

### Windows

- **NSIS Installer**: Full Windows installer with Start Menu shortcuts
- **Portable**: Single executable, no installation required
- **ZIP**: Compressed portable version
- **Architectures**: 64-bit (x64) + 32-bit (ia32)

### Linux

- **AppImage**: Universal Linux executable (recommended)
- **tar.gz**: Compressed archive for manual installation
- **Architecture**: 64-bit (x64)

## 🎮 Itch.io Distribution

### Recommended Uploads for Itch.io

1. **Windows Portable** (`Oracle-1.0.0-win-portable.exe`)
   - Single file, no installation needed
   - Works on most Windows systems

2. **macOS ZIP** (`Oracle-1.0.0-mac.zip`)
   - Universal binary (Intel + Apple Silicon)
   - Users can drag to Applications

3. **Linux AppImage** (`Oracle-1.0.0.AppImage`)
   - Works on most Linux distributions
   - No installation required

### Itch.io Setup

```bash
# Build portable versions
npm run package:portable

# Files will be in build/ directory:
# - Oracle-1.0.0-win-portable.exe
# - Oracle-1.0.0-mac.zip
# - Oracle-1.0.0.AppImage
```

## 🔧 Required Assets

You'll need to create these icon files in an `assets/` directory:

```
assets/
├── icon.icns     # macOS icon (512x512)
├── icon.ico      # Windows icon (256x256)
└── icon.png      # Linux icon (512x512)
```

### Creating Icons

1. Start with a 1024x1024 PNG
2. Use online converters or tools like:
   - **ICNS**: `png2icns` or online converters
   - **ICO**: GIMP, Paint.NET, or online converters
   - **PNG**: Just resize your source image

## 🚀 Release Workflow

### 1. Pre-Release Checklist

- [ ] Update version in `package.json`
- [ ] Test on target platforms
- [ ] Update changelog/release notes
- [ ] Ensure all assets are in place

### 2. Build Release

```bash
# Clean previous builds
npm run clean

# Build for all platforms
npm run package:all
```

### 3. Test Builds

- Test each platform build
- Verify file associations work
- Check app signing (macOS/Windows)

### 4. Upload to Platforms

#### Itch.io

1. Go to your game's edit page
2. Upload the portable builds
3. Set platform compatibility
4. Add screenshots and description

#### GitHub Releases

1. Create new release with version tag
2. Upload all build artifacts
3. Include release notes

## 🔐 Code Signing (Optional but Recommended)

### macOS

```bash
# Requires Apple Developer account
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate_password"
npm run package:mac
```

### Windows

```bash
# Requires code signing certificate
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate_password"
npm run package:win
```

## 📊 File Sizes (Approximate)

- **Windows Portable**: ~150-200MB
- **macOS ZIP**: ~300-400MB (universal binary)
- **Linux AppImage**: ~150-200MB

## 🎯 Platform-Specific Notes

### macOS

- Universal binaries work on Intel and Apple Silicon
- DMG provides better user experience
- Consider notarization for Gatekeeper compatibility

### Windows

- Portable version is perfect for itch.io
- NSIS installer for professional distribution
- Consider Windows Defender SmartScreen implications

### Linux

- AppImage is most compatible
- Consider Flatpak/Snap for app stores
- tar.gz for package managers

## 🔄 Automated Builds (Future)

Consider setting up GitHub Actions for automated builds:

- Build on push to main branch
- Create releases automatically
- Upload to itch.io via butler CLI

## 📝 Release Notes Template

```markdown
# Oracle v1.0.0

## New Features
- Inline table viewer with expand/collapse
- Mobile-responsive hamburger menu
- Improved search and keyboard navigation

## Bug Fixes
- Fixed double scrollbar issues
- Improved window resizing behavior

## Downloads
- Windows: Oracle-1.0.0-win-portable.exe
- macOS: Oracle-1.0.0-mac.zip
- Linux: Oracle-1.0.0.AppImage
```

## 🎮 Itch.io Page Optimization

### Tags to Use

- `tabletop`
- `rpg`
- `tools`
- `random-generator`
- `desktop`
- `utility`

### Description Ideas

- Emphasize Obsidian vault integration
- Highlight Perchance syntax support
- Mention keyboard shortcuts and efficiency
- Show example use cases (D&D, RPGs, etc.)
