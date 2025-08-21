import * as path from 'path';
import * as fs from 'fs';
import { TranslationServer } from './server';
import { ExtractService } from './extract-service';
import { ImportService } from './import-service';
import { ServerConfig } from './types';

export class ConfigResolver {
  static resolve(): ServerConfig {
    const projectRoot = this.findProjectRoot();
    const csvPath = path.join(projectRoot, 'i18n/translations/messages.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}
Please ensure you have the messages.csv file in i18n/translations/ directory.`);
    }
    
    return {
      port: 3029,
      csvPath,
      projectRoot
    };
  }

  private static findProjectRoot(): string {
    let currentDir = process.cwd();
    
    while (currentDir !== path.parse(currentDir).root) {
      if (fs.existsSync(path.join(currentDir, 'package.json'))) {
        const packageJson = path.join(currentDir, 'package.json');
        try {
          const content = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
          if (content.name !== '@euroins/frontend-translation') {
            return currentDir;
          }
        } catch (e) {
          // Continue searching
        }
      }
      currentDir = path.dirname(currentDir);
    }
    
    return process.cwd();
  }
}

export function startEditor(): void {
  const config = ConfigResolver.resolve();
  const server = new TranslationServer(config);
  server.start();
}

export async function runExtract(): Promise<void> {
  try {
    const projectRoot = ConfigResolver.resolve().projectRoot;
    const extractService = new ExtractService(projectRoot);
    await extractService.execute();
  } catch (error) {
    console.error('Extract failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export async function runImport(): Promise<void> {
  try {
    const projectRoot = ConfigResolver.resolve().projectRoot;
    const importService = new ImportService(projectRoot);
    await importService.execute();
  } catch (error) {
    console.error('Import failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export { TranslationServer } from './server';
export { CsvService } from './csv-service';
export { ExtractService } from './extract-service';
export { ImportService } from './import-service';
export * from './types';
