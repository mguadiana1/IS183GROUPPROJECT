import { Request, Response, NextFunction } from 'express';
export declare class Publisher {
    _model: any;
    constructor(norm: any);
    updatePublisher(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deletePublisher(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createPublisher(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getALLPublisher(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getPublisherById(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    model: any;
}
