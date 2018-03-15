/// <reference types="express" />
import { Request, Response, NextFunction } from 'express';
import { Encryptor } from '../encryption/encryptor';
export declare class PSQLWrapper {
    private options;
    private table;
    private model;
    api: any;
    client: any;
    static encryptor: Encryptor;
    constructor(options: any, table: any, model: any, api: any);
    connect(callback: Function): void;
    exec(req: Request, res: Response, next: NextFunction, callback: Function): void;
    encrypt(prop: string, value: any, secretFields: any): any;
    query(query: String, cb?: Function): Promise<{}>;
    prepareCreate(props: Object): string;
    checkTableExist(): Promise<{}>;
    updateSchema(updateObj: any): Promise<{}>;
    updateSchemas(updateSchema: any): Promise<{}>;
    checkForUpdates(schema: any): Promise<{}>;
    createTable(schema: any, schemaPayload: any, cb: Function): Promise<void>;
    create(schema: any, schemaPayload: any, tbl?: any): Promise<{}>;
    insertSchema(schemaPayload: any, table: any): Promise<any>;
    checkAndDecrypt(data: any, secretFields: any): any;
    getAll(req: Request, res: Response, next: NextFunction, callback: Function): void;
    findById(req: Request, res: Response, next: NextFunction, callback: Function): void;
    bulkInsert(req: Request, res: Response, next: NextFunction, cb?: Function): any;
    insert(req: Request, res: Response, next: NextFunction, cb?: Function): any;
    update(req: Request, res: Response, next: NextFunction, callback: Function): void;
    mapTableAlias(getReq: any, aliasMap: any): any;
    select(req: Request, res: Response, next: NextFunction, callback: Function, prevAliasMap: any, prevQuery?: any): string;
    get(req: Request, res: Response, next: NextFunction, callback: Function, prevQuery?: any): string;
    executeQuery(req: Request, res: Response, next: NextFunction, query: any, callback?: any): void;
    getAggCount(get: Array<any>): number;
    setSortOrderStartingByVal(reqSortPayload: Object, sortValue: any): Object;
    updateSet(req: Request, res: Response, next: NextFunction, cb: Function): void;
    getAffectedRows(secretFields: any, respRows: any): Promise<{}>;
    delete(req: Request, res: Response, next: NextFunction, cb?: Function): void;
    deleteWhere(req: Request, res: Response, next: NextFunction, cb?: Function): void;
    sanitize(string: any): any;
    convert(value: any, wrapStrings: boolean): any;
    prepareObject(type: string, props: Object, secretFields: Array<any>): string;
    prepareOnClause(array: Array<Object>, aliasMap: any, table: any, rootAlias: any, alias: any): string;
    prepareAggregate(selectItem: any): {
        args: any;
        aggFunc: any;
    };
    prepareSelect(table: string, leftAlias: string, array: Array<string>, distinct: any, secretFields: any, aliasMap?: any, prev?: any): any;
    prepareCondString(leftAlias: string, cond: any, prop: string, value: any, secretFields: any, aliasMap: any, prevAliasMap: any): any;
    prepareWhere(leftAlias: string, props: Object, secretFields: any, aliasMap?: any, prevAliasMap?: any): string;
    prepareGroup(leftAlias: string, props: Object, select: string): string;
    prepareSort(leftAlias: string, props: Object, secretFields: any): string;
    prepareJoins(leftAlias: string, aliasMap: any, joins: Array<Object>, options: Object, includes: Array<any>, joinStart: boolean, isSub: boolean, secretFields: any): {
        subJoin: any;
        query: any;
        include: any;
        where: string;
        group: string;
    };
    prepareJoinQuery(options: any, includes: any): {
        subJoin: any;
        query: any;
        include: any;
        where: string;
        group: string;
    };
    prepareJoin(leftAlias: string, aliasMap: any, props: Object, arr: any, options: Object, includes: Array<any>, start: boolean, isSubStart: boolean, isSubEnd: boolean, secretFields: any): {
        options: Object;
        includes: any[];
    };
    getTotalCount(req: Request, res: Response, next: NextFunction, cb?: Function): void;
    convertToUTCDate(date: string): string;
    buildInsertObj(body: any): {};
    setUpdateProp(obj: Object): Object;
    setCreatedProp(obj: Object): Object;
    isSecretField(secretFields: any, prop: any): boolean;
}
