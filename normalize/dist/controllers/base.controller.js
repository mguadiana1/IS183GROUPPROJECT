"use strict";
/*
 The base controller file containing default controller methods
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
const postgres_wrapper_1 = require("../wrapper/postgres.wrapper");
const jwt = require('jsonwebtoken');
const moment = require("moment");
class BaseController {
    constructor(options, name, model, api) {
        this.options = options;
        this.name = name;
        this.model = model;
        this.api = api;
        this.requestInterceptor = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            console.log('from interceptor...process pid', process.pid);
            process && process.send != null ? process.send({ cmd: 'notifyRequest', procId: process.pid }) : false;
            if (req['session'].user != null) {
                let token = this.getToken(req);
                if (token && token.length > 0) {
                    let decodedUser = yield this.toPromise(this.getRequestUser).exec(token);
                    if (decodedUser) {
                        if (decodedUser.name && decodedUser.message && decodedUser.expiredAt) {
                            res.json(this.sendError(500, {
                                name: decodedUser.name,
                                message: decodedUser.message,
                                expiredAt: decodedUser.expiredAt
                            }));
                        }
                        else {
                            if (this.options.dbType == 'mongo') {
                                // intercept the request, log the request etc.
                            }
                            else if (this.options.dbType == 'postgres') {
                                // find encrypted fields and append them to req
                                req['secretFields'] = this.getAllSecretFields();
                                req['reqUser'] = decodedUser;
                                let method = req.method.toLowerCase();
                                if (req['reqUser']) {
                                    // is bulk create?
                                    if (Array.isArray(req.body)) {
                                        req.body = req.body.map((it, i, a) => {
                                            if (req.method.toLowerCase() == 'post') {
                                                it['created_by'] = this.getTouchByUser(req, 'created_by');
                                            }
                                            else if (req.method.toLowerCase() == 'put') {
                                                it['updated_by'] = this.getTouchByUser(req, 'updated_by');
                                            }
                                            return it;
                                        });
                                    }
                                    else {
                                        if (req.method.toLowerCase() == 'post') {
                                            this.setTouchByUser(req, 'insert');
                                        }
                                        else if (req.method.toLowerCase() == 'put') {
                                            this.setTouchByUser(req, 'update');
                                        }
                                    }
                                }
                                next();
                            }
                        }
                    }
                    else {
                        res.json(this.sendError(500, 'request failed'));
                    }
                }
                else {
                    res.json(this.sendError(403, { message: `No token was sent with the request!` }));
                }
            }
            else {
                res.json(this.sendError(401, { message: `Session does not exist or has expired! Please login to establish a session!` }));
            }
        });
        this.findByIdInterceptor = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.options.dbType == 'mongo') {
                this.model.findById(req.params.id, (err, resp) => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    else if (resp) {
                        req[this.name] = resp;
                        next();
                    }
                    else {
                        res.status(404).send(err);
                    }
                });
            }
            else if (this.options.dbType == 'postgres') {
                let data = yield this.toPromise(this.psql.findById, this.psql).exec(req, res, next);
                if (data) {
                    req[this.name] = data;
                }
                next();
            }
        });
        this.createTable = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            let schema = req && req.body && req.body.schema != null ? req.body.schema : req['schema'] != null ? req['schema'] : false;
            let schemaInsertPayload = req && req.body && req.body.schemaInsertPayload != null ? req.body.schemaInsertPayload : req['schemaInsertPayload'] != null ? req['schemaInsertPayload'] : false;
            if (schema && schemaInsertPayload) {
                const data = yield this.toPromise(this.psql.createTable).exec(schema, schemaInsertPayload);
                if (data) {
                    if (res == null) {
                        return this.sendAsPromise(200, data);
                    }
                    else {
                        res.json(this.send(200, data, null, null, 'create table success'));
                    }
                }
                else {
                    if (res == null) {
                        return this.sendAsPromise(500, `create table failed`);
                    }
                    res.json(this.sendError(500, `create table failed`));
                }
            }
            else {
                if (res == null) {
                    return this.sendAsPromise(500, `create table failed! No schema or schema insert payload`);
                }
                res.json(this.sendError(500, `create table failed! No schema or schema insert payload`));
            }
        });
        this.getAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.options.dbType == 'mongo') {
                this.model.find((err, resp) => {
                    if (err) {
                        res.json(err);
                    }
                    else {
                        res.json(resp);
                    }
                });
            }
            else if (this.options.dbType == 'postgres') {
                let data = yield this.toPromise(this.psql.getAll).exec(req, res, next);
                if (data) {
                    if (res == null)
                        return this.sendAsPromise(200, data);
                    res.json(data);
                }
                else {
                    res.json(this.sendError(500, `get all records failed`));
                }
            }
        });
        this.findById = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.options.dbType == 'mongo') {
                if (res == null)
                    return req[this.name];
                res.json(req[this.name]);
            }
            else if (this.options.dbType == 'postgres') {
                if (req[this.name] != null) {
                    if (res == null)
                        return req[this.name];
                    res.json(this.send(200, req[this.name]));
                }
                else if (res == null) {
                    const data = yield this.toPromise(this.psql.findById).exec(req, res, next);
                    if (data && data['statusCode'] == 500) {
                        this.sendAsPromise(500, data);
                    }
                    else if (data && data.length == 0) {
                        this.sendAsPromise(200, `No ${this.name} record found for id ${req.params.id}`);
                    }
                    else {
                        this.sendAsPromise(200, data);
                    }
                }
                else {
                    res.json(this.sendError(201, `No ${this.name} record found for id ${req.params.id}`));
                }
            }
        });
        this.bulkInsert = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.options.dbType == 'mongo') {
                res.status(200).send({ message: 'Coming soon.' });
            }
            else if (this.options.dbType == 'postgres') {
                let data = yield this.toPromise(this.psql.bulkInsert).exec(req, res, next);
                if (data) {
                    if (res == null) {
                        data && data.length > 0 ? data.forEach((it, i, a) => {
                            this.log(req, it.id, 'POST');
                        }) : null;
                        return this.sendAsPromise(200, data);
                    }
                    res.json(this.send(200, data && data.length > 0 ? data : [], data.length, null, 'bulk insert success'));
                }
                else {
                    if (res == null) {
                        return this.sendAsPromise(200, data);
                    }
                    res.json(this.sendError(501, 'create failed'));
                }
            }
        });
        this.insert = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            //req['reqUser'] != null ? this.setTouchByUser(req, 'insert') : false;
            if (this.options.dbType == 'mongo') {
                this.model.create(req.body, (err, resp) => {
                    if (err) {
                        res.status(500).send(err);
                        return false;
                    }
                    else {
                        res.status(201).send(resp);
                        return resp;
                    }
                });
            }
            else if (this.options.dbType == 'postgres') {
                const data = yield this.toPromise(this.psql.insert).exec(req, res, next);
                if (data) {
                    this.log(req, data.id, 'POST');
                    if (res == null)
                        return this.sendAsPromise(200, data);
                    res.status(201).send(data);
                    //res.json(this.send(200, data, null, null, 'create success')); //NOT BACK COMPAT
                }
                else {
                    res.json(this.sendError(501, 'create failed'));
                }
            }
        });
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            // req['reqUser'] != null ? this.setTouchByUser(req, 'update') : false;
            let updatedFields = Object.assign({}, req.body);
            if (this.options.dbType == 'mongo') {
                this.model.update(updatedFields, (err, resp) => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    else {
                        res.json(updatedFields);
                    }
                });
            }
            else if (this.options.dbType == 'postgres') {
                const data = yield this.toPromise(this.psql.update).exec(req, res, next);
                if (data) {
                    this.log(req, data.id, 'PUT');
                    if (res == null)
                        return this.sendAsPromise(200, data);
                    res.json(this.send(201, data, data.length, null, 'update success'));
                }
                else {
                    if (res == null)
                        return this.sendAsPromise(200, data);
                    ;
                    res.json(this.sendError(500, { message: 'update error', data: data }));
                }
            }
        });
        this.remove = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.options.dbType == 'mongo') {
                req[this.name].remove((err, resp) => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    else {
                        res.status(200).send({ message: 'delete success' });
                    }
                });
            }
            else if (this.options.dbType == 'postgres') {
                const data = yield this.toPromise(this.psql.delete).exec(req, res, next);
                if (data) {
                    this.log(req, req.params.id, 'DELETE');
                    if (res == null)
                        return this.sendAsPromise(200, data);
                    res.json(this.send(200, [], 1, null, 'delete success'));
                }
            }
        });
        this.removeWhere = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.options.dbType == 'mongo') {
                req[this.name].remove((err, resp) => {
                    if (err) {
                        res.status(500).send(err);
                    }
                    else {
                        res.status(200).send({ message: 'delete success' });
                    }
                });
            }
            else if (this.options.dbType == 'postgres') {
                const data = yield this.toPromise(this.psql.deleteWhere).exec(req, res, next);
                if (data) {
                    this.log(req, req.body.id != null ? req.body.id : null, 'DELETE');
                    if (res == null)
                        return this.sendAsPromise(200, data);
                    res.json(this.send(200, data, data.length, null, 'delete success'));
                }
            }
        });
        this.updateSet = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            this.setTouchByUser(req, 'update');
            req['secretFields'] == null ? req['secretFields'] = this.getSecretFields(this.model.schema) : null;
            if (this.options.dbType == 'mongo') {
                res.status(200).send({ message: 'Comming soon.' });
            }
            else if (this.options.dbType == 'postgres') {
                const data = yield this.toPromise(this.psql.updateSet).exec(req, res, next);
                if (data) {
                    if (res == null) {
                        data && data.length > 0 ? data.forEach((it, i, a) => {
                            this.log(req, it.id, 'PUT');
                        }) : null;
                        return this.sendAsPromise(200, data);
                    }
                    res.json(this.send(200, data, data.length, null, 'update success'));
                }
                else {
                    res.json(this.sendError(204, 'update failed'));
                }
            }
        });
        this.unsubscribe = (req, res, next) => {
            this.stopSubscription(req['session'].id, req.body.subscription, res, next);
        };
        this.subscribe = (req, res, next) => {
            const sessController = this.api.getSchema('Session').controller;
            const subscriberID = req.body.subscriberID != null ? req.body.subscriberID : req['session'].id;
            const duration = req.body['interval'] != null ? req.body['interval'] : 5000;
            sessController.psql.get({
                body: {
                    get: ['*'],
                    where: {
                        sid: subscriberID
                    }
                }
            }, null, null, (resp) => {
                let sessionClients = resp[0].sess.clients != null ? resp[0].sess.clients : [];
                let timestamp = req.body['timestamp'] != null ? req.body['timestamp'] : null;
                let subscription = req.body['subscription'] != null ? req.body['subscription'] : '';
                let subscriber = {}, hasChanges = false;
                if (sessionClients != null && sessionClients.length == 0) {
                    if (req.body.subscriberID == null) {
                        subscriber['id'] = subscriberID;
                        subscriber['subscriptions'] = [];
                        subscriber['subscriptions'].push({ name: subscription });
                        sessionClients.push(subscriber);
                        resp[0].sess.clients = sessionClients;
                        hasChanges = true;
                    }
                }
                else {
                    let subsIndex = sessionClients[0] != null ? sessionClients[0]['subscriptions'].findIndex((subs) => { return subs.name == subscription; }) : -1;
                    if (subsIndex == -1) {
                        sessionClients[0]['subscriptions'].push({ name: subscription });
                        resp[0].sess.clients[0] = sessionClients[0];
                        hasChanges = true;
                    }
                    else {
                        if (subsIndex != -1 && timestamp != null) {
                            this.poll(subscriberID, subscription, req, res, next);
                        }
                        else {
                            this.stopSubscription(subscriberID, subscription, null, null, (err, resp) => {
                                setTimeout(() => {
                                    if (resp) {
                                        this.psql.get(req, res, next, (data) => {
                                            res.json({
                                                message: 'subscription get success',
                                                data: data,
                                                count: data.length,
                                                timestamp: new Date().getTime(),
                                                method: req.method,
                                                servedByProcessID: process.pid,
                                                subscriberID: subscriberID,
                                                subscription: subscription
                                            });
                                        });
                                    }
                                }, duration);
                            });
                        }
                    }
                }
                if (hasChanges) {
                    this.saveSession(subscriber, {
                        sess: JSON.stringify(resp[0].sess),
                        where: {
                            sid: subscriberID
                        }
                    }, (session) => {
                        this.poll(subscriberID, subscription, req, res, next);
                    });
                }
            });
        };
        this.get = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.options.dbType == 'mongo') {
                res.status(200).send({ message: 'Coming soon.' });
            }
            else if (this.options.dbType == 'postgres') {
                const data = yield this.toPromise(this.psql.select).exec(req, res, next);
                //console.log('data', data);
                if (data) {
                    if (res == null)
                        return this.sendAsPromise(200, data);
                    const request = { body: { table: this.name } };
                    const resp = yield this.getTotalCount(request, null, null);
                    const count = resp && resp.data != null && resp.data.length > 0 && resp.data[0].count != null ? resp.data[0].count : 0;
                    res.json(this.send(200, data, data.length, parseInt(count), 'get success'));
                }
                else {
                    res.json(this.sendError(204, 'get failed'));
                }
            }
        });
        this.getTotalCount = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.options.dbType == 'mongo') {
                res.status(200).send({ message: 'Coming soon.' });
            }
            else if (this.options.dbType == 'postgres') {
                const data = yield this.toPromise(this.psql.getTotalCount).exec(req, res, next);
                if (data) {
                    if (res == null)
                        return this.sendAsPromise(200, data);
                    res.json(this.send(200, { count: data[0].count }, data.length, parseInt(data[0].count), 'get total count success'));
                }
                else {
                    res.json(this.sendError(204, 'get total count success'));
                }
            }
        });
        this.csvExport = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.options.dbType == 'mongo') {
                res.status(200).send({ message: 'Coming soon.' });
            }
            else if (this.options.dbType == 'postgres') {
                const options = req.body.options != null ? req.body.options : {};
                const filterIDs = Object.keys(options).length > 0 && options.filterID;
                const data = yield this.toPromise(this.psql.select).exec(req, res, next);
                //console.log('------>', data[0]);
                if (data && data.length > 0) {
                    let flatData = [];
                    if (res == null)
                        return this.sendAsPromise(200, data);
                    flatData = this.JSONToRow(data);
                    // remove column with id ref if option set to true
                    if (filterIDs) {
                        flatData = flatData.map((item, i, arr) => {
                            Object.keys(item).forEach((key) => {
                                if ((key.includes('id')) || (key.includes('.id')) || (key.includes('_id'))) {
                                    delete item[key];
                                }
                                ;
                            });
                            return item;
                        });
                    }
                    // make copy of data
                    let head = flatData.slice(0);
                    // return the row with the longest row count
                    let filtered = head.sort((a, b) => {
                        return Object.keys(a).length > Object.keys(b).length ? -1 : 1;
                    });
                    // set the header columns
                    let column = filtered[0];
                    let header = Object.keys(column);
                    // parse the flatDate json to csv
                    let csv = flatData.reduce((prev, curr, index, array) => {
                        if (index === 0)
                            prev += '\n';
                        Object.keys(curr).map((key, i) => {
                            if (i !== 0)
                                prev += ',';
                            const isDate = key.slice(key.length - 3, key.length) === '_at' || key.includes('_date') && moment(curr[key], moment.ISO_8601).isValid();
                            // if value is date, format date to mm/dd/yy
                            if (isDate && curr[key] !== null && curr[key] != '-') {
                                curr[key] = moment(curr[key]).format('MM/DD/YYYY');
                            }
                            prev += curr[key];
                        });
                        return prev + '\n';
                    }, header);
                    res.status(200).send({ message: 'CSV Export Success', data: csv, filename: `${this.name}_export_${moment().format('YYYY-MM-DD')}.csv` });
                }
                else {
                    res.json(this.sendError(500, { message: 'CSV Export Failed! Please check your request object!' }));
                }
            }
        });
        // TODO to different file
        this.listAllTables = (req, res, next) => {
            const table = req.body.table != null ? req.body.table : null;
            let query = `SELECT t.table_name, json_agg(c.*) as columns FROM information_schema.tables as t 
                     inner join (select table_name, column_name, column_default, data_type from information_schema.columns) as c on (t.table_name = c.table_name) 
                     WHERE t.table_schema='public' 
                     AND t.table_type='BASE TABLE'`;
            table != null ? query += ` and t.table_name = '${table}' group by t.table_name` : query += ` group by t.table_name`;
            this.query(query, (err, resp) => {
                if (!err && resp && resp.rows.length > 0) {
                    res.json(this.send(200, resp.rows));
                }
                else {
                    res.json(this.sendError(500, { message: 'No tables found!' }));
                }
            });
        };
        this.listAllProps = (req, res, next) => {
            const table = req.body.table != null ? req.body.table : this.name;
            const query = `select column_name from information_schema.columns where table_name='${table}'`;
            this.query(query, (err, resp) => {
                if (!err && resp && resp.rows.length > 0) {
                    res.json(this.send(200, resp.rows));
                }
                else {
                    res.json(this.sendError(500, { message: 'No property found!' }));
                }
            });
        };
        // END TODO
        this.query = (query, cb) => __awaiter(this, void 0, void 0, function* () {
            if (cb == null) {
                yield this.toPromise(this.api.db.query).exec(query);
            }
            else {
                this.api.db.query(query, null, (err, resp) => {
                    if (resp) {
                        cb(null, resp);
                    }
                    else {
                        cb({ errorCode: 500, errorMessage: err }, null);
                    }
                });
            }
        });
        this.getError = () => {
            return this.error;
        };
        this.sendError = (status, error) => {
            return {
                errorMessage: error,
                statusCode: status
            };
        };
        this.send = (status, data, count, totalRowCount, message) => {
            const resp = {
                data: data,
                statusCode: status
            };
            message != null ? resp['message'] = message : null;
            count != null ? resp['data'] = data : null;
            totalRowCount != null ? resp['totalRowCount'] = totalRowCount : null;
            return resp;
        };
        this.setError = (error) => {
            this.error.push(error);
        };
        this.psql = new postgres_wrapper_1.PSQLWrapper(this.options, this.name, this.model, this.api);
    }
    hash() {
        return this.random() + this.random() + '-' + this.random() + '-' + this.random() + '-' +
            this.random() + '-' + this.random() + this.random() + this.random();
    }
    random() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(18).substring(1);
    }
    getToken(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        }
        else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    }
    getRequestUser(token, cb) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            err ? cb(err, null) : cb(null, decoded != null ? decoded : {});
        });
    }
    log(req, recordID, method) {
        return __awaiter(this, void 0, void 0, function* () {
            let payload = {
                table_name: this.name,
                record_id: recordID,
                user_id: req['reqUser'] != null ? req['reqUser'].id : null,
                method: method,
                timestamp: new Date().getTime(),
                created_at: 'localtimestamp',
                updated_at: 'localtimestamp',
                created_by: req['reqUser'] != null ? req['reqUser'].username : 'SYS',
                updated_by: req['reqUser'] != null ? req['reqUser'].username : 'SYS'
            };
            const lc = this.api.getSchema('Changelog').controller;
            let data = yield this.toPromise(lc.psql.insert, lc.psql).exec({ body: payload }, null, null);
            if (data) {
                //console.log('resp from log....', data);
            }
        });
    }
    checkForUpdates(subscriberID, cb) {
        const logController = this.api.getSchema('Changelog').controller;
        const sessController = this.api.getSchema('Session').controller;
        logController.psql.get({
            body: {
                get: ['timestamp', 'method'],
                where: {
                    table_name: this.name
                },
                sort: {
                    timestamp: 'DESC'
                },
                limit: 1
            }
        }, null, null, (resp) => {
            sessController.psql.get({
                body: {
                    get: ['*'],
                    where: {
                        sid: subscriberID
                    }
                }
            }, null, null, (session) => {
                cb(resp, session);
            });
        });
    }
    getSecretFields(schema) {
        let i = 0;
        let secretFields = [];
        for (let key in schema) {
            let props = schema[key];
            for (let p in props) {
                if (p == 'encrypt' && props[p] == true) {
                    secretFields.push({ table: this.name, field: key });
                }
            }
        }
        return secretFields;
    }
    getAllSecretFields() {
        let schemas = [], secretFields = [];
        for (let i in this.api.models) {
            schemas.push({ table: this.api.models[i].controller.name, schema: this.api.models[i].schema });
        }
        let keys;
        for (let k in schemas) {
            let schema = schemas[k].schema, table = schemas[k].table, keys = Object.keys(schema);
            for (let l in keys) {
                let secretProps;
                if (typeof schema[keys[l]]['encrypt'] != 'undefined' &&
                    schema[keys[l]]['encrypt'] != null &&
                    schema[keys[l]]['encrypt'] == true) {
                    secretProps = { table: table, field: keys[l], encryption: 'crypto' };
                }
                else if (typeof schema[keys[l]]['bcrypt'] != 'undefined' &&
                    schema[keys[l]]['bcrypt'] != null &&
                    schema[keys[l]]['bcrypt'] == true) {
                    secretProps = { table: table, field: keys[l], encryption: 'bcrypt' };
                }
                else {
                    secretProps = null;
                }
                if (secretProps && secretFields.indexOf(secretProps) == -1) {
                    secretFields.push(secretProps);
                }
                else { }
            }
        }
        return secretFields;
    }
    getTouchByUser(req, byProp) {
        return (req.body[byProp] != null &&
            typeof req.body[byProp] != 'undefined') ? req.body[byProp] :
            (req['reqUser'] != null && req['reqUser'].username != '' &&
                req['reqUser'].username != null &&
                typeof req['reqUser'].username != 'undefined') ?
                req.body[byProp] = req['reqUser'].username : 'SYS';
    }
    setTouchByUser(req, type) {
        switch (type) {
            case 'update':
                req.body['updated_by'] = this.getTouchByUser(req, 'updated_by');
                break;
            case 'insert':
                req.body['created_by'] = this.getTouchByUser(req, 'created_by');
                break;
        }
        return req;
    }
    poll(subscriberID, subscription, req, res, next) {
        console.log(`-----------> from polling ${subscription} ------------->`);
        //req.socket.setTimeout(Number.MAX_VALUE);
        let lastUpdated = req.body['timestamp'] != null ? req.body['timestamp'] : null, duration = req.body['interval'] != null ? req.body['interval'] : 5000;
        let i = 0, stop = 30, step = parseInt(duration) / 1000, max = parseInt(stop.toString()) / parseInt(step.toString());
        max < 1 ? max = 30 : false;
        let interval = setInterval(() => {
            this.checkForUpdates(subscriberID, (resp, session) => {
                let sessionClients = session && session[0] != null && session[0].sess.clients != null ? session[0].sess.clients : [];
                let client = sessionClients[0];
                let changelog = resp && resp.length > 0 ? resp[0] : {}, subStart = req.body['timestamp'] == null;
                lastUpdated == null ? lastUpdated = new Date().getTime() : null;
                //let hasChanges = changelog == {} ? false : lastUpdated != changelog.timestamp;
                let hasChanges = !(Object.keys(changelog).length) ? false : lastUpdated != changelog.timestamp;
                let earlyExit = i >= max;
                let subsIndex = client && client['subscriptions'].length > 0 ? client['subscriptions'].findIndex((subs) => { return subs.name == subscription; }) : -1;
                if (subsIndex == -1) {
                    clearInterval(interval);
                    console.log(`subscription ${subscription} stopped.`);
                    this.psql.get(req, res, next, (data) => {
                        res.json({
                            message: 'subscription cancelled',
                            data: data,
                            count: data.length,
                            timestamp: null,
                            method: null,
                            servedByProcessID: process.pid,
                            subscriberID: subscriberID,
                            subscription: subscription
                        });
                    });
                }
                else {
                    if (hasChanges || earlyExit) {
                        this.psql.get(req, res, next, (data) => {
                            clearInterval(interval);
                            res.json({
                                message: 'subscription get success',
                                data: data,
                                count: data.length,
                                timestamp: subsIndex == -1 ? null : hasChanges ? changelog.timestamp : lastUpdated,
                                method: earlyExit ? null : !hasChanges ? null : changelog.method,
                                servedByProcessID: process.pid,
                                subscriberID: subscriberID,
                                subscription: subscription
                            });
                        });
                    }
                }
            });
            console.log(`--------->${i}: ${subscription}<----------`);
            i++;
        }, duration);
        req.on('close', () => {
            console.log(`subscription has closed`);
            clearInterval(interval);
            this.removeSessClient(subscriberID);
            res.end();
        });
    }
    removeSessClient(subscriberID) {
        const sessController = this.api.getSchema('Session').controller;
        sessController.psql.get({
            body: {
                get: ['*'],
                where: { sid: subscriberID }
            }
        }, null, null, (session) => {
            session[0].sess.clients != null ? delete session[0].sess.clients : null;
            this.saveSession(subscriberID, {
                sess: JSON.stringify(session[0].sess),
                where: {
                    sid: subscriberID
                }
            });
        });
    }
    saveSession(subscriberID, payload, cb) {
        const sessController = this.api.getSchema('Session').controller;
        sessController.psql.updateSet({ body: payload }, null, null, (session) => {
            return cb ? cb(session) : session;
        });
    }
    stopSubscription(subscriptionID, subscription, res, next, cb) {
        const sessController = this.api.getSchema('Session').controller;
        sessController.psql.get({
            body: {
                get: ['*'],
                where: {
                    sid: subscriptionID
                }
            }
        }, null, null, (resp) => {
            let clients = resp[0].sess.clients != null ? resp[0].sess.clients : [];
            if (clients && clients.length > 0) {
                let client = clients[0];
                let subsIndex = client['subscriptions'].findIndex((subs) => { return subs.name == subscription; });
                if (subsIndex != -1) {
                    let subs = client['subscriptions'][subsIndex];
                    client['subscriptions'] = client['subscriptions'].filter((sub) => {
                        return sub.name !== subscription;
                    });
                    resp[0].sess.clients[0] = client;
                    this.saveSession(subscriptionID, {
                        sess: JSON.stringify(resp[0].sess),
                        where: {
                            sid: subscriptionID
                        }
                    }, (session) => {
                        const response = { message: 'unsubscribe success', timestamp: null, method: null, subscription: subscription };
                        return res ? res.json(response) : (cb != null) ? cb(null, response) : response;
                    });
                }
                else {
                    const response = { message: 'unsubscribe success! no subscription found.', timestamp: null, method: null, subscription: subscription };
                    return res ? res.json(response) : (cb != null) ? cb(null, response) : response;
                }
            }
            else {
                const err = { message: 'unsubscribe error', timestamp: null, method: null, subscription: subscription };
                return res ? res.json(err) : (cb != null) ? cb(err, null) : err;
            }
        });
    }
    getJSONModels(props, models) {
        Object.keys(props).forEach((key) => {
            if (Array.isArray(props[key])) {
                for (let i in props[key]) {
                    const prop = props[key][i];
                    if (prop && typeof prop != 'string' && Object.keys(prop).length > 0) {
                        models[key] = models[key] != null ? models[key] : prop; // get the shape of the object
                        for (let item in prop) {
                            if (Array.isArray(prop[item])) {
                                //TODO recursion
                            }
                        }
                    }
                }
            }
        });
        return models;
    }
    JSONToRow(data, prev) {
        // let flat: any = [];
        let models = {};
        return data.map((props, i, a) => {
            // get the shape of each object for mapping
            models = this.getJSONModels(props, models);
            Object.keys(props).forEach((key, i, a) => {
                //props = Object.assign({}, props, prev); //TODOD ....
                if (key !== null) {
                    if (Array.isArray(props[key])) {
                        // filter nulls from left outer join query
                        //props[key] = props[key].map((item: any) => {
                        //  return item == null ? [] : item;
                        // });
                        // for each object, loop through them and add props to column
                        for (let i in props[key]) {
                            const prop = props[key][i];
                            // if is an object
                            if (prop && typeof prop != 'string' && Object.keys(prop).length > 0) {
                                //models[key] = prop; // get the shape of the object
                                for (let item in prop) {
                                    if (Array.isArray(prop[item])) {
                                        // this.JSONToRow(prop[item], props); //TODO recursion
                                    }
                                    // find commas and escape
                                    props[key + '.' + item + '_' + i] = this.escape(prop[item]);
                                }
                            }
                            else {
                                // data is null, fill in '-' to preserve row integrity (prevent row from shifting)
                                for (let item in models[key]) {
                                    //if (Array.isArray(model[item])) { }
                                    props[key + '.' + item + '_' + i] = '-';
                                }
                            }
                        }
                        delete props[key];
                        // is an object
                    }
                    else if (props[key] && typeof props[key] != 'string' && Object.keys(props[key]).length > 0) {
                        for (let it in props[key]) {
                            props[key + '.' + it] = this.escape(props[key][it]);
                        }
                        delete props[key];
                    }
                    else {
                        // single value
                        props[key] = this.escape(props[key]);
                    }
                }
                else {
                    props[key] = '-';
                }
            });
            //flat.push(props);
            return props;
        });
        //  return flat;
    }
    escape(value) {
        let val;
        let isDate;
        if (value != null) {
            val = value.toString();
            typeof value == 'string' ? isDate = moment(val, moment.ISO_8601).isValid() : false;
            if (!(isDate)) {
                val = val.includes(',') ? "\"" + val + "\"".trim() : value;
            }
            else {
                return value;
            }
        }
        else {
            val = '-';
        }
        return val;
    }
    sendAsPromise(status, data) {
        return new Promise((resolve) => {
            resolve(this.send(status, data));
        });
    }
    toPromise(func, scope) {
        const f = (...args) => {
            return new Promise((resolve, reject) => {
                const callback = (err, resp) => {
                    resp && resp != null ? err ? reject(err) : resolve(resp) : resolve(err);
                };
                func.apply(scope != null ? scope : this.psql, [...args, callback]);
            });
        };
        f.exec = (...args) => {
            return f(...args);
        };
        return f;
    }
    //TODO remove
    static convertToUTCDate(date) {
        let dateInput = date || null;
        let dateOutput;
        if (dateInput != null) {
            dateOutput = dateInput.slice(0, dateInput.indexOf('T'));
        }
        return dateOutput;
    }
}
exports.BaseController = BaseController;
