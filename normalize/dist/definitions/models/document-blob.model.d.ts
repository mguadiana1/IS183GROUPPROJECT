/// <reference types="express" />
import { Request, Response, NextFunction } from 'express';
import { BaseModel } from './base.model';
export declare class DocumentBlob extends BaseModel {
    options: any;
    name: string;
    api: any;
    constructor(options: any, name: string, api: any);
    insert: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    getAll: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    findById: (req: Request, res: Response, next: NextFunction) => Promise<any>;
    static sanitize(string: any): any;
    generateID(): string;
    random(): string;
    chunkString(str: any, length: any): any;
}
