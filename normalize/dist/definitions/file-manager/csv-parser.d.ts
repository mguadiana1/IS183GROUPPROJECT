import { FileManager } from './file-manager';
export declare class CSVParser {
    fileManager: FileManager;
    constructor();
    toJSON(path: string, cb: Function): void;
}
