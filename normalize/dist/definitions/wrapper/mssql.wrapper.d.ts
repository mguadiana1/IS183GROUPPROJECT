/// <reference types="express" />
import { Request, Response, NextFunction } from 'express';
export declare class MSSQLWrapper {
    private options;
    private table;
    client: any;
    constructor(options: any, table: any);
    connect(config: Object): any;
    exec(req: Request, res: Response, next: NextFunction, callback: Function): void;
    query(query: String, callback: Function): any;
    prepareCreate(props: Object): string;
    createTable(schema: any, callback: Function): void;
    getAll(req: Request, res: Response, next: NextFunction, callback: Function): void;
    findById(req: Request, res: Response, next: NextFunction, callback: Function): void;
    insert(req: Request, res: Response, next: NextFunction, callback: Function): void;
    update(req: Request, res: Response, next: NextFunction, callback: Function): void;
    get(req: Request, res: Response, next: NextFunction, callback: Function): void;
    updateSet(req: Request, res: Response, next: NextFunction, callback: Function): void;
    delete(req: Request, res: Response, next: NextFunction, callback: Function): void;
    convert(value: any): any;
    prepareObject(props: Object): string;
    prepareOnClause(array: Array<Object>): string;
    prepareSelect(leftAlias: string, array: Array<string>): string;
    prepareWhere(leftAlias: string, props: Object): string;
    prepareGroup(leftAlias: string, props: Object, select: string): string;
    prepareSort(leftAlias: string, props: Object): string;
    prepareJoins(leftAlias: string, joins: Array<Object>, options: Object, includes: Array<any>): {
        query: any;
        include: string;
        where: string;
        group: string;
    };
    prepareJoin(leftAlias: string, props: Object, options: Object, includes: Array<any>): {
        options: Object;
        includes: any[];
    };
    convertToUTCDate(date: string): string;
}
