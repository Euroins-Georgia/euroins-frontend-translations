import express from 'express';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { CsvService } from './csv-service';
import { ServerConfig } from './types';

const execAsync = promisify(exec);

export class TranslationServer {
  private app: express.Application;
  private csvService: CsvService;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.app = express();
    this.csvService = new CsvService(config.csvPath);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  private setupRoutes(): void {
    this.app.get('/api/translations', this.getTranslations.bind(this));
    this.app.post('/api/translations', this.saveTranslations.bind(this));
    this.app.post('/api/import', this.importTranslations.bind(this));
  }

  private async getTranslations(req: express.Request, res: express.Response): Promise<void> {
    try {
      const csvData = await this.csvService.read();
      res.json(csvData);
    } catch (error) {
      console.error('Error reading CSV:', error);
      res.status(500).json({ error: 'Failed to read CSV file' });
    }
  }

  private async saveTranslations(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { data, headers } = req.body;
      
      if (!data || !headers) {
        res.status(400).json({ error: 'Invalid data format' });
        return;
      }

      await this.csvService.write(data, headers);
      res.json({ success: true, message: 'Translations saved successfully' });
    } catch (error) {
      console.error('Error saving CSV:', error);
      res.status(500).json({ error: 'Failed to save CSV file' });
    }
  }

  private async importTranslations(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { ImportService } = await import('./import-service');
      const importService = new ImportService(this.config.projectRoot);
      
      await importService.execute();
      
      res.json({ 
        success: true, 
        message: 'Import completed successfully'
      });
    } catch (error: any) {
      console.error('Error running import:', error);
      res.status(500).json({ 
        error: 'Failed to run import command',
        details: error.message 
      });
    }
  }

  start(): void {
    this.app.listen(this.config.port, () => {
      console.log(`Translation editor running at http://localhost:${this.config.port}`);
      console.log(`Editing file: ${this.config.csvPath}`);
    });
  }
}
