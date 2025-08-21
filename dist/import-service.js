"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ImportService {
    constructor(projectRoot) {
        this.config = {
            csvFile: 'i18n/translations/messages.csv',
            messagesDir: 'i18n/messages',
            supportedLocales: ['en', 'ka'],
            projectRoot
        };
    }
    async execute() {
        console.log('Importing translations from CSV...');
        const csvPath = path.join(this.config.projectRoot, this.config.csvFile);
        if (!fs.existsSync(csvPath)) {
            console.error(`CSV file not found: ${csvPath}`);
            console.log('Run "npx euroins-translations extract" first!');
            process.exit(1);
        }
        const csvContent = this.readFileContent(csvPath);
        if (!csvContent) {
            console.error('Failed to read CSV file');
            process.exit(1);
        }
        const translations = this.parseCSVContent(csvContent);
        this.displayStatistics(translations);
        this.generateJSONFiles(translations);
        console.log('\nTranslation import completed!');
    }
    parseCSVContent(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            throw new Error('CSV file is empty');
        }
        const headers = this.parseCSVLine(lines[0]);
        const localeColumns = this.mapLocaleColumns(headers);
        return this.parseTranslationRows(lines.slice(1), localeColumns);
    }
    mapLocaleColumns(headers) {
        const localeColumns = {};
        this.config.supportedLocales.forEach(locale => {
            const index = headers.findIndex(h => h.toLowerCase() === locale);
            if (index !== -1) {
                localeColumns[locale] = index;
            }
        });
        return localeColumns;
    }
    parseTranslationRows(rows, localeColumns) {
        const translations = {};
        this.config.supportedLocales.forEach(locale => {
            translations[locale] = {};
        });
        rows.forEach(line => {
            const row = this.parseCSVLine(line);
            const key = row[0];
            if (!key)
                return;
            this.config.supportedLocales.forEach(locale => {
                const columnIndex = localeColumns[locale];
                if (columnIndex !== undefined && row[columnIndex]) {
                    translations[locale][key] = row[columnIndex];
                }
            });
        });
        return translations;
    }
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
    generateJSONFiles(translations) {
        console.log('Generating JSON files...');
        const messagesDir = path.join(this.config.projectRoot, this.config.messagesDir);
        this.ensureDirectoryExists(messagesDir);
        this.config.supportedLocales.forEach(locale => {
            const filePath = path.join(messagesDir, `${locale}.json`);
            const content = JSON.stringify(translations[locale], null, 2);
            fs.writeFileSync(filePath, content);
            console.log(`Generated: ${filePath}`);
        });
    }
    displayStatistics(translations) {
        this.config.supportedLocales.forEach(locale => {
            const count = Object.keys(translations[locale] || {}).length;
            console.log(`${locale.toUpperCase()}: ${count} translations`);
        });
    }
    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    readFileContent(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        }
        catch {
            return null;
        }
    }
}
exports.ImportService = ImportService;
//# sourceMappingURL=import-service.js.map