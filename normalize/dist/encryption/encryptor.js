"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CryptoJS = require("crypto-js");
const bcrypt = require('bcrypt');
const saltRounds = 10; // store this in .env
class Encryptor {
    constructor(ByKey) {
        this.ByKey = ByKey;
    }
    test(testStr) {
        this.decrypt(this.encrypt(testStr));
    }
    bcrypt(rawString) {
        return bcrypt.hashSync(rawString, bcrypt.genSaltSync(saltRounds));
    }
    encrypt(rawString) {
        try {
            const encrypted = CryptoJS.AES.encrypt(rawString, this.ByKey.toString());
            return encrypted.toString();
        }
        catch (e) {
            // throw new Error(e);
        }
    }
    decrypt(encString) {
        try {
            if (encString != null && !encString.includes(' ')) {
                const decrypted = CryptoJS.AES.decrypt(encString.toString(), this.ByKey.toString());
                //console.log('decrypted', decrypted.toString(CryptoJS.enc.Utf8));
                if (decrypted.toString(CryptoJS.enc.Utf8) == '') {
                    return encString;
                }
                return decrypted.toString(CryptoJS.enc.Utf8);
            }
        }
        catch (e) {
            //throw new Error(e);
        }
    }
}
exports.Encryptor = Encryptor;
