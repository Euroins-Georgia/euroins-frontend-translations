export interface TranslationRow {
    Key: string;
    Context: string;
    EN: string;
    KA: string;
}
export interface CsvData {
    headers: string[];
    data: TranslationRow[];
}
export interface ServerConfig {
    port: number;
    csvPath: string;
    projectRoot: string;
}
//# sourceMappingURL=types.d.ts.map