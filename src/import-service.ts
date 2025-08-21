import * as fs from 'fs';
import * as path from 'path';

interface ImportConfig {
  readonly csvFile: string;
  readonly messagesDir: string;
  readonly supportedLocales: readonly string[];
  readonly projectRoot: string;
}

interface ParsedTranslations {
  [locale: string]: Record<string, string>;
}

export class ImportService {
  private config: ImportConfig;

  constructor(projectRoot: string) {
    this.config = {
      csvFile: 'i18n/translations/messages.csv',
      messagesDir: 'i18n/messages',
      supportedLocales: ['en', 'ka'],
      projectRoot
    };
  }

  async execute(): Promise<void> {
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

  private parseCSVContent(content: string): ParsedTranslations {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = this.parseCSVLine(lines[0]);
    const localeColumns = this.mapLocaleColumns(headers);
    
    return this.parseTranslationRows(lines.slice(1), localeColumns);
  }

  private mapLocaleColumns(headers: string[]): Record<string, number> {
    const localeColumns: Record<string, number> = {};
    
    this.config.supportedLocales.forEach(locale => {
      const index = headers.findIndex(h => h.toLowerCase() === locale);
      if (index !== -1) {
        localeColumns[locale] = index;
      }
    });

    return localeColumns;
  }

  private parseTranslationRows(
    rows: string[],
    localeColumns: Record<string, number>
  ): ParsedTranslations {
    const translations: ParsedTranslations = {};
    
    this.config.supportedLocales.forEach(locale => {
      translations[locale] = {};
    });

    rows.forEach(line => {
      const row = this.parseCSVLine(line);
      const key = row[0];

      if (!key) return;

      this.config.supportedLocales.forEach(locale => {
        const columnIndex = localeColumns[locale];
        if (columnIndex !== undefined && row[columnIndex]) {
          translations[locale][key] = row[columnIndex];
        }
      });
    });

    return translations;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
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

  private generateJSONFiles(translations: ParsedTranslations): void {
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

  private displayStatistics(translations: ParsedTranslations): void {
    this.config.supportedLocales.forEach(locale => {
      const count = Object.keys(translations[locale] || {}).length;
      console.log(`${locale.toUpperCase()}: ${count} translations`);
    });
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private readFileContent(filePath: string): string | null {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }
  }
}
