import * as fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { CsvData, TranslationRow } from './types';

export class CsvService {
  constructor(private csvPath: string) {}

  async read(): Promise<CsvData> {
    return new Promise((resolve, reject) => {
      const results: TranslationRow[] = [];
      let headers: string[] = [];

      fs.createReadStream(this.csvPath)
        .pipe(csv())
        .on('headers', (headerArray: string[]) => {
          headers = headerArray;
        })
        .on('data', (data: TranslationRow) => {
          results.push(data);
        })
        .on('end', () => {
          resolve({ headers, data: results });
        })
        .on('error', reject);
    });
  }

  async write(data: TranslationRow[], headers: string[]): Promise<void> {
    const csvWriter = createObjectCsvWriter({
      path: this.csvPath,
      header: headers.map(h => ({ id: h, title: h }))
    });

    await csvWriter.writeRecords(data);
  }
}
