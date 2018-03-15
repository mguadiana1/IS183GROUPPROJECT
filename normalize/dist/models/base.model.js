"use strict";
/*
    Required. The base model for all other models to extend from
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
const base_controller_1 = require("../controllers/base.controller");
const base_router_1 = require("../routes/base.router");
const file_manager_1 = require("../file-manager/file-manager");
const mongoose = require('mongoose');
const path = require('path');
class BaseModel {
    constructor(options, name, schema, description, customRoutes, api) {
        this.options = options;
        this.name = name;
        this.schema = schema;
        this.description = description;
        this.customRoutes = customRoutes;
        this.api = api;
        this.repeats = [];
        this.circular = false;
        this.ready = false;
        this.extend(this.name, this.schema).make(this.name, this.schema, this.customRoutes);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res) => __awaiter(this, void 0, void 0, function* () {
                let r = yield this.buildTable(this.name, this.schema, this.description != null ? this.description : 'N/A');
                if (r) {
                    this.ready = true;
                }
                else {
                    this.ready = false;
                }
                res(this);
            }));
        });
    }
    route(path, method, cb, requireToken) {
        this.model.router.extend(path, method, cb, requireToken);
    }
    extend(name, schema) {
        for (let s in schema) {
            if (schema[s].desc == null) {
                schema[s].desc = '';
            }
            if (schema[s].nice_name == null) {
                schema[s].nice_name = '';
            }
        }
        const entity = name.toLowerCase();
        const baseSchema = {
            active: { type: Boolean, default: true, desc: `A true/false flag use to show/hide ${entity} elements on the client application. Useful for soft delete etc.`, nice_name: 'Active' },
            created_by: { type: String, maxlength: 75, desc: `A string property used to capture the username who create a ${entity} record.`, nice_name: 'Created By' },
            updated_by: { type: String, maxlength: 75, desc: `A string property used to capture the username who update a ${entity} record.`, nice_name: 'Updated By' },
            created_at: { type: Date, default: Date.now(), desc: `A date property used to capture the timestamp when a ${entity} record is created.`, nice_name: 'Created At', timezone: true },
            updated_at: { type: Date, default: Date.now(), desc: `A date property used to capture the timestamp when a ${entity} record is updated.`, nice_name: 'Updated At', timezone: true },
            deleted_at: { type: Date, default: Date.now(), desc: `A date property used to capture the timestamp when a ${entity} record is permanently deleted.`, nice_name: 'Deleted At', timezone: true }
        };
        this.schema = Object.assign(schema, baseSchema);
        return this;
    }
    make(name, schema, customRoutes) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res) => __awaiter(this, void 0, void 0, function* () {
                switch (this.options.dbType) {
                    case 'mongo':
                        // mongo
                        let model = new mongoose.Schema(schema);
                        this.model = mongoose.model(name, model);
                        break;
                    case 'postgres':
                        this.model = {
                            controller: null,
                            router: null,
                            schema: null
                        };
                        this.model.controller = new base_controller_1.BaseController(this.options, this.name, this.model, this.api);
                        this.model.router = new base_router_1.BaseRouter(this.model.controller);
                        this.model.schema = schema;
                        if (customRoutes && Array.isArray(customRoutes) && customRoutes.length > 0) {
                            customRoutes.forEach((r) => {
                                this.route(r.route, r.method, r.callback(this), r.requireToken);
                            });
                        }
                }
                return this;
            }));
        });
    }
    checkTableExist(ctrl, name) {
        return new Promise((resolve) => {
            const checkIfExist = `select count(*) from pg_class where relname='${name}' and relkind='r'`;
            ctrl.query(checkIfExist, (err, resp) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    resolve(false);
                }
                else {
                    let count = resp && resp.rows && resp.rows.length > 0 ? resp.rows[0].count : 0;
                    if (count && count == 1) {
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                }
            }));
        });
    }
    buildTable(name, schema, desc) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res) => __awaiter(this, void 0, void 0, function* () {
                if (this.options.dbType == 'mongo') {
                    // do nothing because it is managed by mongoose
                    res(true);
                }
                else if (this.options.dbType == 'postgres') {
                    const schemaInsertPayload = {
                        schema_name: name,
                        schema_nice_name: this.getNiceName(name),
                        description: desc,
                        schema: schema,
                        created_at: 'localtimestamp',
                        updated_at: 'localtimestamp',
                        created_by: 'SYS',
                        updated_by: 'SYS'
                    };
                    const req = {
                        schema: schema,
                        schemaInsertPayload: schemaInsertPayload
                    };
                    let ctrl = this.api.getSchema(name);
                    ctrl = ctrl != null ? ctrl.controller : this.model.controller;
                    //let exists = await this.checkTableExist(ctrl, name);
                    //const resp = !exists ? await ctrl.createTable(req, null, null) : false;
                    const resp = yield ctrl.createTable(req, null, null);
                    if (resp && resp['data'] &&
                        resp['data'].error &&
                        resp['data'].error.name == 'error' &&
                        resp['data'].error.code == '42P01') {
                        let table = name;
                        let msg = resp['data'].error['stack'].toString();
                        let ind = msg.indexOf('"') + 1;
                        let lindex = msg.lastIndexOf('"');
                        let fTable = msg.slice(ind, lindex);
                        // add this table to failed attempts object
                        BaseModel.failedAttempts[table] == null ? BaseModel.failedAttempts[table] = { table: table, schema: schema, desc: desc } : false;
                        let r = yield this.recreate(table, fTable, schema, desc);
                        if (!r) {
                            let d = yield this.buildTable(table, schema, desc);
                            res(d);
                        }
                        else {
                            res(true);
                        }
                    }
                    else if (resp && resp['data'] && resp['data'].statusCode == 200 && !(resp['data']['errorCode'] == 500)) {
                        // seed normalize models. path relative to the dist folder
                        let nResp = yield this.seed('/seed', name);
                        // seed imported models
                        let sResp = yield this.seed(this.options.seedDir != null ? this.options.seedDir : '../../seed', name);
                        res(true);
                    }
                    else {
                        res(true);
                    }
                }
            }));
        });
    }
    recreate(table, fTable, schema, desc) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            //  await this.resolveModels(); // bruit force
            let circular = yield this.checkCircular(fTable);
            if (circular) {
                process.exit();
            }
            else if (BaseModel.failedAttempts[fTable] != null) {
                this.repeats.push(fTable);
                let it = BaseModel.failedAttempts[fTable];
                let data = yield this.buildTable(fTable, it.schema, it.desc);
                if (data) {
                    let f = yield this.buildTable(table, schema, desc);
                    if (f) {
                        delete BaseModel.failedAttempts[fTable];
                        resolve(f);
                    }
                    else {
                        resolve(false);
                    }
                }
                else {
                    let data = yield this.buildTable(table, schema, desc);
                    resolve(data);
                }
            }
            else {
                let fModel = this.api.getSchema(fTable);
                let fData = yield this.buildTable(fTable, fModel.schema, `A table auto generated by normalize.`);
                if (fData) {
                    let i = yield this.buildTable(table, schema, desc);
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            }
        }));
    }
    checkCircular(fTable) {
        return new Promise((resolve) => {
            // check for circluar references
            let count = 0;
            this.repeats.reverse().forEach((item, i, a) => {
                let last = a[0];
                if (!(i == 0)) {
                    if (item == last) {
                        count++;
                    }
                    count >= 5 ? this.circular = true : false;
                }
            });
            // break the circular reference 
            if (this.circular) {
                let circularTables = this.repeats.sort((a, b) => {
                    return a > b ? -1 : 1;
                }).filter((item, i, arr) => {
                    return !i || item != arr[i - 1]; // cover when i = 0
                });
                resolve(true);
                console.log(`Circular Referenece! Please check table schema: ${circularTables}`);
            }
            else {
                resolve(false);
            }
        });
    }
    resolveModels() {
        return new Promise((resolve) => {
            Object.keys(BaseModel.failedAttempts).length > 0 ? Object.keys(BaseModel.failedAttempts).reduce((p, item, i) => __awaiter(this, void 0, void 0, function* () {
                yield p;
                let it = BaseModel.failedAttempts[item] || false;
                if (it) {
                    let c = this.api.getSchema(item).controller;
                    let e = yield this.checkTableExist(c, item);
                    if (!e) {
                        let resp = yield this.buildTable(item, it.schema, it.desc);
                        if (resp) {
                            delete BaseModel.failedAttempts[item];
                        }
                    }
                    return true;
                }
                return true;
            }), Promise.resolve()) : [];
            resolve(true);
        });
    }
    seed(dir, table) {
        return __awaiter(this, void 0, void 0, function* () {
            const ctrl = this.api.getSchema(table).controller;
            return new Promise((resolve) => {
                this.fileManager = new file_manager_1.FileManager();
                const seedDir = path.normalize(__dirname + '/../../' + dir);
                this.fileManager.readDir(seedDir, (err, files) => __awaiter(this, void 0, void 0, function* () {
                    if (files && files.length > 0) {
                        let output = [];
                        let promises = files.filter((fileName, i, a) => {
                            if (fileName.indexOf('.seed.js') !== -1) {
                                const seedModel = fileName.slice(0, fileName.indexOf('.seed.js'));
                                return seedModel.trim().toLowerCase() == table.trim().toLowerCase();
                            }
                        }).reduce((p, f, i, a) => __awaiter(this, void 0, void 0, function* () {
                            yield p;
                            const seedFile = path.resolve(__dirname, seedDir + '/' + f);
                            const seed = this.fileManager.readFileSync(seedFile, 'utf8', { toJSON: true });
                            const seedReq = {
                                secretFields: ctrl.getAllSecretFields(),
                                body: seed
                            };
                            const req = {
                                body: {
                                    get: ["count(*)"]
                                }
                            };
                            const cResp = yield ctrl.get(req, null, null);
                            const count = cResp && cResp['data'] != null ? cResp['data'] : [];
                            if (count != null && count.length > 0 && parseInt(count[0].count) == 0) {
                                let p = yield ctrl.bulkInsert(seedReq, null, null);
                                output.push(p);
                                return output;
                            }
                            else {
                                //return false;
                            }
                        }), Promise.resolve());
                        let resps = yield promises;
                        if (resps && resps.length > 0 && resps[0].data && resps[0].data.length > 0) {
                            let idSeqQuery = `SELECT setval('"${table}_id_seq"', (SELECT MAX(id) FROM "${table}"));`;
                            ctrl.query(idSeqQuery, (err, resp) => __awaiter(this, void 0, void 0, function* () {
                                if (err) {
                                    // failed
                                }
                                else {
                                    // success
                                }
                            }));
                        }
                        resolve(true);
                    }
                    else {
                        resolve(true);
                    }
                }));
            });
        });
    }
    getNiceName(str) {
        return str
            .replace(/([A-Z]+)([A-Z][a-z])/g, ' $1 $2')
            .replace(/([a-z\d])([A-Z])/g, '$1 $2')
            .replace(/([a-zA-Z])(\d)/g, '$1 $2')
            .replace(/^./, function (str) { return str.toUpperCase(); })
            .trim();
    }
}
BaseModel.failedAttempts = {};
exports.BaseModel = BaseModel;
