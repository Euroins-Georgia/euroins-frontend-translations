import * as fs from 'fs';
import * as path from 'path';
import { TranslationConfig, TranslationKey, TranslationMap } from './translation-types';

export class ExtractService {
  private config: TranslationConfig;

  constructor(projectRoot: string) {
    this.config = {
      sourcePattern: '{app,components}/**/*.{ts,tsx}',
      outputDir: 'i18n/translations',
      csvFile: 'i18n/translations/messages.csv',
      supportedLocales: ['en', 'ka'],
      messagesDir: 'i18n/messages',
      projectRoot
    };
  }

  async execute(): Promise<void> {
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

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private async extractFromWorkspace(): Promise<Map<string, string>> {
    const { glob } = await import('glob');
    const files = await glob(this.config.sourcePattern, { cwd: this.config.projectRoot });
    const translationKeys = new Map<string, string>();

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

  private extractFromFile(filePath: string): TranslationKey[] {
    const content = this.readFileContent(filePath);
    if (!content) return [];

    const lines = content.split('\n');
    const fileContext = this.extractFileContext(lines);
    const translationKeys: TranslationKey[] = [];

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

  private extractFileContext(lines: string[]): string {
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

  private extractLineContext(currentLine: string, previousLine?: string): string {
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

  private extractKeysFromLine(line: string): string[] {
    const tFunctionRegex = /\bt\s*\(\s*[`'"]([^`'"]*)[`'"]\s*\)/g;
    const keys: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = tFunctionRegex.exec(line)) !== null) {
      const key = match[1];
      if (key && !key.includes('${')) {
        keys.push(key);
      }
    }

    return keys;
  }

  private addCountryKeys(translationKeys: Map<string, string>): void {
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

  private loadExistingCountryKeys(translationKeys: Map<string, string>): void {
    const csvPath = path.join(this.config.projectRoot, this.config.csvFile);
    const csvContent = this.readFileContent(csvPath);
    if (!csvContent) return;

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
    } catch (error) {
      console.warn('Warning: Could not read existing CSV file for country keys');
    }
  }

  private extractNewCountryKeys(content: string, translationKeys: Map<string, string>): number {
    const countryCodeRegex = /['"]([A-Z]{2})['"]:\s*\{/g;
    let addedCount = 0;
    let match: RegExpExecArray | null;

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

  private findUnusedKeys(currentKeys: Map<string, string>): string[] {
    const csvPath = path.join(this.config.projectRoot, this.config.csvFile);
    const csvContent = this.readFileContent(csvPath);
    if (!csvContent) return [];

    try {
      const existingKeys = this.extractKeysFromCSV(csvContent);
      const currentKeySet = new Set(currentKeys.keys());

      return Array.from(existingKeys).filter(key => !currentKeySet.has(key));
    } catch (error) {
      console.warn('Warning: Could not read existing CSV file to check for unused keys');
      return [];
    }
  }

  private extractKeysFromCSV(csvContent: string): Set<string> {
    const existingKeys = new Set<string>();
    const csvLines = csvContent.split('\n');

    for (let i = 1; i < csvLines.length; i++) {
      const line = csvLines[i].trim();
      if (!line) continue;

      const keyMatch = line.match(/^"([^"]+)"/);
      if (keyMatch) {
        existingKeys.add(keyMatch[1]);
      }
    }

    return existingKeys;
  }

  private generateCSV(translationKeys: Map<string, string>): void {
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

  private loadFromJsonFiles(): TranslationMap {
    const translations: TranslationMap = {};

    this.config.supportedLocales.forEach(locale => {
      const filePath = path.join(this.config.projectRoot, this.config.messagesDir, `${locale}.json`);
      const jsonContent = this.parseJsonFile(filePath);
      
      if (jsonContent) {
        translations[locale] = this.flattenObject(jsonContent);
      } else {
        console.warn(`Warning: Could not parse ${filePath}`);
        translations[locale] = {};
      }
    });

    return translations;
  }

  private loadFromCSV(): TranslationMap {
    const translations: TranslationMap = {};
    
    this.config.supportedLocales.forEach(locale => {
      translations[locale] = {};
    });

    const csvPath = path.join(this.config.projectRoot, this.config.csvFile);
    const csvContent = this.readFileContent(csvPath);
    if (!csvContent) return translations;

    try {
      const csvLines = csvContent.split('\n');
      if (csvLines.length <= 1) return translations;

      const headers = csvLines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
      const localeIndices: Record<string, number> = {};
      
      this.config.supportedLocales.forEach(locale => {
        const index = headers.findIndex(h => h.toUpperCase() === locale.toUpperCase());
        if (index !== -1) {
          localeIndices[locale] = index;
        }
      });

      for (let i = 1; i < csvLines.length; i++) {
        const line = csvLines[i].trim();
        if (!line) continue;

        const columns = this.parseCSVLine(line);
        if (columns.length === 0) continue;

        const key = columns[0];
        this.config.supportedLocales.forEach(locale => {
          const index = localeIndices[locale];
          if (index !== undefined && columns[index]) {
            translations[locale][key] = columns[index];
          }
        });
      }
    } catch (error) {
      console.warn('Warning: Could not read existing CSV file for translations');
    }

    return translations;
  }

  private buildCSVContent(
    sortedKeys: TranslationKey[],
    jsonTranslations: TranslationMap,
    csvTranslations: TranslationMap
  ): string {
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

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private formatCSVValue(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private readFileContent(filePath: string): string | null {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }
  }

  private parseJsonFile(filePath: string): any {
    const content = this.readFileContent(filePath);
    if (!content) return null;

    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private flattenObject(obj: any, prefix = ''): Record<string, string> {
    const flattened: Record<string, string> = {};

    for (const key in obj) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }
}
