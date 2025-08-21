export declare class ImportService {
    private config;
    constructor(projectRoot: string);
    execute(): Promise<void>;
    private parseCSVContent;
    private mapLocaleColumns;
    private parseTranslationRows;
    private parseCSVLine;
    private generateJSONFiles;
    private displayStatistics;
    private ensureDirectoryExists;
    private readFileContent;
}
//# sourceMappingURL=import-service.d.ts.map