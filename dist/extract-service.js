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
exports.ExtractService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ExtractService {
    constructor(projectRoot) {
        this.config = {
            sourcePattern: '{app,components}/**/*.{ts,tsx}',
            outputDir: 'i18n/translations',
            csvFile: 'i18n/translations/messages.csv',
            supportedLocales: ['en', 'ka'],
            messagesDir: 'i18n/messages',
            projectRoot
        };
    }
    async execute() {
        console.log('Starting translation extraction...');
        this.ensureDirectoryExists(path.join(this.config.projectRoot, this.config.outputDir));
        const translationKeys = await this.extractFromWorkspace();
        if (translationKeys.size === 0) {
            console.log('No translation keys found!');
            return;
        }
        console.log(`Found ${translationKeys.size} unique translation keys`);
        this.addCountryKeys(translationKeys);
        const removedKeys = this.findUnusedKeys(translationKeys);
        this.generateCSV(translationKeys);
        if (removedKeys.length > 0) {
            console.log(`\nRemoved ${removedKeys.length} unused keys:`);
            removedKeys.forEach(key => console.log(`  - ${key}`));
        }
        console.log('\nTranslation extraction completed!');
    }
    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    async extractFromWorkspace() {
        const { glob } = await Promise.resolve().then(() => __importStar(require('glob')));
        const files = await glob(this.config.sourcePattern, { cwd: this.config.projectRoot });
        const translationKeys = new Map();
        console.log('Scanning files for translation keys...');
        files.forEach(file => {
            const fullPath = path.join(this.config.projectRoot, file);
            const extractedKeys = this.extractFromFile(fullPath);
            extractedKeys.forEach(({ key, context }) => {
                if (!translationKeys.has(key) || (context && context !== '')) {
                    translationKeys.set(key, context);
                }
            });
        });
        return translationKeys;
    }
    extractFromFile(filePath) {
        const content = this.readFileContent(filePath);
        if (!content)
            return [];
        const lines = content.split('\n');
        const fileContext = this.extractFileContext(lines);
        const translationKeys = [];
        lines.forEach((line, lineIndex) => {
            const previousLine = lineIndex > 0 ? lines[lineIndex - 1] : undefined;
            const lineContext = this.extractLineContext(line, previousLine);
            const context = lineContext || fileContext;
            const matches = this.extractKeysFromLine(line);
            matches.forEach(key => {
                translationKeys.push({ key, context });
            });
        });
        return translationKeys;
    }
    extractFileContext(lines) {
        const fileContextPattern = /(?:\/\/\s*@context[:\s]+(.+)|\/\*\s*@context[:\s]+([^*]+)\*\/)/i;
        const searchDepth = Math.min(10, lines.length);
        for (let i = 0; i < searchDepth; i++) {
            const match = lines[i].match(fileContextPattern);
            if (match) {
                return (match[1] || match[2]).trim();
            }
        }
        return '';
    }
    extractLineContext(currentLine, previousLine) {
        const inlinePattern = /\/\*\s*Context[:\s]+([^*]+)\*\//i;
        const linePattern = /(?:\/\/\s*Context[:\s]+(.+)|\/\*\s*Context[:\s]+([^*]+)\*\/)/i;
        const inlineMatch = currentLine.match(inlinePattern);
        if (inlineMatch) {
            return inlineMatch[1].trim();
        }
        if (previousLine) {
            const prevLineMatch = previousLine.match(linePattern);
            if (prevLineMatch) {
                return (prevLineMatch[1] || prevLineMatch[2]).trim();
            }
        }
        return '';
    }
    extractKeysFromLine(line) {
        const tFunctionRegex = /\bt\s*\(\s*[`'"]([^`'"]*)[`'"]\s*\)/g;
        const keys = [];
        let match;
        while ((match = tFunctionRegex.exec(line)) !== null) {
            const key = match[1];
            if (key && !key.includes('${')) {
                keys.push(key);
            }
        }
        return keys;
    }
    addCountryKeys(translationKeys) {
        console.log('Adding country translation keys...');
        const countriesPath = path.join(this.config.projectRoot, 'lib/utils/countries.ts');
        const countriesContent = this.readFileContent(countriesPath);
        if (!countriesContent) {
            console.log('Countries file not found, skipping country translations');
            return;
        }
        this.loadExistingCountryKeys(translationKeys);
        const addedCount = this.extractNewCountryKeys(countriesContent, translationKeys);
        console.log(`Added ${addedCount} new country translation keys`);
    }
    loadExistingCountryKeys(translationKeys) {
        const csvPath = path.join(this.config.projectRoot, this.config.csvFile);
        const csvContent = this.readFileContent(csvPath);
        if (!csvContent)
            return;
        try {
            const csvLines = csvContent.split('\n');
            for (let i = 1; i < csvLines.length; i++) {
                const line = csvLines[i].trim();
                if (line && line.startsWith('"country')) {
                    const keyMatch = line.match(/^"(country[A-Z]{2})"/);
                    if (keyMatch) {
                        translationKeys.set(keyMatch[1], 'Countries');
                    }
                }
            }
        }
        catch (error) {
            console.warn('Warning: Could not read existing CSV file for country keys');
        }
    }
    extractNewCountryKeys(content, translationKeys) {
        const countryCodeRegex = /\b([A-Z]{2}):\s*\{/g;
        let addedCount = 0;
        let match;
        while ((match = countryCodeRegex.exec(content)) !== null) {
            const countryCode = match[1];
            const translationKey = `country${countryCode}`;
            if (!translationKeys.has(translationKey)) {
                translationKeys.set(translationKey, 'Countries');
                addedCount++;
            }
        }
        return addedCount;
    }
    findUnusedKeys(currentKeys) {
        const csvPath = path.join(this.config.projectRoot, this.config.csvFile);
        const csvContent = this.readFileContent(csvPath);
        if (!csvContent)
            return [];
        try {
            const existingKeys = this.extractKeysFromCSV(csvContent);
            const currentKeySet = new Set(currentKeys.keys());
            return Array.from(existingKeys).filter(key => !currentKeySet.has(key));
        }
        catch (error) {
            console.warn('Warning: Could not read existing CSV file to check for unused keys');
            return [];
        }
    }
    extractKeysFromCSV(csvContent) {
        const existingKeys = new Set();
        const csvLines = csvContent.split('\n');
        for (let i = 1; i < csvLines.length; i++) {
            const line = csvLines[i].trim();
            if (!line)
                continue;
            const keyMatch = line.match(/^"([^"]+)"/);
            if (keyMatch) {
                existingKeys.add(keyMatch[1]);
            }
        }
        return existingKeys;
    }
    generateCSV(translationKeys) {
        console.log('Generating CSV file...');
        const sortedKeys = Array.from(translationKeys.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, context]) => ({ key, context }));
        const jsonTranslations = this.loadFromJsonFiles();
        const csvTranslations = this.loadFromCSV();
        const csvContent = this.buildCSVContent(sortedKeys, jsonTranslations, csvTranslations);
        const csvPath = path.join(this.config.projectRoot, this.config.csvFile);
        fs.writeFileSync(csvPath, csvContent);
        console.log(`CSV file generated: ${csvPath}`);
    }
    loadFromJsonFiles() {
        const translations = {};
        this.config.supportedLocales.forEach(locale => {
            const filePath = path.join(this.config.projectRoot, this.config.messagesDir, `${locale}.json`);
            const jsonContent = this.parseJsonFile(filePath);
            if (jsonContent) {
                translations[locale] = this.flattenObject(jsonContent);
            }
            else {
                console.warn(`Warning: Could not parse ${filePath}`);
                translations[locale] = {};
            }
        });
        return translations;
    }
    loadFromCSV() {
        const translations = {};
        this.config.supportedLocales.forEach(locale => {
            translations[locale] = {};
        });
        const csvPath = path.join(this.config.projectRoot, this.config.csvFile);
        const csvContent = this.readFileContent(csvPath);
        if (!csvContent)
            return translations;
        try {
            const csvLines = csvContent.split('\n');
            if (csvLines.length <= 1)
                return translations;
            const headers = csvLines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
            const localeIndices = {};
            this.config.supportedLocales.forEach(locale => {
                const index = headers.findIndex(h => h.toUpperCase() === locale.toUpperCase());
                if (index !== -1) {
                    localeIndices[locale] = index;
                }
            });
            for (let i = 1; i < csvLines.length; i++) {
                const line = csvLines[i].trim();
                if (!line)
                    continue;
                const columns = this.parseCSVLine(line);
                if (columns.length === 0)
                    continue;
                const key = columns[0];
                this.config.supportedLocales.forEach(locale => {
                    const index = localeIndices[locale];
                    if (index !== undefined && columns[index]) {
                        translations[locale][key] = columns[index];
                    }
                });
            }
        }
        catch (error) {
            console.warn('Warning: Could not read existing CSV file for translations');
        }
        return translations;
    }
    buildCSVContent(sortedKeys, jsonTranslations, csvTranslations) {
        const headers = ['Key', 'Context', ...this.config.supportedLocales.map(l => l.toUpperCase())];
        const rows = [headers.join(',')];
        sortedKeys.forEach(({ key, context }) => {
            const formattedContext = this.formatCSVValue(context);
            const translations = this.config.supportedLocales.map(locale => {
                const existing = jsonTranslations[locale]?.[key] || csvTranslations[locale]?.[key] || '';
                return this.formatCSVValue(existing);
            });
            rows.push(`${this.formatCSVValue(key)},${formattedContext},${translations.join(',')}`);
        });
        return rows.join('\n');
    }
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
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
    formatCSVValue(value) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    readFileContent(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        }
        catch {
            return null;
        }
    }
    parseJsonFile(filePath) {
        const content = this.readFileContent(filePath);
        if (!content)
            return null;
        try {
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    flattenObject(obj, prefix = '') {
        const flattened = {};
        for (const key in obj) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenObject(value, newKey));
            }
            else {
                flattened[newKey] = value;
            }
        }
        return flattened;
    }
}
exports.ExtractService = ExtractService;
//# sourceMappingURL=extract-service.js.map