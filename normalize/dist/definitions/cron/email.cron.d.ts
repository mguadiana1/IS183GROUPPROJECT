import { Cron } from './cron';
export declare class EmailCron extends Cron {
    private api;
    private emailer;
    constructor(api: any);
    scheduleMassPasswordReset(options: any): void;
    private lockAccount(user, options);
    private sendMail(user, options);
}
