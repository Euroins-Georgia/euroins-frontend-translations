import { ServerConfig } from './types';
export declare class ConfigResolver {
    static resolve(): ServerConfig;
    private static findProjectRoot;
}
export declare function startEditor(): void;
export declare function runExtract(): Promise<void>;
export declare function runImport(): Promise<void>;
export { TranslationServer } from './server';
export { CsvService } from './csv-service';
export { ExtractService } from './extract-service';
export { ImportService } from './import-service';
export * from './types';
//# sourceMappingURL=index.d.ts.map