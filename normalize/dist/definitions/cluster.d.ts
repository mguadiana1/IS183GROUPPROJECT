export declare class Cluster {
    private options;
    private models;
    _workers: Array<any>;
    _master: any;
    masterHasExited: boolean;
    numCPUs: any;
    constructor(options: any, models?: any);
    init(cluster: any, options: any): void;
    readonly workers: any[];
    readonly master: any;
    fork(numCPUs: any): void;
    setupMaster(cluster: any, options: any): void;
    logActivities(cluster: any): void;
    regenerate(cluster: any): void;
    setOnExitListener(cluster: any, process: any): void;
}
