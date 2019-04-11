import { Request, Response, NextFunction } from 'express';
export declare class author {
    _model: any;
    constructor(norm: any);
    updateAuthor(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteAuthor(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createAuthor(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getALLAuthor(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAuthorById(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    model: any;
}
