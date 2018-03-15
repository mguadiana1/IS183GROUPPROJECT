import { Encryptor } from '../encryption/encryptor';
export declare class MSSQLToPG {
    api: any;
    tables: Array<Object>;
    options: Object;
    db: any;
    static legacyDB: any;
    static encryptor: Encryptor;
    constructor(options: any, tables: Array<Object>, api: any);
    run(): void;
    private connect(config);
    static getType(attribute: any, array: any): any;
    static convertToUTCDate(date: any): any;
    static sanitize(string: any): any;
    static prepareCreate(row: Object): string;
    static encrypt(prop: string, value: any, secretFields: any): any;
    private migrate(table);
    dropTableIfExistThenMigrate(tables: Array<Object>, migrate: Function): void;
}
