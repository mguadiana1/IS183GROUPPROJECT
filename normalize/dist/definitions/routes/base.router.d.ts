/// <reference types="express" />
import { Router } from 'express';
import { BaseController } from '../controllers/base.controller';
export declare class BaseRouter {
    controller: BaseController;
    router: Router;
    constructor(controller: BaseController);
    make(): Router;
    extend(endpoint: string, method: string, cb: any, requireToken?: boolean): this;
}
