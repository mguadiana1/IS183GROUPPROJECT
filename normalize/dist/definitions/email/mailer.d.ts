export declare class Emailer {
    private transporter;
    constructor(config?: any);
    createTransport(config?: any): void;
    send(mailReq: any, cb?: Function): any;
    handleError(err: any): any;
    test(mailReq?: any): void;
}
