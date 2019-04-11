import { Request, Response, NextFunction } from 'express';
export declare class Student {
    _model: any;
    constructor(norm: any);
    updateStudent(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteStudent(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createStudent(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getALLStudent(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getStudentById(model: any): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    model: any;
}
