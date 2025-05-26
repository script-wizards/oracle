# Development & Testing Guide

## Quick Start Testing

### 1. Start Development Environment

```bash
npm run dev
```

This starts both the Electron app and React development server.

### 2. Test with Sample Vault

The project includes a `test-vault/` directory with sample tables:

```
test-vault/
├── encounters.md    # Random encounters table
├── treasures.md     # Treasure tables with subtables
└── subfolder/
    └── spells.md    # Magic spell tables
```

### 3. Basic Testing Flow

1. **Select Vault**: Click "📁 Select Vault" → Choose `test-vault` folder
2. **Scan & Analyze**: Click "🔍 Scan & Analyze" → Should find 3 markdown files
3. **Parse Tables**: Click "🎲 Parse Tables" → Should extract ~8 tables
4. **Test Rolling**: Select a table → Click "🎲 Roll Table"

## Console Testing

Open DevTools Console (`F12`) for advanced testing:

### File System API Tests

```javascript
// Check if Electron API is available
window.fileSystemTests.testElectronAPIAvailability()

// Test vault selection (opens dialog)
window.fileSystemTests.testVaultSelection()

// Test file scanning
const vaultPath = '/path/to/your/test-vault';
window.fileSystemTests.testFileScanning(vaultPath)

// Run all file system tests
window.fileSystemTests.runFileSystemTests()
```

### Parser Testing

```javascript
// Test specific table parsing
const testContent = `
title
  Test Table

output
  You find [treasure]

treasure
  A magic sword
  A healing potion
  Ancient coins
`;

// This would require exposing parser functions to window object
// Currently not implemented - add if needed for debugging
```

## Manual Testing Scenarios

### Vault Management

- [ ] Select valid vault folder
- [ ] Select invalid/empty folder
- [ ] Cancel vault selection dialog
- [ ] Vault path persistence after restart
- [ ] Clear storage functionality

### File Operations

- [ ] Scan vault with markdown files
- [ ] Scan empty vault
- [ ] Scan vault with no Perchance blocks
- [ ] Handle permission errors gracefully
- [ ] Large vault performance (100+ files)

### Table Parsing

- [ ] Parse valid Perchance tables
- [ ] Handle invalid syntax gracefully
- [ ] Parse tables with subtables
- [ ] Detect circular references
- [ ] Parse multiple tables per file

### Table Rolling

- [ ] Roll on simple tables
- [ ] Roll on tables with subtables
- [ ] Handle missing subtable references
- [ ] Test recursion depth limits
- [ ] Verify subroll tracking

## Debugging Common Issues

### Parser Problems

**Symptom**: "Failed to parse Perchance block"
**Solutions**:

1. Check indentation (entries need 2+ spaces)
2. Verify section names don't have spaces
3. Ensure `output` section exists
4. Check for empty sections

**Debug**: Enable parser logging in `PerchanceParser.ts`

### File Access Issues

**Symptom**: "File system access not available"
**Solutions**:

1. Ensure running in Electron (not browser)
2. Check if `window.electronAPI` exists
3. Verify IPC handlers are registered

**Debug**: Check main process console for IPC errors

### Storage Problems

**Symptom**: Settings not persisting
**Solutions**:

1. Check if localStorage is available
2. Clear corrupted storage data
3. Verify auto-save is working

**Debug**: Monitor storage status indicator in UI

## Performance Testing

### Large Vault Testing

Create test vault with many files:

```bash
# Generate test files (Unix/Mac)
mkdir large-test-vault
for i in {1..100}; do
  echo "# Table $i" > "large-test-vault/table-$i.md"
  echo '```perchance' >> "large-test-vault/table-$i.md"
  echo "output" >> "large-test-vault/table-$i.md"
  echo "  Result $i" >> "large-test-vault/table-$i.md"
  echo '```' >> "large-test-vault/table-$i.md"
done
```

Test scenarios:

- [ ] Scan time < 5 seconds for 100 files
- [ ] UI remains responsive during scanning
- [ ] Memory usage stays reasonable
- [ ] Parse time scales linearly

## Error Testing

### Intentional Error Scenarios

1. **Invalid Perchance Syntax**:

   ```
   output
   No indented entries here
   ```

2. **Circular References**:

   ```
   output
     [table-a]

   table-a
     [table-b]

   table-b
     [table-a]
   ```

3. **Missing Subtables**:

   ```
   output
     [nonexistent-table]
   ```

### Expected Behaviors

- [ ] Errors displayed in UI without crashing
- [ ] Invalid tables skipped, valid ones parsed
- [ ] Error messages are helpful and specific
- [ ] Application remains functional after errors

## Development Workflow

### Adding New Features

1. **Update Types**: Modify `src/shared/types.ts`
2. **Add Logic**: Update parser or roller utilities
3. **Update UI**: Modify `App.tsx` components
4. **Test**: Use console tests and manual testing
5. **Document**: Update this guide if needed

### Testing New Parser Features

1. Create test markdown file in `test-vault/`
2. Add new syntax examples
3. Test parsing via "🎲 Parse Tables"
4. Check console for errors
5. Verify table structure in app state display

### Testing New Rolling Features

1. Create tables with new syntax
2. Parse tables successfully
3. Test rolling via UI
4. Check roll results and subrolls
5. Verify error handling

## Automated Testing Setup

Currently manual testing only. Future improvements:

- [ ] Unit tests for parser functions
- [ ] Integration tests for file operations
- [ ] E2E tests for complete workflows
- [ ] Performance benchmarks
- [ ] Automated error scenario testing

## Troubleshooting Quick Reference

| Issue | Check | Solution |
|-------|-------|----------|
| No tables found | File format | Ensure `perchance` code blocks |
| Parse errors | Syntax | Check indentation and structure |
| File access denied | Permissions | Select different vault folder |
| Storage not working | Browser support | Clear localStorage |
| Subtables not resolving | References | Check table names match exactly |
| App crashes | Console errors | Check main process logs |

## Useful Development Commands

```bash
# Clean build
npm run clean && npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Format code (if prettier configured)
npx prettier --write src/

# Check bundle size
npm run build:renderer && ls -la dist/
```
