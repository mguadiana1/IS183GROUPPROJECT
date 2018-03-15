export declare class FileManager {
    private fileReader;
    constructor();
    createTmpFile(data: any, dataType: string, prefix: string): any;
    readStream(file: string, options: any, cb: Function): void;
    readDir(folder: string, cb: Function): void;
    readFile(filePath: string, encoding: string, cb: Function): void;
    readFileSync(filePath: string, encoding: string, options?: Object): any;
    deleteFile(filePath: string, options?: Object): any;
    base64Encode(file: any): string;
    base64Decode(base64str: any, file: any): void;
    base64ToBufferToJson(base64: any): any;
    isFileExist(fullFilePath: any): any;
    getFileStats(fileName: string): any;
    test(dir: string): void;
}
