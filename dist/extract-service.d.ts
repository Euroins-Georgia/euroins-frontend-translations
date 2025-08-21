export declare class ExtractService {
    private config;
    constructor(projectRoot: string);
    execute(): Promise<void>;
    private ensureDirectoryExists;
    private extractFromWorkspace;
    private extractFromFile;
    private extractFileContext;
    private extractLineContext;
    private extractKeysFromLine;
    private addCountryKeys;
    private loadExistingCountryKeys;
    private extractNewCountryKeys;
    private findUnusedKeys;
    private extractKeysFromCSV;
    private generateCSV;
    private loadFromJsonFiles;
    private loadFromCSV;
    private buildCSVContent;
    private parseCSVLine;
    private formatCSVValue;
    private readFileContent;
    private parseJsonFile;
    private flattenObject;
}
//# sourceMappingURL=extract-service.d.ts.map