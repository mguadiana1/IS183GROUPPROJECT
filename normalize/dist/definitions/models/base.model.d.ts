import { BaseController } from '../controllers/base.controller';
import { BaseRouter } from '../routes/base.router';
import { FileManager } from '../file-manager/file-manager';
export interface IModel {
    controller: BaseController;
    router: BaseRouter;
    schema: any;
}
export interface IRoute {
    route: string;
    method: string;
    callback: any;
    requireToken: boolean;
}
export declare class BaseModel {
    options: any;
    name: string;
    private schema;
    description: any;
    private customRoutes;
    api: any;
    model: IModel;
    fileManager: FileManager;
    static failedAttempts: any;
    repeats: any;
    circular: boolean;
    ready: boolean;
    constructor(options: any, name: string, schema: any, description?: any, customRoutes?: Array<any>, api?: any);
    init(): Promise<{}>;
    route(path: string, method: string, cb: Function, requireToken?: boolean): void;
    private extend(name, schema);
    private make(name, schema, customRoutes);
    private checkTableExist(ctrl, name);
    private buildTable(name, schema, desc);
    private recreate(table, fTable, schema, desc);
    private checkCircular(fTable);
    private resolveModels();
    seed(dir: any, table: any): Promise<{}>;
    getNiceName(str: string): string;
}
