import { CsvData, TranslationRow } from './types';
export declare class CsvService {
    private csvPath;
    constructor(csvPath: string);
    read(): Promise<CsvData>;
    write(data: TranslationRow[], headers: string[]): Promise<void>;
}
//# sourceMappingURL=csv-service.d.ts.map