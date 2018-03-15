import { BaseModel } from './base.model';
export declare class PLV8Module extends BaseModel {
    options: any;
    name: string;
    api: any;
    private plv8;
    constructor(options: any, name: string, api: any);
    addModule(): Promise<void>;
    createSPDecript(): Promise<{}>;
}
