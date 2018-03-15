/// <reference types="express" />
import { Request, Response, NextFunction } from 'express';
export declare class Authentication {
    private model;
    private options;
    private name;
    private emailer;
    constructor(model: any, options: any, name: any);
    appendSecretFields(req: Request): Request;
    isSuperAdmin: (req: Request, res: Response, next: NextFunction) => void;
    findUser(req: Request, res: Response, next: NextFunction): Promise<{}>;
    findByEmail: (req: Request, res: Response, next: NextFunction) => void;
    createSecureUser: (req: Request, res: Response, next: NextFunction) => void;
    isLoggedIn: (req: Request, res: Response, next: NextFunction) => void;
    logout: (req: Request, res: Response, next: NextFunction) => void;
    login: (req: Request, res: Response, next: NextFunction) => void;
    activateAccount(user: Object, req: Request, res: Response, next: NextFunction, cb?: Function): void;
    lockAccount(user: Object, index: any, req: Request, res: Response, next: NextFunction): void;
    unlockAccount: (req: Request, res: Response, next: NextFunction) => void;
    docServerLogin: (req: Request, res: Response, next: NextFunction, user: any) => Promise<{}>;
    changePassword: (req: Request, res: Response, next: NextFunction) => void;
    recoverPassword: (req: Request, res: Response, next: NextFunction) => void;
    sendRecoverEmail: (req: Request, res: Response, next: NextFunction) => void;
}
