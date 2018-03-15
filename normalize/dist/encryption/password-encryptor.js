"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require('bcrypt');
const saltRounds = process.env.SALTROUNDS || 10; // get this from 
class PasswordEncryptor {
    encrypt(secretText) {
        return bcrypt.hash(secretText, saltRounds).then((hash) => {
            // Store hash in your password DB.
            return hash;
        });
    }
    check(secretText, hash) {
        // Load hash from your password DB.
        return bcrypt.compare(secretText, hash).then((res) => {
            return res;
        });
    }
}
exports.PasswordEncryptor = PasswordEncryptor;
