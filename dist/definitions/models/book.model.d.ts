import { Request, Response, NextFunction } from 'express';
export declare class Book {
    _model: any;
    constructor(norm: any);
    updateBook(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteBook(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createBook(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getALLBooks(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getBookById(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    model: any;
}
