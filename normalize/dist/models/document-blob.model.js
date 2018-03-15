"use strict";
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
class DocumentBlob extends base_model_1.BaseModel {
    constructor(options, name, api) {
        super(options, name, {
            id: { type: Number, key: 'primary', desc: 'A numeric property used to identify ${name} record.', nice_name: '' },
            app_id: { type: Number, desc: '', nice_name: '' },
            path: { type: String, maxlength: 50, desc: '', nice_name: '' },
            blob: { type: String, maxlength: 50000, encrypt: true, desc: '', nice_name: '' },
            prefix: { type: String, maxlength: 30, desc: '', nice_name: '' },
            postfix: { type: String, maxlength: 30, desc: '', nice_name: '' },
            size: { type: Number, desc: '', nice_name: '' },
            sequence: { type: Number, desc: '', nice_name: '' },
            doc_guid: {
                type: String,
                maxlength: 500,
                key: 'foreign',
                references: { table: 'Document', foreignKey: 'file' },
                onDelete: 'cascade',
                onUpdate: 'cascade',
                desc: '',
                nice_name: ''
            }
        }, 'A table used to store document blob', [], api);
        this.options = options;
        this.name = name;
        this.api = api;
        // override default post method TODO move to wrapper
        this.insert = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.options.dbType == 'mongo') {
                res.json(this.model.controller.send(200, { message: 'Comming soon!' }));
            }
            else if (this.options.dbType == 'postgres') {
                const payload = req.body;
                const base64 = payload['base64'];
                // get the chunk endpoint and insert the chunk to database
                const chunks = this.chunkString(base64, 10000);
                let data = chunks.map((chunk, i, array) => {
                    let p = {
                        blob: chunk,
                        sequence: i,
                        doc_guid: payload.doc_guid,
                        postfix: payload.postfix
                    };
                    return p;
                });
                const reqPayload = Object.assign(req, { body: data });
                const resp = yield this.model.controller.bulkInsert(reqPayload, null, null);
                if (resp && resp.data && resp.data.length > 0) {
                    res.status(200).send({ doc_id: payload.doc_guid });
                }
                else {
                    res.status(500).send({ message: `There was an error while saving file!` });
                }
            }
        });
        this.getAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.options.dbType == 'mongo') {
                res.json(this.model.controller.send(200, { message: 'you might not want to do this!!' }));
            }
            else if (this.options.dbType == 'postgres') {
                res.json(this.model.controller.send(200, { message: 'you might not want to do this!!' }));
            }
        });
        this.findById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.options.dbType == 'mongo') {
                res.json(req[this.name]);
            }
            else if (this.options.dbType == 'postgres') {
                const doc_guid = req.params.id;
                const getReq = Object.assign(req, {
                    body: {
                        get: ["*"],
                        where: {
                            doc_guid: doc_guid
                        },
                        sort: {
                            sequence: "ASC"
                        }
                    }
                });
                const resp = yield this.model.controller.get(getReq, null, null);
                let returnBlob = '';
                if (resp && resp.data && resp.data.length > 0) {
                    const rows = resp.data;
                    for (let r in rows) {
                        returnBlob += rows[r].blob;
                    }
                    const returnData = {
                        blob: returnBlob,
                        postfix: rows[0].postfix,
                        size: rows[0].size
                    };
                    if (res == null) {
                        return this.model.controller.sendAsPromise(500, returnData);
                    }
                    else {
                        res.json(this.model.controller.send(200, returnData));
                    }
                }
                else {
                    if (res == null) {
                        return this.model.controller.sendAsPromise(500, 'There was an error processing request!');
                    }
                    else {
                        res.json(this.model.controller.sendError(500, 'There was an error processing request!'));
                    }
                }
            }
        });
        this.model.router.extend('/', 'GET', this.getAll);
        this.model.router.extend('/', 'POST', this.insert);
        this.model.router.extend('/id/:id', 'GET', this.findById);
        this.model.controller.insert = this.insert;
        this.model.controller.getAll = this.getAll;
        this.model.controller.findById = this.findById;
    }
    static sanitize(string) {
        let sanitizedStr = string.toString().replace(/(^\s+|\s+$)/g, '').trim();
        if (sanitizedStr.includes("'")) {
            sanitizedStr = sanitizedStr.replace(/'/g, "''"); // escape aphotrophe by doubling it
        }
        return sanitizedStr;
    }
    generateID() {
        return this.random() + this.random() + '-' + this.random() + '-' + this.random() + '-' +
            this.random() + '-' + this.random() + this.random() + this.random();
    }
    random() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(18).substring(1);
    }
    chunkString(str, length) {
        return str.match(new RegExp('.{1,' + length + '}', 'g'));
    }
}
exports.DocumentBlob = DocumentBlob;
