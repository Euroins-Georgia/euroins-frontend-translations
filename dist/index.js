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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = exports.ExtractService = exports.CsvService = exports.TranslationServer = exports.ConfigResolver = void 0;
exports.startEditor = startEditor;
exports.runExtract = runExtract;
exports.runImport = runImport;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const server_1 = require("./server");
const extract_service_1 = require("./extract-service");
const import_service_1 = require("./import-service");
class ConfigResolver {
    static resolve() {
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
    static findProjectRoot() {
        let currentDir = process.cwd();
        while (currentDir !== path.parse(currentDir).root) {
            if (fs.existsSync(path.join(currentDir, 'package.json'))) {
                const packageJson = path.join(currentDir, 'package.json');
                try {
                    const content = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
                    if (content.name !== '@euroins/frontend-translation') {
                        return currentDir;
                    }
                }
                catch (e) {
                    // Continue searching
                }
            }
            currentDir = path.dirname(currentDir);
        }
        return process.cwd();
    }
}
exports.ConfigResolver = ConfigResolver;
function startEditor() {
    const config = ConfigResolver.resolve();
    const server = new server_1.TranslationServer(config);
    server.start();
}
async function runExtract() {
    try {
        const projectRoot = ConfigResolver.resolve().projectRoot;
        const extractService = new extract_service_1.ExtractService(projectRoot);
        await extractService.execute();
    }
    catch (error) {
        console.error('Extract failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
async function runImport() {
    try {
        const projectRoot = ConfigResolver.resolve().projectRoot;
        const importService = new import_service_1.ImportService(projectRoot);
        await importService.execute();
    }
    catch (error) {
        console.error('Import failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
var server_2 = require("./server");
Object.defineProperty(exports, "TranslationServer", { enumerable: true, get: function () { return server_2.TranslationServer; } });
var csv_service_1 = require("./csv-service");
Object.defineProperty(exports, "CsvService", { enumerable: true, get: function () { return csv_service_1.CsvService; } });
var extract_service_2 = require("./extract-service");
Object.defineProperty(exports, "ExtractService", { enumerable: true, get: function () { return extract_service_2.ExtractService; } });
var import_service_2 = require("./import-service");
Object.defineProperty(exports, "ImportService", { enumerable: true, get: function () { return import_service_2.ImportService; } });
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map