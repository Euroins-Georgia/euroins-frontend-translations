# Euroins Frontend Translations Package

## Overview
A complete TypeScript package for managing i18n translations in Euroins frontend projects. Provides extraction, import, and web-based editing capabilities for CSV-based translation workflows.

## Package Structure
```
euroins-frontend-translations/
├── src/                           # TypeScript source code
│   ├── types.ts                  # Core interfaces and types
│   ├── translation-types.ts      # Translation-specific types
│   ├── csv-service.ts            # CSV read/write operations
│   ├── extract-service.ts        # Translation key extraction logic
│   ├── import-service.ts         # CSV to JSON conversion
│   ├── server.ts                 # Express web server for editor
│   └── index.ts                  # Main entry point and exports
├── bin/
│   └── cli.js                    # Command line interface
├── public/                       # Web editor assets
│   ├── index.html               # Editor web interface
│   ├── styles.css               # UI styling
│   └── app.js                   # Client-side JavaScript
├── dist/                        # Compiled JavaScript (generated)
├── package.json                 # Package configuration
├── tsconfig.json               # TypeScript configuration
├── .gitignore                  # Git ignore rules
└── README.md                   # Documentation
```

## Core Features

### 1. Translation Extraction (`extract` command)
- Scans `{app,components}/**/*.{ts,tsx}` for `t("key")` patterns
- Extracts file-level and line-level context comments
- Auto-discovers country translation keys from countries.ts
- Generates/updates CSV file with all found keys
- Preserves existing translations during updates
- Reports unused keys for cleanup

### 2. Translation Import (`import` command)
- Converts CSV translations to JSON files
- Supports EN/KA locales
- Generates files in `i18n/messages/` directory
- Validates CSV structure and reports statistics
- Error handling for malformed CSV data

### 3. Web Editor (`editor` command)
- Express server on port 3029
- Clean, responsive web interface
- Read-only Key and Context columns
- Editable translation fields (EN/KA)
- Real-time save functionality
- Import button for CSV-to-JSON conversion
- Unsaved changes detection

## Technical Architecture

### SOLID Principles Implementation
- **Single Responsibility**: Each service handles one concern
- **Open/Closed**: Extensible service architecture  
- **Liskov Substitution**: Interface-based design
- **Interface Segregation**: Focused, minimal interfaces
- **Dependency Inversion**: Services depend on abstractions

### Key Classes
- `ConfigResolver`: Project root and path detection
- `ExtractService`: Translation key extraction logic
- `ImportService`: CSV to JSON conversion
- `CsvService`: Low-level CSV operations
- `TranslationServer`: Web editor server

### Data Flow
1. **Extract**: Source Code → Translation Keys → CSV File
2. **Import**: CSV File → Parsed Data → JSON Files  
3. **Editor**: CSV File ↔ Web Interface ↔ User Edits

## Installation & Usage

### GitHub Installation
```bash
npm install git+https://github.com/Euroins-Georgia/euroins-frontend-translations.git
```

### Available Commands
```bash
# Extract translation keys from source code
npm run translations:extract
npx euroins-translations extract

# Convert CSV to JSON files
npm run translations:import  
npx euroins-translations import

# Open web editor
npm run translations:editor
npx euroins-translations editor
```

### Project Requirements
- Node.js >= 16.0.0
- Project structure with `i18n/translations/messages.csv`
- Translation keys using `t("key")` pattern in source code
- Output directory: `i18n/messages/` for JSON files

## Configuration

### Hardcoded Paths (Internal Package)
- CSV file: `i18n/translations/messages.csv`
- Source pattern: `{app,components}/**/*.{ts,tsx}`
- Output directory: `i18n/messages/`
- Supported locales: `['en', 'ka']`
- Web editor port: `3029`

### Auto-Detection
- Project root discovery (excludes package directory)
- Context extraction from comments
- Country code pattern recognition
- Unused key identification

## Dependencies

### Runtime
- `express`: Web server for editor interface
- `csv-parser`: CSV file parsing
- `csv-writer`: CSV file generation
- `commander`: CLI argument parsing
- `glob`: File pattern matching

### Development  
- `typescript`: Type checking and compilation
- `@types/*`: Type definitions

## Build Process
1. TypeScript compilation (`tsc`)
2. Output to `dist/` directory
3. Preserve `bin/` and `public/` folders
4. Ready for npm installation

## Error Handling
- Graceful CSV parsing failures
- Missing file detection
- Project root validation
- Clear error messages
- Process exit codes for CI/CD

## Future Extensibility
- Additional locale support
- Custom source patterns
- Configurable paths
- Plugin architecture
- Advanced context extraction

This package provides a complete, production-ready solution for managing translations in Euroins frontend projects with minimal configuration and maximum automation.
