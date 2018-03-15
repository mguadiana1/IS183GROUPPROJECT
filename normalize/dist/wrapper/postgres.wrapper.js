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
const encryptor_1 = require("../encryption/encryptor");
const cluster = require('cluster');
class PSQLWrapper {
    //static plv8: PLV8;
    constructor(options, table, model, api) {
        this.options = options;
        this.table = table;
        this.model = model;
        this.api = api;
        Object.assign(this, this.options);
        this.client = api.db;
        PSQLWrapper.encryptor = new encryptor_1.Encryptor(process.env.BY_KEY);
    }
    connect(callback) {
        this.client.connect((err, client, done) => {
            if (err) {
                console.log('err', err);
                return { errorCode: 500, errorMessage: err };
            }
            callback(client, done);
        });
    }
    // callback is a function that takes a client as arguement and return a query result
    exec(req, res, next, callback) {
        // takes in client and done as arguements
        this.connect(callback);
    }
    encrypt(prop, value, secretFields) {
        const encryptionIsEnabled = process.env.ENABLE_DB_ENCRYPTION || false;
        if (secretFields && secretFields.length > 0) {
            let encryptOptions = secretFields.filter((item, i, a) => {
                return item && (item.field == prop) && encryptionIsEnabled;
            });
            if (encryptOptions.length > 0) {
                // may support other data types
                const option = encryptOptions.pop();
                switch (typeof value) {
                    case 'string':
                        if (option.encryption == 'bcrypt') {
                            return `'${PSQLWrapper.encryptor.bcrypt(value)}'`;
                        }
                        else if (option.encryption == 'crypto') {
                            return `'${PSQLWrapper.encryptor.encrypt(value)}'`;
                        }
                    default:
                        return `'${PSQLWrapper.encryptor.encrypt(value)}'`;
                }
            }
            else {
                return value;
            }
        }
        else {
            return value;
        }
    }
    query(query, cb) {
        if (!cb) {
            return new Promise((res) => {
                this.client.query(query, null, (err, resp) => {
                    if (err) {
                        res(err);
                    }
                    else {
                        res(resp);
                    }
                });
            });
        }
        else {
            this.client.query(query, null, (err, resp) => {
                if (err) {
                    cb(err, null);
                }
                else {
                    cb(null, resp);
                }
            });
        }
    }
    prepareCreate(props) {
        const obj = props;
        let arr = [];
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                let text = obj[key].maxlength != null && obj[key].maxlength == Infinity;
                let type = obj[key].type != null ? obj[key].type : false, unique = obj[key].unique != null ? obj[key].unique : false, keyType = obj[key].key != null ? obj[key].key : false, maxLength = obj[key].maxlength != null ? obj[key].maxlength : 100, // default to 100
                defaultVal = obj[key].default != null ? obj[key].default : false, foreignTable = obj[key].references != null ? obj[key].references.table : false, foreignKey = obj[key].references != null ? obj[key].references.foreignKey : false, onDelete = obj[key].onDelete != null ? obj[key].onDelete : false, onUpdate = obj[key].onUpdate != null ? obj[key].onUpdate : false, encrypt = obj[key].encrypt != null ? obj[key].encrypt : false, bcrypt = obj[key].bcrypt != null ? obj[key].bcrypt : false, precision = obj[key].precision != null ? obj[key].precision : false;
                // increase length if prop is to be encrypted
                encrypt || bcrypt ? maxLength = maxLength * 5 : false;
                let str = ``;
                switch (true) {
                    case type == Number && (keyType === 'primary'):
                        arr.push(`"${key}" serial PRIMARY KEY`);
                        break;
                    case type == Number && (keyType === 'foreign'):
                        str = `"${key}" integer references "${foreignTable}"("${foreignKey}")`;
                        onDelete ? str += ` on delete ${onDelete}` : false;
                        onUpdate ? str += ` on update ${onUpdate}` : false;
                        unique ? str += ` unique` : false;
                        arr.push(str);
                        break;
                    case type == Number.MAX_SAFE_INTEGER:
                        str = `"${key}" bigint ${defaultVal ? 'default ' + defaultVal : ''}`;
                        unique ? str += ` unique` : false;
                        arr.push(str);
                        break;
                    case type == String && (keyType === 'foreign'):
                        str = `"${key}" varchar(${maxLength}) references "${foreignTable}"("${foreignKey}")`;
                        onDelete ? str += ` on delete ${onDelete}` : false;
                        onUpdate ? str += ` on update ${onUpdate}` : false;
                        unique ? str += ` unique` : false;
                        arr.push(str);
                        break;
                    case type == Number && (keyType == false) && (precision == false):
                        str = `"${key}" integer ${defaultVal ? 'default ' + defaultVal : ''}`;
                        unique ? str += ` unique` : false;
                        arr.push(str);
                        break;
                    case type == Number && (keyType == false) && (precision && precision.length == 2):
                        str = `"${key}" numeric(${precision[0]}, ${precision[1]}) ${defaultVal ? 'default ' + defaultVal : ''}`;
                        unique ? str += ` unique` : false;
                        arr.push(str);
                        break;
                    case type == String && text === false:
                        str = `"${key}" varchar(${maxLength}) ${defaultVal ? 'default ' + defaultVal : ''}`;
                        unique ? str += ` unique` : false;
                        arr.push(str);
                        break;
                    case type == String && text:
                        str = `"${key}" TEXT ${defaultVal ? 'default ' + defaultVal : ''}`;
                        unique ? str += ` unique` : false;
                        arr.push(str);
                        break;
                    case type == Boolean:
                        str = `"${key}" boolean ${defaultVal ? 'default ' + defaultVal : ''}`;
                        unique ? str += ` unique` : false;
                        arr.push(str);
                        break;
                    case type == Date:
                        const timezone = obj[key].hasOwnProperty('timezone') && obj[key].timezone === false ? 'without time zone' : 'with time zone';
                        str = `"${key}" timestamp ${timezone}`;
                        unique ? str += ` unique` : false;
                        arr.push(str);
                        break;
                    case type == JSON:
                        str = `"${key}" json ${defaultVal ? 'default ' + defaultVal : ''}`;
                        unique ? str += ` unique` : false;
                        arr.push(str);
                        break;
                    default:
                        str = `"${key}" varchar(${maxLength}) ${defaultVal ? 'default ' + defaultVal : ''}`;
                        unique ? str += ` unique` : false;
                        arr.push(str);
                        break;
                }
            }
        }
        ;
        return arr.join(', ');
    }
    checkTableExist() {
        return new Promise((resolve) => {
            const checkIfExist = `select count(*) from pg_class where relname='${this.table}' and relkind='r'`;
            this.query(checkIfExist, (err, resp) => __awaiter(this, void 0, void 0, function* () {
                if (!resp) {
                    resolve({ exist: null });
                }
                else {
                    let count = resp && resp.rows && resp.rows.length > 0 ? resp.rows[0].count : 0;
                    if (count && count == 1) {
                        resolve({ exist: true });
                    }
                    else {
                        resolve({ exist: false });
                    }
                }
            }));
        });
    }
    updateSchema(updateObj) {
        return new Promise((resolve) => {
            let updateString = this.prepareCreate(updateObj);
            let alterQuery = `alter table "${this.table}" add column ${updateString}`;
            //console.log('alter query', alterQuery);
            this.query(alterQuery, (err, resp) => {
                if (!resp) {
                    resolve({ errorCode: 500, errorMessage: `${this.table} could not be updated!` });
                }
                else {
                    resolve({ statusCode: 200, message: `Success! Table ${this.table} was successfully updated with new field[s]!.` });
                }
            });
        });
    }
    updateSchemas(updateSchema) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                let promises = [];
                if (Object.keys(updateSchema).length > 0) {
                    for (let s in updateSchema) {
                        const updateObj = {};
                        updateObj[s] = updateSchema[s];
                        promises.push(this.updateSchema(updateObj));
                    }
                    let resps = yield Promise.all(promises);
                    //console.log('resps', resps);
                    if (resps) {
                        resolve(resps[0]);
                    }
                    else {
                        resolve({ statusCode: 200, message: `Success! Table ${this.table} exists and no fields was found!.` });
                    }
                }
                else {
                    resolve({ statusCode: 200, message: `Success! Table ${this.table} exists and no fields was found!.` });
                }
            }));
        });
    }
    checkForUpdates(schema) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                // check to see if there are updated fields
                const fieldsQuery = `select column_name from information_schema.columns where table_name='${this.table}'`;
                this.query(fieldsQuery, (err, resp) => __awaiter(this, void 0, void 0, function* () {
                    if (resp && resp.rows && resp.rows.length > 0) {
                        resolve(resp);
                    }
                    else {
                        resolve(false);
                    }
                }));
            });
        });
    }
    createTable(schema, schemaPayload, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            //if (this.options.cluster && cluster && cluster.worker && cluster.worker.process.env.role == 'data_broker' || !(this.options.cluster)) {
            // if (true) {
            let exists = yield this.checkTableExist();
            if (exists['exist'] == null) {
                cb({ error: `there were errors creating table: ${this.table}` });
            }
            else if (exists['exist']) {
                let resp = yield this.checkForUpdates(schema);
                // console.log('exist is true resp: ', resp);
                if (resp) {
                    const fields = resp.rows;
                    // check for added properties
                    let updateSchema = {};
                    for (let key in schema) {
                        let newFields = fields.findIndex((item, i, a) => {
                            return key == item.column_name;
                        });
                        if (newFields == -1) {
                            updateSchema[key] = schema[key];
                        }
                    }
                    let updateResp = yield this.updateSchemas(updateSchema);
                    cb(updateResp);
                }
                else {
                    cb({ statusCode: 200, message: `Success! Table ${this.table} exists and no fields was found!.` });
                }
            }
            else {
                let createResp = yield this.create(schema, schemaPayload);
                cb(createResp);
            }
            // }
        });
    }
    create(schema, schemaPayload, tbl) {
        let table = tbl != null ? tbl : this.table;
        return new Promise((resolve) => {
            let createQuery = `create table "${table}"(${this.prepareCreate(schema)})`;
            this.query(createQuery, (err, resp) => __awaiter(this, void 0, void 0, function* () {
                if (!resp) {
                    resolve({ errorCode: 500, error: err, errorMessage: `${table} could not be created! Please check the schema specs!` });
                }
                else {
                    yield this.insertSchema(schemaPayload, table);
                    resolve({ statusCode: 200, message: `Success! Table ${table} was successfully created.` });
                }
            }));
        });
    }
    insertSchema(schemaPayload, table) {
        return new Promise((resolve) => {
            const schemaCheck = `select * from "Schema" where schema_name='${table}'`;
            this.query(schemaCheck, (err, resp) => {
                if (resp && resp.rows && (resp.rows.length > 0)) {
                    resolve(false);
                }
                else {
                    const values = this.prepareObject('insert', schemaPayload, []);
                    let count = 0, attrs = '';
                    for (let key in schemaPayload) {
                        count === Object.keys(schemaPayload).length - 1 ? attrs += `"${key}"` : attrs += `"${key}", `;
                        count++;
                    }
                    const query = `INSERT into "Schema" (${attrs}) VALUES(${values}) RETURNING id;`;
                    this.query(query, (err, res) => {
                        //console.log('from query schemaQuery res: ', res);
                        resolve(res);
                    });
                }
            });
        });
    }
    checkAndDecrypt(data, secretFields) {
        let secret = secretFields && secretFields != null && secretFields.length > 0 ? secretFields : [];
        if (data != null) {
            for (let k in data) {
                if (data[k] != null) {
                    if (data.hasOwnProperty(k)) {
                        if (typeof data[k] !== "function") {
                            if ((typeof data[k] == "object") || (data[k].constructor === Array)) {
                                this.checkAndDecrypt(data[k], secretFields);
                            }
                            else { }
                            for (let s in secret) {
                                if (secret[s].field == k) {
                                    if (data[k] && data[k] != '' && data[k] != null) {
                                        if (secret[s].encryption != 'bcrypt') {
                                            data[k] = PSQLWrapper.encryptor.decrypt(data[k]);
                                        }
                                        else {
                                            delete data[k]; // remove property being returned when it is a secret field encrypted by bcrypt
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return data;
    }
    getAll(req, res, next, callback) {
        this.query(`SELECT * FROM "${this.table}" ORDER BY id ASC;`, (err, resp) => {
            if (err) {
                callback({ statusCode: 500, errorMessage: err });
            }
            else {
                callback(this.checkAndDecrypt(resp.rows, req['secretFields']));
            }
        });
    }
    findById(req, res, next, callback) {
        this.query(`SELECT * FROM "${this.table}" WHERE id=${req.params.id};`, (err, resp) => {
            if (err) {
                callback({ statusCode: 500, errorMessage: err });
            }
            else {
                callback(this.checkAndDecrypt(resp.rows[0], req['secretFields']));
            }
        });
    }
    bulkInsert(req, res, next, cb) {
        const arr = req.body != null ? req.body : false;
        let promises = [];
        if (Array.isArray(arr)) {
            promises = arr ? arr.map((it, i, a) => {
                const bp = {
                    secretFields: req['secretFields'],
                    body: it
                };
                return new Promise((resolve) => {
                    this.insert(bp, null, null, (res) => {
                        resolve(res);
                    });
                });
            }) : [];
            Promise.all(promises).then((resp) => __awaiter(this, void 0, void 0, function* () {
                return cb != null ? cb(yield this.getAffectedRows(req['secretFields'], resp && resp.length > 0 ? resp : [])) : resp;
            }));
        }
        else {
            const err = { errorMessage: 'Request payload must be an Array of Objects' };
            return cb != null ? cb(err) : err;
        }
    }
    insert(req, res, next, cb) {
        let rootId = req.params && req.params.rootId != null ? req.params.rootId : false;
        let isCascadeInsert = req.body.cascade != null ? true : false;
        let body = req.body;
        const payload = this.buildInsertObj(this.setUpdateProp(this.setCreatedProp(req.body)));
        let cascadePayload = {}, cascadeTable = '', cascade;
        let relatedTo;
        if (isCascadeInsert) {
            cascadePayload = payload.cascade.data;
            if (cascadePayload.related_to != null) {
                relatedTo = cascadePayload.related_to;
                delete payload.cascade.data.related_to;
                delete payload.cascade.data;
            }
            else {
                relatedTo = 'parent';
            }
            cascadeTable = payload.cascade.table;
            delete payload.cascade;
        }
        let attrs = '', values = '', table = this.table;
        if (payload.cascadeTable) {
            table = payload.cascadeTable;
            delete payload.cascadeTable;
        }
        let secretFields = req['secretFields'] != null ? req['secretFields'] : [];
        let payloadLength = Object.keys(payload).length;
        let count = 0;
        for (let key in payload) {
            count === payloadLength - 1 ? attrs += `"${key}"` : attrs += `"${key}", `;
            values = this.prepareObject('insert', payload, secretFields);
            count++;
        }
        const query = `INSERT into "${table}" (${attrs}) VALUES(${values}) RETURNING id;`;
        //console.log('query from insert: ', query);
        this.query(query, (err, resp) => {
            if (err) {
                if (cb && cb != null) {
                    cb(err);
                }
                else {
                    return res ? res.status(500).json({ statusCode: 500, errorMessage: err }) : err;
                }
            }
            else {
                payload.cascade = cascade;
                if (isCascadeInsert) {
                    let linkingKey;
                    if (cascadePayload._linking_key != null) {
                        linkingKey = cascadePayload['_linking_key'] || null;
                        delete cascadePayload._linking_key;
                    }
                    else {
                    }
                    if (linkingKey != null && linkingKey != '' && linkingKey != 'undefined') {
                        cascadePayload[linkingKey] = relatedTo == 'root' ? rootId ? rootId : resp.rows[0].id : resp.rows[0].id;
                        cascadePayload['cascadeTable'] = cascadeTable;
                    }
                    let newReq = {
                        body: cascadePayload,
                        secretFields: secretFields,
                        params: {
                            rootId: relatedTo == 'root' ? rootId ? rootId : resp.rows[0].id : resp.rows[0].id
                        }
                    };
                    this.insert(newReq, res, next, cb);
                }
                else {
                    this.query(`SELECT * FROM "${this.table}" where id=${rootId ? rootId : resp.rows[0].id}`, (err, data) => {
                        if (cb && cb != null) {
                            if (data && data.rows.length > 0) {
                                cb(this.checkAndDecrypt(data.rows[0], req['secretFields']));
                            }
                            else {
                                cb(err);
                            }
                        }
                        else {
                            if (data && data.rows.length > 0) {
                                return this.checkAndDecrypt(data.rows[0], req['secretFields']);
                            }
                            else {
                                return err;
                            }
                        }
                    });
                }
            }
        });
    }
    update(req, res, next, callback) {
        let reqId = req.params.id != null ? req.params.id : false;
        let isCascadeUpdate = req.body.cascade ? true : false;
        let table = this.table;
        let leftAlias = `_${table.toLowerCase()}`;
        const bundle = this.buildInsertObj(this.setUpdateProp(req.body));
        let cascadePayload = {}, cascadeTable = '', cascadeWhere = null;
        if (isCascadeUpdate) {
            cascadePayload = bundle.cascade.data;
            cascadeTable = bundle.cascade.table;
            delete bundle.cascade;
        }
        let doingCascade = req.body.cascadeTable != null && req.body.cascadeTable != '' ? true : false;
        if (doingCascade) {
            table = bundle.cascadeTable;
            cascadeWhere = bundle.where != null ? bundle.where : false;
            leftAlias = `_${table.toLowerCase()}`;
            delete bundle.cascadeTable;
        }
        let secretFields = req['secretFields'] != null ? req['secretFields'] : [];
        let keyValues = this.prepareObject('update', bundle, secretFields);
        let where = (doingCascade && cascadeWhere != null) ? this.prepareWhere(leftAlias, cascadeWhere, req['secretFields']) : `"${leftAlias}".id=${req.params.id}`;
        let query = `UPDATE "${table}" as "${leftAlias}" SET ${keyValues} where ${where}`;
        //console.log('query', query);
        this.query(query, (err, resp) => {
            if (err) {
                callback(err);
            }
            else {
                if (isCascadeUpdate) {
                    cascadePayload['cascadeTable'] = cascadeTable;
                    let newReq = {
                        body: cascadePayload,
                        secretFields: secretFields,
                        params: {
                            id: reqId
                        }
                    };
                    this.update(newReq, res, next, callback);
                }
                else {
                    this.findById(req, res, next, (data) => {
                        callback(data);
                    });
                }
            }
        });
    }
    // map get request alias
    mapTableAlias(getReq, aliasMap) {
        getReq != null && getReq.length > 0 ? getReq.forEach((item, i, arr) => {
            if (typeof item === 'object') {
                for (let key in item) {
                    if (item.hasOwnProperty(key) && key == "table") {
                        // let map = {
                        //     table: item.table,
                        //     as: item.as != null ? `_${item.as.toLowerCase()}` : `_${item.table.toLowerCase()}`
                        // }
                        // if (!(aliasMap.includes(map))) {
                        //     aliasMap.push(map);
                        // }
                    }
                    if (item.hasOwnProperty(key)) {
                        // if nested get query
                        if (key == "get") {
                            this.mapTableAlias(item.get, aliasMap);
                        }
                        else if (key == 'join') {
                            this.mapTableAlias(item.join, aliasMap);
                        }
                        else if (key == 'viewJoin') {
                            this.mapTableAlias(item.viewJoin, aliasMap);
                        }
                        else if (key == 'where') {
                            // Object.keys(item.where).forEach((it) => {
                            //     if (it != 'like' && it != 'startswith' && it != 'in' && it != 'condition' && it != 'between' && it != 'on') {
                            //         if (typeof item.where[it] == 'object') {
                            //             this.mapTableAlias([item.where[it]], aliasMap);
                            //         }
                            //     }
                            // });
                        }
                    }
                }
                ;
            }
        }) : null;
        // remove dupicates
        aliasMap = aliasMap && aliasMap.length > 0 ? aliasMap.filter((it, i, a) => {
            return a.indexOf(it) == i;
        }) : [];
        return aliasMap;
    }
    select(req, res, next, callback, prevAliasMap, prevQuery) {
        // let rootAlias = req.body && req.body.as != null ? `_${req.body.as.toLowerCase()}` : `_${this.table.toLowerCase()}`;
        let aliasMap = [];
        aliasMap = req.body.aliasMap != null ? req.body.aliasMap : this.mapTableAlias(req.body.get != null ? req.body.get : [], aliasMap);
        req.body.aliasMap = aliasMap;
        req.body.prevAliasMap = prevAliasMap; // the previous root AliasMap
        return this.get(req, res, next, callback, prevQuery);
    }
    get(req, res, next, callback, prevQuery) {
        let isSubQuery = prevQuery != null;
        let table = isSubQuery ? req.body.table : this.table;
        let leftAlias = req.body.as != null ? `_${req.body.as.toLowerCase()}` : `_${this.table.toLowerCase()}`, asProp = req.body.as != null ? `${req.body.as}` : `${table.toLowerCase()}`, //TODO remove _
        aliasMap = req.body.aliasMap != null ? req.body.aliasMap : [{ table: table, as: leftAlias }], prevAliasMap = req.body.prevAliasMap != null ? req.body.prevAliasMap : null, on = req.body.on != null ? req.body.on : null, // onClause for get (not for join) TODO
        query = `SELECT `;
        let select = (req.body.get != null && req.body.get[0] == "*" && isSubQuery) ? `row_to_json("${leftAlias}".*, true)` : req.body.get != null ? this.prepareSelect(table, leftAlias, req.body.get, req.body.distinct, req['secretFields'], aliasMap) : false, join;
        let options = {
            query: [],
            joinType: [],
            where: [],
            group: [],
            subJoin: {
                on: []
            },
            aliasMap: [],
            secretFields: []
        }, includes = [];
        if (req.body.join != null) {
            // joinOption = req.body.join[0].joinType;
            join = this.prepareJoins(leftAlias, aliasMap, req.body.join, options, includes, true, false, req['secretFields']);
        }
        else if (req.body.viewJoin != null) {
            join = this.prepareJoins(leftAlias, aliasMap, req.body.viewJoin, options, includes, true, true, req['secretFields']);
        }
        let where = '';
        let having = '';
        let group = '';
        let sort = '';
        let limit = null;
        let offset = null;
        // if select id, then group by id as well
        let getContainsId = req.body.get && req.body.get.indexOf('id') != -1;
        let getContainsDistinctProps = req.body.distinct != null && req.body.get.indexOf(req.body.distinct) != -1;
        let groupContainsId = req.body.group && req.body.group.indexOf('id') != -1;
        let isAggregateStart = req.body.get[0].indexOf('(') != -1 && req.body.get[0].indexOf(')') != -1;
        let getContainsManyProps = req.body.get.length > 1;
        if (getContainsId) {
            // if group by id, sort by id as well
            if (groupContainsId) {
                if (getContainsDistinctProps) {
                    req.body.sort = this.setSortOrderStartingByVal(req.body.sort, req.body.distinct);
                }
                else {
                    req.body.sort = this.setSortOrderStartingByVal(req.body.sort, 'id');
                }
            }
            else {
                // there is group but id is not defined
                if (req.body.group != null) {
                    let reqGroup = req.body.group;
                    delete req.body.group;
                    req.body.group = [];
                    req.body.group.push('id');
                    req.body.group = reqGroup.concat(req.body.group);
                }
                else {
                    if (getContainsDistinctProps) {
                        if (req.body.distinct != 'id') {
                            req.body.group = [req.body.distinct, 'id'];
                        }
                        else {
                            req.body.group = [req.body.distinct];
                            req.body.sort = this.setSortOrderStartingByVal(req.body.sort, 'id');
                        }
                    }
                    else {
                        req.body.group = ['id'];
                        req.body.sort = this.setSortOrderStartingByVal(req.body.sort, 'id');
                    }
                }
            }
        }
        else {
            if (req.body.group != null && req.body.group.indexOf('id') != -1 && req.body.distinct != null) {
                if (req.body.get.indexOf('*') != -1) {
                    req.body.group.push(`*`);
                    req.body.sort = this.setSortOrderStartingByVal(req.body.sort, `*`);
                }
                else {
                    req.body.group.push(req.body.distinct);
                    req.body.sort = this.setSortOrderStartingByVal(req.body.sort, req.body.distinct);
                }
            }
            else if (req.body.group != null && req.body.group.indexOf('id') != -1) {
                req.body.sort = this.setSortOrderStartingByVal(req.body.sort, 'id');
            }
            else if (req.body.group != null && req.body.get.indexOf('*') != -1) {
                req.body.group.push('id');
                req.body.sort = this.setSortOrderStartingByVal(req.body.sort, req.body.group[0]);
            }
            else if (req.body.group != null) {
                let reqGroup = req.body.group;
                delete req.body.group;
                req.body.group = [];
                let gets = req.body.get;
                for (let g in gets) {
                    req.body.group.push(gets[g]);
                }
                req.body.group = reqGroup.concat(req.body.group);
                req.body.sort = this.setSortOrderStartingByVal(req.body.sort, req.body.group[0]);
            }
            else if (req.body.distinct) {
                if (isAggregateStart) {
                    delete req.body.group;
                }
                else {
                    req.body.group = [];
                    req.body.group.push(`*`, req.body.distinct);
                    req.body.sort = this.setSortOrderStartingByVal(req.body.sort, `*`);
                }
            }
        }
        req.body.where != null ? where = this.prepareWhere(leftAlias, req.body.where, req['secretFields'], aliasMap, prevAliasMap) : false;
        req.body.having != null ? having = this.prepareWhere(leftAlias, req.body.having, req['secretFields'], aliasMap, prevAliasMap) : false;
        req.body.group != null ?
            group = this.prepareGroup(leftAlias, req.body.group, select) :
            (isAggregateStart == false && req.body.join != null) || (isAggregateStart &&
                getContainsManyProps && this.getAggCount(req.body.get) == 1) ?
                group = `"${leftAlias}"."id" `
                : false; // when group not defined, group by id, but if isAggregate, do not group unless specified
        req.body.sort != null ? sort = this.prepareSort(leftAlias, req.body.sort, req['secretFields']) : false;
        req.body.limit != null ? limit = req.body.limit : false;
        req.body.offset != null ? offset = req.body.offset : false;
        if (join) {
            if (join.group && group.length > 0) {
                group += `,${join.group}`;
            }
            else if (join.group) {
                group += `${join.group}`;
            }
        }
        delete req.body.where; //TODO...
        if (select[0] == "*") {
            query += `* ${join ? join.include : ''} FROM "${table}" as "${leftAlias}"`;
        }
        else {
            query += select + `${join ? join.include : ''} FROM "${table}" as "${leftAlias}"`;
        }
        join ? query += ` ${join.query}` : false;
        where ? query += ` WHERE ${where}` : false;
        group ? query += ` GROUP BY ${group}` : false;
        having ? query += ` HAVING ${having}` : false;
        sort ? query += ` ORDER BY ${sort}` : false;
        limit ? query += ` LIMIT ${limit}` : false;
        offset ? query += ` OFFSET ${offset}` : false;
        if (prevQuery == null) {
            //console.log('from get() executing query....', query);
            this.executeQuery(req, res, next, query, callback);
        }
        else {
            // if single get
            if (req.body.get && req.body.get.length > 1) {
                if (req.body.distinct != null) {
                    return `JSON_AGG(DISTINCT (SELECT "_${asProp}" FROM (${query})  AS "_${asProp}")) AS "${asProp}"`;
                }
                else {
                    return `JSON_AGG((SELECT "_${asProp}" FROM (${query})  AS "_${asProp}")) AS "${asProp}"`;
                }
            }
            else {
                return `(${query}) AS "${asProp}"`;
            }
        }
    }
    executeQuery(req, res, next, query, callback) {
        //console.log('query from get(): ', query);
        this.query(query, (err, resp) => {
            if (err) {
                callback({ statusCode: 500, errorMessage: err });
            }
            else {
                callback(this.checkAndDecrypt(resp.rows, req['secretFields']));
            }
        });
    }
    getAggCount(get) {
        let count = 0;
        get.forEach((it, i, a) => {
            if (it.indexOf('(') != -1 && it.indexOf(')') != -1) {
                count++;
            }
        });
        return count;
    }
    setSortOrderStartingByVal(reqSortPayload, sortValue) {
        if (reqSortPayload != null) {
            for (let s in reqSortPayload) {
                let idIndex = Object.keys(reqSortPayload).indexOf(sortValue);
                // id exist in the sort object
                if (idIndex != -1) {
                    // id is not the first item in sort object, set it as the first item
                    // if (idIndex != 0) {
                    //     let reqSort = reqSortPayload;
                    //     reqSortPayload = {};
                    //     reqSortPayload[sortValue] = reqSort[sortValue];
                    //     Object.assign(reqSortPayload, reqSort);
                    // }
                }
                else {
                    let reqSort = reqSortPayload;
                    reqSortPayload = {};
                    reqSortPayload[sortValue] = 'ASC';
                    Object.assign(reqSortPayload, reqSort);
                }
            }
        }
        else {
            reqSortPayload = {};
            reqSortPayload[sortValue] = 'ASC';
        }
        return reqSortPayload;
    }
    updateSet(req, res, next, cb) {
        //const bundle = req.body;
        const leftAlias = `_${this.table.toLowerCase()}`;
        const where = req.body.where != null ? this.prepareWhere(leftAlias, req.body.where, req['secretFields']) : {};
        delete req.body.where;
        const bundle = this.buildInsertObj(this.setUpdateProp(req.body));
        let keyValues = this.prepareObject('update', bundle, req['secretFields']);
        let query = `UPDATE "${this.table}" as ${leftAlias} SET ${keyValues} WHERE ${where} RETURNING id;`;
        ;
        //console.log('query from updateSet: ', query);
        this.query(query, (err, resp) => __awaiter(this, void 0, void 0, function* () {
            if (err) {
                cb({ statusCode: 500, errorMessage: err });
            }
            else {
                cb(yield this.getAffectedRows(req['secretFields'], resp.rows && resp.rows.length > 0 ? resp.rows : []));
            }
        }));
    }
    getAffectedRows(secretFields, respRows) {
        return new Promise((resolve) => {
            if (respRows && respRows.length > 0) {
                let affectedRows = respRows.filter((row) => {
                    return row.id != null;
                }).map((row) => {
                    return row.id;
                });
                // if more than one record is affected, find and return all the records
                if (affectedRows.length > 0) {
                    this.query(`SELECT * FROM "${this.table}" WHERE id in (${affectedRows})`, (err, data) => {
                        !err ? resolve(this.checkAndDecrypt(data.rows, secretFields)) : resolve([]);
                    });
                }
                else {
                    resolve({ errorMessage: `No records affected!` });
                }
            }
            else {
                resolve({ errorMessage: `No records affected!` });
            }
        });
    }
    delete(req, res, next, cb) {
        this.query(`DELETE FROM "${this.table}" WHERE id=${req.params.id};`, (err, resp) => {
            if (err) {
                return res.status(500).json({ statusCode: 500, errorMessage: err });
            }
            else {
                return cb ? cb(resp) : resp;
            }
        });
    }
    deleteWhere(req, res, next, cb) {
        const leftAlias = `_${this.table.toLowerCase()}`;
        const where = this.prepareWhere(leftAlias, req.body.where, req['secretFields']);
        const query = `DELETE FROM "${this.table}" as ${leftAlias} WHERE ${where} returning id`;
        this.query(query, (err, resp) => __awaiter(this, void 0, void 0, function* () {
            if (err) {
                let errResp = { statusCode: 500, errorMessage: err };
                cb ? cb(errResp) : res.status(500).json(errResp);
            }
            else {
                cb(resp.rows && resp.rows.length > 0 ? { deletedIDs: resp.rows } : { deletedIDs: [] });
            }
        }));
    }
    sanitize(string) {
        let sanitizedStr = string.toString().replace(/(^\s+|\s+$)/g, '').trim();
        if (sanitizedStr.includes("'")) {
            sanitizedStr = sanitizedStr.replace(/'/g, "''"); // escape aphotrophe by doubling it
        }
        switch (sanitizedStr.toLowerCase()) {
            case 'false':
                return false;
            case 'true':
                return true;
            case 'null':
                return null;
        }
        return sanitizedStr;
    }
    convert(value, wrapStrings) {
        if (value != null) {
            let isArray = value.constructor === Array;
            if (isArray) {
                if (typeof value[0] === 'number')
                    return '(' + value.join() + ')';
                return `'${value.join()}'`; // turn array of string into a single comma separated string.
            }
            else {
                switch (typeof value) {
                    case 'number':
                        return value;
                    case 'string':
                        //return `'${value.trim()}'`;
                        return wrapStrings ? `'${this.sanitize(value)}'` : `${this.sanitize(value)}`;
                    case 'object':
                        return `'${JSON.stringify(value)}'`;
                    case 'boolean':
                        return value;
                    case null:
                        return null;
                    default:
                        return value;
                }
            }
        }
        else {
            return value;
        }
    }
    // split object into key vaule string
    prepareObject(type, props, secretFields) {
        const obj = props;
        let arr = [];
        const specialProps = ['current_date', 'current_time', 'current_timestamp', 'localtime', 'localtimestamp'];
        for (let key in obj) {
            if (obj.hasOwnProperty(key) && key != 'where') {
                let wrapString = true;
                if (secretFields && secretFields.length > 0) {
                    wrapString = secretFields.filter((item, i, a) => {
                        return item.field === key;
                    }).length > 0 ? false : true;
                }
                if ((obj[key] && obj[key] != null && typeof obj[key] == 'string' && specialProps.indexOf(obj[key].toLowerCase()) != -1)) {
                    wrapString = false;
                }
                if (type == 'insert') {
                    arr.push(`${this.encrypt(key, this.convert(obj[key], wrapString), secretFields)}`);
                }
                else if (type == 'update') {
                    arr.push(`"${key}"=${this.encrypt(key, this.convert(obj[key], wrapString), secretFields)}`);
                }
            }
        }
        return arr.join(', ');
    }
    prepareOnClause(array, aliasMap, table, rootAlias, alias) {
        let arr = [];
        for (let item in array) {
            let obj = array[item];
            let table1;
            let table2;
            let table1Key;
            let table2Key;
            let leftTableIndex = null, isViewJoin = false;
            ;
            if (table == Object.keys(obj)[0]) {
                leftTableIndex = 1;
            }
            else if (table == Object.keys(obj)[1]) {
                leftTableIndex = 0;
            }
            else {
                isViewJoin = true;
                if (leftTableIndex == null) {
                    Object.keys(obj).forEach((a, i, arr) => {
                        if (a.includes('view')) {
                            leftTableIndex = i;
                        }
                    });
                }
            }
            if (!isViewJoin && leftTableIndex && Object.keys(obj)[leftTableIndex == 1 ? 0 : 1].includes('view')) {
                table2 = `_${Object.keys(obj)[leftTableIndex == 1 ? 0 : 1]}`;
            }
            else if (!isViewJoin && alias != null && alias != '') {
                table2 = alias;
            }
            else if (!isViewJoin) {
                table2 = `_${Object.keys(obj)[leftTableIndex == 1 ? 0 : 1]}`;
            }
            else {
                table2 = rootAlias;
            }
            let leftTableAlias = null;
            let leftTableName = null;
            for (let m in aliasMap) {
                let map = aliasMap[m];
                if (map['table'] == Object.keys(obj)[leftTableIndex]) {
                    leftTableName = map['table'];
                    leftTableAlias = map['as'];
                }
            }
            if (!isViewJoin && leftTableIndex && Object.keys(obj)[leftTableIndex].includes('view')) {
                table1 = `_${Object.keys(obj)[leftTableIndex]}`;
            }
            else if (!isViewJoin && Object.keys(obj)[leftTableIndex] == leftTableName && leftTableAlias != null && leftTableAlias != '') {
                table1 = leftTableAlias;
            }
            else if (!isViewJoin && rootAlias) {
                table1 = `_${Object.keys(obj)[leftTableIndex]}`;
            }
            else {
                table1 = `_${Object.keys(obj)[leftTableIndex]}`;
            }
            table2Key = obj[Object.keys(obj)[leftTableIndex == 1 ? 0 : 1]];
            table1Key = obj[Object.keys(obj)[leftTableIndex]];
            arr.push(`"${table1.toLowerCase()}"."${table1Key}"="${table2.toLowerCase()}"."${table2Key}"`);
        }
        return arr.join(' AND ');
    }
    prepareAggregate(selectItem) {
        let leftIndex = selectItem.indexOf('(');
        let rightIndex = selectItem.indexOf(')');
        let args = selectItem.slice(leftIndex + 1, rightIndex);
        let aggFunc = selectItem.slice(0, selectItem.indexOf('('));
        return {
            args: args,
            aggFunc: aggFunc
        };
    }
    prepareSelect(table, leftAlias, array, distinct, secretFields, aliasMap, prev) {
        let arr = prev != null ? prev : [];
        let isAggregateStart = array && array.length > 0 && typeof array[0] !== 'object' ? array[0].indexOf('(') != -1 && array[0].indexOf(')') != -1 : false;
        let select, aggProps;
        if (isAggregateStart) {
            aggProps = this.prepareAggregate(array[0]);
        }
        if (array[0] == "*") {
            select = distinct ? `distinct on ("${leftAlias}".${array[0]}) "${leftAlias}".${array[0]}` : `"${leftAlias}".${array[0]}`;
            arr.push(select);
            return arr.join(', ');
        }
        else {
            for (let i in array) {
                if (array.hasOwnProperty(i)) {
                    let isSubQuery = typeof array[i] === 'object';
                    if (!(isSubQuery)) {
                        if (isAggregateStart && array[0].includes("*") && parseInt(i) == 0) {
                            switch (true) {
                                case distinct && isAggregateStart == false:
                                    select = `distinct on ("${leftAlias}".${array[0]}) "${leftAlias}".${array[0]}`;
                                    break;
                                case distinct && isAggregateStart:
                                    select = `${aggProps.aggFunc}(distinct("${leftAlias}".${aggProps.args}))`;
                                    break;
                                // case distinct == null && isAggregateStart:
                                //select = `${array[0]}`;
                                // break;
                                case isAggregateStart:
                                    select = `${aggProps.aggFunc}("${leftAlias}".${aggProps.args})`;
                                    break;
                                default:
                                    select = `"${leftAlias}".${array[0]}`;
                                    break;
                            }
                            arr.push(select);
                        }
                        else {
                            let isAgg = array[i].indexOf('(') != -1 && array[i].indexOf(')') != -1;
                            if (array[i] == 'id' && distinct != null && distinct == 'id') {
                                arr.unshift(`distinct on("${leftAlias}"."${array[i]}") "${leftAlias}"."${array[i]}"`);
                            }
                            else if (distinct != null && array[i] == distinct) {
                                arr.unshift(`distinct on("${leftAlias}"."${array[i]}") "${leftAlias}"."${array[i]}"`);
                            }
                            else {
                                if (isAgg) {
                                    const agg = this.prepareAggregate(array[i]);
                                    arr.push(`${agg.aggFunc}("${leftAlias}".${agg.args})`);
                                }
                                else {
                                    //if (this.isSecretField(secretFields, array[i])) { // ALREADY HANDLED BY GET()
                                    // arr.push(`"${leftAlias}"."${array[i]}" AS "${array[i]}"`); // TODO check this must be different from alias
                                    // } else {
                                    //prev != null ? arr.push(`(SELECT "${leftAlias}"."${array[i]}" FROM`) : arr.push(`"${leftAlias}"."${array[i]}"`);
                                    arr.push(`"${leftAlias}"."${array[i]}"`);
                                    //}
                                }
                            }
                        }
                    }
                    else {
                        // sub select row level
                        let subGetObject = array[i];
                        let subPayload;
                        //aliasMap['prevAlias'] = leftAlias;
                        let prevAliasMap = { table: table, as: leftAlias };
                        let map = {
                            table: subGetObject.table,
                            as: subGetObject.as != null ? `_${subGetObject.as.toLowerCase()}` : `_${subGetObject.table.toLowerCase()}`
                        };
                        if (!(aliasMap.includes(map))) {
                            aliasMap.push(map);
                        }
                        aliasMap != null ? subPayload = Object.assign({}, subGetObject, { aliasMap: aliasMap }) : null;
                        let subReq = { body: subPayload };
                        let query = this.select(subReq, null, null, null, prevAliasMap, arr);
                        arr.push(`${query}`);
                    }
                }
            }
            ;
        }
        return arr.join(', ');
    }
    prepareCondString(leftAlias, cond, prop, value, secretFields, aliasMap, prevAliasMap) {
        let str = '', term, args = '';
        let isSecret;
        if (secretFields && secretFields.length > 0) {
            isSecret = secretFields.filter((item, i, a) => {
                return item.field === prop;
            }).length > 0 ? true : false;
        }
        switch (cond.toLowerCase()) {
            case 'on':
                let curr = aliasMap && aliasMap.length > 0 ? aliasMap.filter((item, i, arr) => {
                    return item.as !== leftAlias;
                }) : [];
                let leftTable = aliasMap && aliasMap.length > 0 ? aliasMap.filter((item, i, arr) => {
                    return item.as == leftAlias;
                }) : [];
                let table = leftTable.length > 0 ? leftTable[0].table : null;
                //let rootAlias = curr.length > 0 ? curr[0].as : leftAlias;
                let rootAlias = prevAliasMap && prevAliasMap.as != null ? prevAliasMap.as : leftAlias; //TODO CHECK ELSE 
                let alias = leftAlias;
                let onClause = this.prepareOnClause([value], aliasMap, table, rootAlias, alias);
                args = onClause;
                break;
            case 'like':
                str = this.convert(value, false);
                term = `'%${str}%'`;
                args = isSecret ? `sp_decrypt("${leftAlias}".${prop}) ILIKE ${term}` : `"${leftAlias}"."${prop}" ILIKE ${term}`;
                break;
            case 'startswith':
                str = this.convert(value, false);
                term = `'${str}%'`;
                args = isSecret ? `sp_decrypt("${leftAlias}".${prop}) ILIKE ${term}` : `"${leftAlias}"."${prop}" ILIKE ${term}`;
                break;
            case 'in':
                if (value.toString().indexOf('(') != -1 && value.toString().indexOf(')') != -1) {
                    str = value;
                }
                else {
                    for (let s in value) {
                        str += `${this.convert(value[s], true)}, `;
                    }
                    str = `(${str.slice(0, str.length - 2)})`;
                }
                args = isSecret ? `sp_decrypt("${leftAlias}".${prop}) IN ${str}` : `"${leftAlias}"."${prop}" IN ${str}`;
                break;
            case 'between':
                let left, right;
                if (value.indexOf('AND') != -1 || value.indexOf('and') != -1) {
                    left = value.slice(0, value.indexOf('AND')).trim();
                    right = value.slice(value.indexOf('AND') + 4, value.length).trim();
                    str = `${this.convert(left, true)} AND ${this.convert(right, true)}`;
                }
                else { }
                args = isSecret ? `sp_decrypt("${leftAlias}".${prop}) BETWEEN ${str}` : `"${leftAlias}"."${prop}" BETWEEN ${str}`;
                break;
            case 'condition':
                let condString = ``, condObj = value;
                for (let c in condObj) {
                    let condArr = condObj[c], operator = c.toLowerCase() == 'not' ? `AND NOT` : c, leftCond = condArr[0], cond = condArr[1].toLowerCase(), rightCond = condArr[2];
                    let isAggregate = leftCond.indexOf('(') - 1 && leftCond.indexOf(')') != -1;
                    let argsArray;
                    if (isAggregate) {
                        let aggProps = this.prepareAggregate(leftCond);
                        argsArray = aggProps.args.split(' ');
                        for (let prop in argsArray) {
                            if (this.model.schema.hasOwnProperty(argsArray[prop])) {
                                argsArray[prop] = `"${leftAlias}"."${argsArray[prop]}"`;
                            }
                            else {
                            }
                        }
                        let condition = `${aggProps.aggFunc}(${argsArray && argsArray.length > 0 ? argsArray.join(', ').replace(/,/g, '') : argsArray})`;
                        args += ` ${operator} ${condition} ${cond} ${this.convert(rightCond, cond == 'in' ? false : true)}`;
                    }
                    else {
                        if (cond == 'like' || cond == 'startswith' || cond == 'in' || cond == 'between') {
                            args += ` ${operator} ${this.prepareCondString(leftAlias, cond, leftCond, rightCond, secretFields, aliasMap, prevAliasMap)}`;
                        }
                        else {
                            let secret;
                            let isSpecial = typeof rightCond == 'string' &&
                                (rightCond.toLowerCase() == 'true' ||
                                    rightCond.toLowerCase() == 'false' ||
                                    rightCond.toLowerCase() == 'null');
                            if (secretFields && secretFields.length > 0) {
                                secret = secretFields.filter((item, i, a) => {
                                    return item.field === leftCond;
                                }).length > 0 ? true : false;
                            }
                            args += secret ? ` ${operator} sp_decrypt("${leftAlias}"."${leftCond}") ${cond} ${this.convert(rightCond, !isSpecial)}` : ` ${operator} "${leftAlias}"."${leftCond}" ${cond} ${this.convert(rightCond, !isSpecial)}`;
                        }
                    }
                }
                return { cond: args };
            default:
                break;
        }
        return args;
    }
    prepareWhere(leftAlias, props, secretFields, aliasMap, prevAliasMap) {
        const obj = props;
        let arr = [];
        let op = [];
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                let childObj = obj[key];
                key = key.toLowerCase();
                if (key == 'like' || key == 'startswith' || key == 'in' || key == 'condition' || key == 'between' || key == 'on') {
                    for (let prop in childObj) {
                        arr.push(this.prepareCondString(leftAlias, key, prop, childObj[prop], secretFields, aliasMap, prevAliasMap));
                    }
                }
                else {
                    let isAgg = key.indexOf('(') != -1 && key.indexOf(')') != -1;
                    if (isAgg) {
                        let agg = this.prepareAggregate(key);
                        arr.push(`${`${agg.aggFunc}("${leftAlias}".${agg.args})`}=${this.convert(obj[key], true)}`);
                    }
                    else {
                        // if where value is a get object, prepare the query
                        if (obj[key] && typeof obj[key] == 'object') {
                            // sub select row level
                            let subGetObject = obj[key];
                            let subPayload;
                            aliasMap.push({ table: subGetObject['table'], as: `_${subGetObject['as'].toLowerCase()}` });
                            subPayload = Object.assign({}, subGetObject, { aliasMap: aliasMap });
                            let subReq = { body: subPayload };
                            let query = this.select(subReq, null, null, null, prevAliasMap, arr);
                            let subWhereQuery = `(SELECT "${subGetObject['as']}".* FROM ${query})`;
                            arr.push(`"${leftAlias}"."${key}"=${subWhereQuery}`);
                        }
                        else {
                            arr.push(`"${leftAlias}"."${key}"=${this.convert(obj[key], true)}`);
                        }
                    }
                }
            }
        }
        ;
        let a = '';
        if (arr && arr.length > 0) {
            for (let i in arr) {
                if (parseInt(i) === 0 && arr[i]['cond'] == null) {
                    a = arr[i];
                }
                else if (parseInt(i) === 0 && arr[i]['cond'] != null) {
                    let s = arr[i]['cond'].trim().indexOf(' ');
                    arr[i]['cond'] = arr[i]['cond'].slice(s + 2, arr[i]['cond'].length);
                    a += arr[i]['cond'];
                }
                else if (parseInt(i) !== 0 && arr[i]['cond'] != null) {
                    a += arr[i]['cond'];
                }
                else {
                    a += ` AND ${arr[i]}`;
                }
            }
            return a;
        }
    }
    prepareGroup(leftAlias, props, select) {
        const obj = props;
        let arr = [], selected = select.split(', '), output = '';
        for (let i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (obj[i] == '*') {
                    arr.push(`"${leftAlias}".${obj[i]}`);
                }
                else {
                    arr.push(`"${leftAlias}"."${obj[i]}"`);
                }
            }
        }
        ;
        if (arr && arr.length > 0) {
            arr.filter((item) => {
                return selected.indexOf(item);
            });
            return arr.join(', ');
        }
        return '';
    }
    prepareSort(leftAlias, props, secretFields) {
        const obj = props;
        let arr = [];
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (key == '*') {
                    arr.push(`"${leftAlias}".${key} ${obj[key]}`);
                }
                else {
                    if (this.isSecretField(secretFields, key)) {
                        arr.push(`sp_decrypt("${leftAlias}"."${key}") ${obj[key]}`);
                    }
                    else {
                        arr.push(`"${leftAlias}"."${key}" ${obj[key]}`);
                    }
                }
            }
        }
        ;
        return arr.join(', ');
    }
    prepareJoins(leftAlias, aliasMap, joins, options, includes, joinStart, isSub, secretFields) {
        let joinReqAlias = this.mapTableAlias(joins, []);
        joins.forEach((join, i, array) => {
            let start = (i == 0) && joinStart ? true : false;
            let isSubStart = (i == 0) && isSub ? true : false;
            let isSubEnded = (i == array.length - 1) && isSub ? true : false;
            this.prepareJoin(leftAlias, aliasMap, join, array, options, includes, start, isSubStart, isSubEnded, secretFields);
        });
        return this.prepareJoinQuery(options, includes);
    }
    prepareJoinQuery(options, includes) {
        let query = options['query'].join(` `);
        let where = ``;
        let group = ``;
        options['where'].length > 0 ? where += options['where'].join(` AND `) : false;
        options['group'].length > 0 ? group += options['group'].join(`, `) : false;
        let include = includes.join('');
        return {
            subJoin: options['subJoin'],
            query: query,
            include: include,
            where: where,
            group: group
        };
    }
    prepareJoin(leftAlias, aliasMap, props, arr, options, includes, start, isSubStart, isSubEnd, secretFields) {
        const obj = props;
        let count = options['query'].length;
        let table = obj['table'];
        let nextTable = '';
        let include = obj['include'] != null ? obj['include'] : true;
        let joinType = obj['joinType'] != null ? obj['joinType'] : "INNER JOIN";
        let foreignKey = obj['foreignKey'] != null ? obj['foreignKey'] : false;
        let alias = obj['as'] != null ? `_${obj['as'].toLowerCase()}` : `_${table.toLowerCase()}`;
        let nextAlias = '';
        let asProp = obj['as'] != null ? obj['as'] : table.toLowerCase() + 's';
        let on = obj['on'];
        let where = '';
        let get;
        let onClause = '';
        let returnType = obj['returnType'] != null ? obj['returnType'] : 'array';
        let needSubQuery = obj['get'] != null && obj['get'][0] != "*";
        let group = obj['group'] != null ? obj['group'] : [];
        let limit = obj['limit'] != null ? 'LIMIT ' + obj['limit'] : false;
        for (let key in obj) {
            let map = {
                table: table,
                as: alias
            };
            if (obj.hasOwnProperty(key) && key == "table") {
                if (options['aliasMap'].indexOf(map) == -1) {
                    options['aliasMap'].push(map);
                }
                let getReqAlias = this.mapTableAlias(obj['get'], []);
                options['aliasMap'] = options['aliasMap'].concat(getReqAlias);
                options['aliasMap'] = aliasMap != null ? options['aliasMap'].concat(aliasMap) : options['aliasMap'];
                // // remove dupicates
                // options['aliasMap'] = options['aliasMap'].filter((it:any, i:any, a:any) => {
                //     return options['aliasMap'].indexOf(it) == i;
                // });
            }
        }
        ;
        // if on clause contains a property that is not in the get array, add it to the get array
        // if nested joins, loop find all props required and add to get array
        arr.forEach((item, i, array) => {
            let tOn = item['on'];
            if (tOn != null) {
                for (let i in tOn) {
                    let keyArray = tOn[i];
                    for (let key in keyArray) {
                        let value = keyArray[key];
                        if (table == key && obj['get'] && obj['get'].indexOf(value) == -1) {
                            obj['get'].push(value);
                        }
                    }
                }
            }
        });
        // get next join object
        let nextIndex = arr.constructor == Array ? arr.indexOf(obj) + 1 : false;
        let nextJoin = nextIndex ? arr[nextIndex] : false;
        nextTable = nextJoin && nextJoin['table'] ? nextJoin['table'] : 'notable';
        nextAlias = nextJoin && nextJoin['table'] ? `_${nextTable.toLowerCase()}` : 'notable';
        let nextAs = nextJoin && nextJoin['as'] ? `_${nextJoin['as'].toLowerCase()}` : nextAlias;
        let nextAsProp = nextJoin && nextJoin['as'] != null ? nextJoin['as'] : nextTable.toLowerCase() + 's';
        // get previous join object
        let prevTable = '';
        let prevAs = '';
        let prevJoin = '';
        let prevAlias = '';
        let prevIndex = null;
        if (arr.indexOf(obj) > 0) {
            prevIndex = arr.constructor == Array ? arr.indexOf(obj) - 1 : false;
            prevJoin = prevIndex || prevIndex == 0 ? arr[prevIndex] : false;
            prevTable = prevJoin && prevJoin['table'] ? prevJoin['table'] : 'notable';
            prevAlias = prevJoin && prevJoin['table'] ? `_${prevTable.toLowerCase()}` : 'notable';
            prevAs = prevJoin && prevJoin['as'] ? `_${prevJoin['as'].toLowerCase()}` : '';
        }
        if (isSubStart) {
            // swap out table with view
            on[0][`view${nextAlias}`] = on[0][table]; // no need for underscore becuase prepareOnClause will provide
            delete on[0][table];
        }
        if (on != null) {
            onClause = this.prepareOnClause(on, options['aliasMap'], table, leftAlias, alias);
            if (foreignKey) {
                onClause = `"${leftAlias}"."id"="${alias}"."${foreignKey}" AND ` + onClause;
            }
        }
        else {
            if (foreignKey) {
                onClause = `"${leftAlias}"."id"="${alias}"."${foreignKey}"`;
            }
            else {
                onClause = `"${leftAlias}"."id"="${alias}"."id"`;
            }
        }
        get = needSubQuery ? this.prepareSelect(table, alias, obj['get'], obj['distinct'], secretFields, options['aliasMap']) :
            returnType == 'array' ? isSubStart ? `distinct on("${alias}".*) "${alias}".*` :
                ` ${obj['distinct'] ? 'distinct' : ''} "${alias}".*` : ` ${obj['distinct'] ? 'distinct' : ''} "${alias}".*`;
        if (needSubQuery) {
        }
        obj['where'] != null ? where = this.prepareWhere(alias, obj['where'], secretFields) : false; // optional
        obj['where'] != null ? options['where'].push(`${where}`) : false;
        let subQuery = '';
        let subsWhere = where && where.length > 0 ? ` where ` + where : '';
        let subsOnClause = `ON (${onClause.length > 0 ? onClause : ''})`;
        let subJoinGroupBy = '';
        let groupBy;
        if (isSubStart) {
            if (group.length > 0) {
                subJoinGroupBy = `${subsWhere} group by ${this.prepareGroup(alias, group, get)} ${limit ? limit : ''}) as "_view${nextAlias}" ${subsOnClause}`;
            }
            else {
                subJoinGroupBy = `${subsWhere} group by "${alias}"."id" ${limit ? limit : ''}) as "_view${nextAlias}" ${subsOnClause}`;
            }
            options['subJoin']['on'] = ` ${subJoinGroupBy} `;
        }
        else {
            if (group.length > 0) {
                groupBy = `group by ${this.prepareGroup(alias, group, get)} ${limit ? limit : ''}`;
            }
            else {
                groupBy = `group by "${alias}"."id" ${limit ? limit : ''}`;
            }
        }
        let isViewJoin = options['subJoin']['on'].length > 0;
        if (isSubEnd) {
            subsOnClause += ` ${options['subJoin']['on']} `;
            options['subJoin']['on'] = '';
        }
        if (isViewJoin) {
            subQuery = `(select ${get} ${isSubStart ? `, json_agg(distinct "${nextAs}".*) as "${nextAsProp}" from "${table}" as "${alias}" ` :
                `from "${table}" as "${alias}" ${subsWhere}) as "${alias}" ${!isSubStart ? subsOnClause : ''} `} `;
            options['query'].push(`${joinType} ${subQuery}`);
            if (isSubStart) {
                includes.push(`, json_agg("_view${nextAlias}".*) AS "${asProp}"`);
            }
        }
        else {
            subQuery = `(select ${get} ${isSubStart ? `, json_agg("${alias}".*) as "${asProp}" from "${table}" as "${alias}" ` :
                `from "${table}" as "${alias}" ${subsWhere} ${groupBy}) as "${alias}" ${!isSubStart ? subsOnClause : ''} `} `;
            options['query'].push(`${joinType} ${subQuery}`);
        }
        let vieJoinInclude = isViewJoin && (table == nextTable) ? `${obj['distinct'] ? 'distinct ' : ''} _view${nextAlias}.*` : ` ${obj['distinct'] ? 'distinct ' : ''} "${alias}".*`;
        if (include) {
            if (returnType == 'object') {
                get.includes('distinct') ? get = get.replace('distinct', '') : false;
                !(needSubQuery) ? includes.push(`, row_to_json(${get}, true) as "${asProp}"`) :
                    includes.push(`, row_to_json(${vieJoinInclude}, true) AS "${asProp}"`);
                !(needSubQuery) ? options['group'].push(get) : options['group'].push(vieJoinInclude);
            }
            else if (returnType == 'array') {
                if (!(isViewJoin)) {
                    if (!(needSubQuery)) {
                        includes.push(`, JSON_AGG(${get}) AS "${asProp}"`);
                    }
                    else {
                        includes.push(`, JSON_AGG(${vieJoinInclude}) AS "${asProp}"`);
                    }
                }
            }
        }
        for (let key in obj) {
            if (obj.hasOwnProperty(key) && key == "join" || key == "viewJoin") {
                options['joinType'].push(obj[key].joinType);
                if (obj[key].constructor == Array) {
                    this.prepareJoins(alias, aliasMap, obj[key], options, includes, false, key == 'viewJoin' ? true : false, secretFields);
                }
                else {
                    this.prepareJoin(alias, aliasMap, obj[key], obj, options, includes, false, isViewJoin, isSubEnd, secretFields);
                }
            }
            else {
            }
        }
        ;
        return {
            options: options,
            includes: includes
        };
    }
    getTotalCount(req, res, next, cb) {
        let table = '';
        if (req.body.table != null) {
            table = req.body.table;
        }
        else {
            table = this.table;
        }
        this.query(`SELECT count(*) FROM "${table}";`, (err, resp) => {
            if (err) {
                return res.status(500).json({ statusCode: 500, errorMessage: err });
            }
            else {
                //return res.json(resp.rows);
                return cb ? cb(this.checkAndDecrypt(resp.rows, req['secretFields'])) : resp.rows;
            }
        });
    }
    convertToUTCDate(date) {
        let dateInput = date || null, dateOutput;
        if (dateInput != null) {
            dateOutput = dateInput.slice(0, dateInput.indexOf('T'));
        }
        return dateOutput;
    }
    buildInsertObj(body) {
        let insertObj = {};
        if (body && body.cascadeTable) {
            for (let property in body) {
                if (body.hasOwnProperty(property) || property == 'cascade') {
                    insertObj[property] = body[property];
                }
            }
        }
        else {
            for (let property in body) {
                if (body.hasOwnProperty(property)) {
                    if (this.model.schema.hasOwnProperty(property) || property == 'cascade') {
                        insertObj[property] = body[property];
                    }
                }
            }
        }
        return insertObj;
    }
    setUpdateProp(obj) {
        obj['updated_at'] = 'localtimestamp';
        return obj;
    }
    setCreatedProp(obj) {
        obj['created_at'] = 'localtimestamp';
        return obj;
    }
    isSecretField(secretFields, prop) {
        let isSecret = false;
        if (secretFields && secretFields.length > 0) {
            isSecret = secretFields.filter((item, i, a) => {
                return item.field === prop;
            }).length > 0 ? true : false;
        }
        return isSecret;
    }
}
exports.PSQLWrapper = PSQLWrapper;
