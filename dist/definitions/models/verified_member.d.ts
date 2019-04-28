import { Request, Response, NextFunction } from 'express';
export declare class Verified_member {
    _model: any;
    constructor(norm: any);
    updateVerified_member(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteVerified_member(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createVerified_member(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getALLVerified_member(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getVerified_memberById(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    model: any;
}
