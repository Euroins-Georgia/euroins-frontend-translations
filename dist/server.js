"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationServer = void 0;
const express_1 = __importDefault(require("express"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const csv_service_1 = require("./csv-service");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class TranslationServer {
    constructor(config) {
        this.config = config;
        this.app = (0, express_1.default)();
        this.csvService = new csv_service_1.CsvService(config.csvPath);
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use(express_1.default.json({ limit: '50mb' }));
        this.app.use(express_1.default.static(path.join(__dirname, '../public')));
    }
    setupRoutes() {
        this.app.get('/api/translations', this.getTranslations.bind(this));
        this.app.post('/api/translations', this.saveTranslations.bind(this));
        this.app.post('/api/import', this.importTranslations.bind(this));
    }
    async getTranslations(req, res) {
        try {
            const csvData = await this.csvService.read();
            res.json(csvData);
        }
        catch (error) {
            console.error('Error reading CSV:', error);
            res.status(500).json({ error: 'Failed to read CSV file' });
        }
    }
    async saveTranslations(req, res) {
        try {
            const { data, headers } = req.body;
            if (!data || !headers) {
                res.status(400).json({ error: 'Invalid data format' });
                return;
            }
            await this.csvService.write(data, headers);
            res.json({ success: true, message: 'Translations saved successfully' });
        }
        catch (error) {
            console.error('Error saving CSV:', error);
            res.status(500).json({ error: 'Failed to save CSV file' });
        }
    }
    async importTranslations(req, res) {
        try {
            const { ImportService } = await Promise.resolve().then(() => __importStar(require('./import-service')));
            const importService = new ImportService(this.config.projectRoot);
            await importService.execute();
            res.json({
                success: true,
                message: 'Import completed successfully'
            });
        }
        catch (error) {
            console.error('Error running import:', error);
            res.status(500).json({
                error: 'Failed to run import command',
                details: error.message
            });
        }
    }
    start() {
        this.app.listen(this.config.port, () => {
            console.log(`Translation editor running at http://localhost:${this.config.port}`);
            console.log(`Editing file: ${this.config.csvPath}`);
        });
    }
}
exports.TranslationServer = TranslationServer;
//# sourceMappingURL=server.js.map