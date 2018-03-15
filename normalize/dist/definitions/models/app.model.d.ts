/// <reference types="express" />
import { BaseModel } from './base.model';
import { Request, Response, NextFunction } from 'express';
export declare class App extends BaseModel {
    options: any;
    name: string;
    api: any;
    constructor(options: any, name: string, api: any);
    getLogo: (req: Request, res: Response, next: NextFunction) => Promise<string>;
    getAll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getApi: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createApi: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
