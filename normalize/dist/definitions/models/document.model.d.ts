/// <reference types="express" />
import { Request, Response, NextFunction } from 'express';
import { BaseModel } from './base.model';
export declare class Document extends BaseModel {
    options: any;
    name: string;
    api: any;
    constructor(options: any, name: string, api: any);
    insert: (req: Request, res: Response, next: NextFunction) => void;
    removeDocument: (req: Request, res: Response, next: NextFunction) => void;
    getDocument: (req: Request, res: Response, next: NextFunction) => any;
    saveDocument: (req: Request, res: Response, next: NextFunction) => any;
}
