export declare class Encryptor {
    private ByKey;
    constructor(ByKey: any);
    test(testStr: string): void;
    bcrypt(rawString: string): any;
    encrypt(rawString: string): any;
    decrypt(encString: any): any;
}
