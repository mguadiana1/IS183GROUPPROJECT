export declare class PLV8 {
    private pg;
    private dbName;
    constructor(pg: any, dbName: any);
    private setup();
    init(): Promise<{}>;
    private createV8Extension();
    private setStartProcess(process, dbName);
    fetchCode(path: any): Promise<{}>;
    private PLV8Init(dbName);
    create(createQuery: string): Promise<{}>;
    existCheck(table: string, key: any, value: string): Promise<{}>;
    insertModule(moduleName: string, autoload: boolean, code: any): Promise<{}>;
}
