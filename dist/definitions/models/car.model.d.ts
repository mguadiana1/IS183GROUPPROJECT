import { Request, Response, NextFunction } from 'express';
export declare class Car {
    _model: any;
    constructor(norm: any);
    getALLCars(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getCarById(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    model: any;
}
