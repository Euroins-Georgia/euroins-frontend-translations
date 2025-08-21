import { ServerConfig } from './types';
export declare class TranslationServer {
    private app;
    private csvService;
    private config;
    constructor(config: ServerConfig);
    private setupMiddleware;
    private setupRoutes;
    private getTranslations;
    private saveTranslations;
    private importTranslations;
    start(): void;
}
//# sourceMappingURL=server.d.ts.map