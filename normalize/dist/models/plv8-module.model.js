"use strict";
/*
    Required. A table used to store javascript modules for the purpose of requiring it in plv8 environment. Useful for creating custom stored procedures and aggregate functions.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base.model");
const plv8_1 = require("../encryption/plv8");
const cluster = require('cluster');
class PLV8Module extends base_model_1.BaseModel {
    constructor(options, name, api) {
        super(options, name, {
            id: { type: Number, key: 'primary' },
            module: { type: String, maxlength: 150, unique: true },
            source: { type: String, maxlength: Infinity },
            autoload: { type: Boolean, default: true }
        }, 'A table used to store javascript modules for the purpose of requiring it in plv8 environment. Useful for creating custom stored procedures and aggregate functions.', [], api);
        this.options = options;
        this.name = name;
        this.api = api;
        this.addModule();
    }
    // Add crypto-js module to database to be used in plv8 environment
    addModule() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.options.cluster && cluster && cluster.worker && cluster.worker.process.env.role == 'data_broker' || !(this.options.cluster)) {
                this.plv8 == null ? this.plv8 = yield new plv8_1.PLV8(this.model.controller, this.options.dbName).init() : null;
                const exists = yield this.plv8.existCheck('PLV8Module', 'module', 'cryptojs');
                if (!exists) {
                    let data = yield this.plv8.fetchCode(__dirname + '/../../node_modules/crypto-js/crypto-js.js');
                    if (data) {
                        yield this.plv8.insertModule('cryptojs', true, data.replace(/'/g, "''"));
                    }
                }
                yield this.createSPDecript();
            }
        });
    }
    // register a psql aggregate function called sp_decrypt that uses crypto-js to decrypt secret fields
    createSPDecript() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res) => __awaiter(this, void 0, void 0, function* () {
                const exists = yield this.plv8.existCheck('pg_proc', 'proname', 'sp_decrypt');
                ;
                if (!exists) {
                    let resp = yield this.plv8.create(`CREATE OR REPLACE FUNCTION sp_decrypt(str text)
                            RETURNS text AS $$
                            var CryptoJS = require('cryptojs');
                            const decrypted = CryptoJS.AES.decrypt(str.toString(), '${process.env.BY_KEY}');
                            return decrypted.toString(CryptoJS.enc.Utf8);
                            $$ LANGUAGE plv8 IMMUTABLE STRICT;`);
                    res(true);
                }
            }));
        });
    }
}
exports.PLV8Module = PLV8Module;
