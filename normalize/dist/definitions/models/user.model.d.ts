import { BaseModel } from './base.model';
import { Authentication } from '../authentication/authentication';
export declare class User extends BaseModel {
    options: any;
    name: string;
    api: any;
    auth: Authentication;
    constructor(options: any, name: string, api: any);
}
