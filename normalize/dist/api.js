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
const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
//import * as Models from './models/index';
const base_model_1 = require("./models/base.model");
exports.BaseModel = base_model_1.BaseModel;
const mssql_to_postgres_1 = require("./migration/mssql-to-postgres");
const email_cron_1 = require("./cron/email.cron");
// pg
const pg = require('pg');
// http
const http = require('http');
//http.globalAgent.maxSockets = 20;
//http.globalAgent.keepAlive = true;
//http.Agent.defaultMaxSockets = 200;
//console.log(http.Agent);
//console.log(http.globalAgent);
// cors
const cors = require('cors');
// mongoose
const mongoose = require('mongoose');
// api authentication
const passport = require('passport');
const Strategy = require('passport-local');
const expressJWT = require('express-jwt');
const bcrypt = require('bcrypt');
// environment variable
const envFile = require('../.env');
const dotEnv = require('dotenv').load(envFile);
const helmet = require('helmet');
const compression = require("compression");
const cluster = require('cluster');
// session 
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
class API {
    constructor(options) {
        this.options = options;
        // static pool: any = null;
        this.pool = null;
        this.models = [];
        this.schema = [];
        this.initialized = false;
        this.cachedModels = [];
        this.server = null;
        this.app = express();
        this.port = options.port || 3000;
        this.configureDatabase(this.app, options);
    }
    dbExistCheck(client, query) {
        return new Promise((resolve) => {
            client.query(query, (err, resp) => {
                if (err) {
                    console.log('Error while connecting: ' + err.stack);
                    resolve(false);
                }
                else {
                    if (resp.rows[0].count == 0) {
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                }
            });
        });
    }
    getDBInstance(config, options, init) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                this.pool = new pg.Pool(config);
                this.pool.on('error', (err, client) => {
                    console.error('idle client error', err.message, err.stack);
                });
                let checkConn = `postgres://${options.dbUser}:${options.dbPassword}@${options.dbHost}:${options.dbPort}/postgres`; // the default database
                let client = new pg.Client(checkConn);
                client.connect();
                let query = `select count(*) from pg_catalog.pg_database where lower(datname) = lower('${options.dbName}')`;
                const exists = yield this.dbExistCheck(client, query);
                if (!exists) {
                    let created = yield this.createDatabase(client, options);
                }
                else {
                }
                this.db == null ? this.db = { query: null, connect: null } : null;
                this.db = {
                    query: (text, values, cb) => {
                        return this.pool.query(text, values, (err, resp) => {
                            cb(err, resp);
                        });
                    },
                    connect: (cb) => {
                        return this.pool.connect((err, client, release) => {
                            cb(err, client, release);
                        });
                    }
                };
                resolve(this.db);
                return this.db;
            }
            else {
                resolve(this.db);
                return this.db;
            }
        }));
    }
    createDatabase(client, options) {
        return new Promise((res) => {
            const query = `CREATE DATABASE "${options.dbName}" OWNER ${options.dbUser}`;
            client.query(query, (err, resp) => {
                if (err) {
                    console.log('create database error', err); // ignore if the db is there  
                    setTimeout(() => {
                        res(err);
                    }, 6000);
                    throw new Error(err);
                }
                else {
                    // must wait at least 6 seconds before newly created database is ready for use
                    setTimeout(() => {
                        res(resp);
                    }, 6000);
                }
            });
        });
    }
    configureDatabase(app, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                let norm;
                switch (options.dbType) {
                    case 'mongo':
                        mongoose.connect(this.options.connectionString);
                        console.log('conn string', this.options.connectionString);
                        console.log(`database set to ${this.options.dbType}, and is connected to ${this.options.dbName}`);
                        norm = yield this.initialize(app, options);
                        // set this.db = mongoose.connect
                        break;
                    case 'postgres':
                        let config = {
                            user: options.dbUser,
                            database: options.dbName,
                            password: options.dbPassword,
                            host: options.dbHost,
                            port: options.dbPort,
                            max: 20,
                            idleTimeoutMillis: 3000,
                            connectionTimeoutMillis: 3000
                        };
                        const dbInstance = yield this.getDBInstance(config, options);
                        if (dbInstance) {
                            norm = yield this.initialize(app, options);
                            yield this.loadTennancy(dbInstance);
                        }
                        break;
                    case 'mysql':
                        break;
                    case 'mssql':
                        break;
                    default:
                        break;
                }
                resolve(norm);
            }));
        });
    }
    configureMiddleware(app) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            app.use(logger('dev'));
            app.use(bodyParser.json({ limit: '35mb' }));
            app.use(bodyParser.urlencoded({ extended: false }));
            app.use(helmet());
            app.use(compression());
            app.use(cookieParser());
            //app.set('trust proxy', 1) // trust first proxy
            app.use(session(yield this.getSessConfig()));
            resolve(true);
        }));
    }
    getSessConfig() {
        return new Promise((resolve) => {
            resolve({
                store: new pgSession({
                    pool: this.pool,
                    tableName: 'Session' // with the capital 'S'
                }),
                secret: process.env.SESSION_SECRET,
                resave: false,
                name: 'sessID',
                // proxy: true,
                saveUninitialized: false,
                rolling: true,
                cookie: {
                    //maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days 
                    maxAge: 30 * 60 * 1000 * 4,
                    path: "/",
                    httpOnly: true,
                }
            });
        });
    }
    configureRoutes(app) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const models = require('./models');
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                yield this.bootstrap(models, false);
                resolve(true);
            }), 1000);
        }));
    }
    createModel(scope, key, models, base) {
        // console.log('from createModel', key, scope.options);
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let model;
            if (Object.keys(scope.schema).indexOf(key) != -1) {
                resolve(scope.cachedModels[key]);
            }
            else {
                if (base) {
                    let m = new models[key](scope);
                    const params = [...m.model];
                    model = new base_model_1.BaseModel(scope.options, key, params[0], params[1] != null ? params[1] : 'N/A', params[2] != null && params[2].length > 0 ? params[2] : [], scope);
                }
                else {
                    model = new models[key](scope.options, key, scope);
                }
                scope.models.push(model.model);
                scope.schema[key] = model.model;
                scope.app.use(`${scope.options.routePrefix}/${key.toLowerCase()}`, model.model.router.make());
                scope.cachedModels[key] = model;
                resolve(model);
            }
        }));
    }
    bootstrap(models, fromBase) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const base = fromBase != null ? fromBase : false;
            const mKeys = Object.keys(models) || [];
            //    const mKeys: any = await this.sortModels(models) || [];
            const mCount = mKeys.length > 0 ? mKeys.length : 0;
            const promises = mKeys && mKeys.length > 0 ? mKeys.map((key, index) => __awaiter(this, void 0, void 0, function* () {
                return yield this.createModel(this, key, models, base);
            })) : [];
            let resps = promises.length > 0 ? yield Promise.all(promises) : [];
            let p = resps.length > 0 ? resps.map((m) => {
                return m.init();
            }) : [];
            let m = yield Promise.all(p);
            let mFailed = m.length > 0 ? m.filter(mo => !mo.ready) : [];
            //console.log('n=mFailed', mFailed);
            let mPromises = mFailed.length > 0 ? mFailed.map((mi) => __awaiter(this, void 0, void 0, function* () {
                return mi.init();
            })) : [];
            let done = (mCount == 0) || (mCount != 0 && mFailed.length == 0) ? true : false;
            if (!done) {
                let fResp = yield Promise.all(mPromises);
                done = true; // should not need to run more than once
                resolve(true);
            }
            else {
                let s = m.length > 0 ? m.map((it, i, a) => __awaiter(this, void 0, void 0, function* () {
                    return it.seed(this.options.seedDir != null ? this.options.seedDir : '../../seed', it.name);
                })) : [];
                let output = s.length > 0 ? yield Promise.all(s) : true;
                resolve(output);
                return output;
            }
        }));
    }
    // TODO TO BE REMOVE
    processModels(array, models, base, fn) {
        let results = [];
        return array.reduce((p, item) => {
            return p.then(() => {
                return fn(this, item, models, base).then((data) => {
                    results.push(data);
                    return results;
                });
            });
        }, Promise.resolve());
    }
    sortModels(models) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                let sorted = [];
                let promises = Object.keys(models).reduce((p, it, i, a) => {
                    return p.then(() => __awaiter(this, void 0, void 0, function* () {
                        return this.getFkeys(it).then((r) => {
                            sorted.push(r);
                            return sorted;
                        });
                    }));
                }, Promise.resolve());
                promises.then((s) => {
                    resolve(s ? s.sort((a, b) => {
                        return a.keyCount > b.keyCount ? -1 : 1; // reverse 
                    }) : false);
                });
            });
        });
    }
    getFkeys(tableName) {
        return new Promise((res) => __awaiter(this, void 0, void 0, function* () {
            let query = `SELECT
                            tc.constraint_name, tc.table_name, kcu.column_name, 
                            ccu.table_name AS foreign_table_name,
                            ccu.column_name AS foreign_column_name 
                        FROM 
                            information_schema.table_constraints AS tc 
                            JOIN information_schema.key_column_usage AS kcu
                            ON tc.constraint_name = kcu.constraint_name
                            JOIN information_schema.constraint_column_usage AS ccu
                            ON ccu.constraint_name = tc.constraint_name
                        WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='${tableName}';`;
            this.db.query(query, null, (err, resp) => {
                if (resp && resp.rows) {
                    // console.log(resp.rows);
                    res({ table: tableName, keyCount: resp.rows.length });
                }
            });
        }));
    }
    // END TODO TO BE REMOVE
    configureJWT(app) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                const resp = yield this.superAdminExistCheck();
                if (resp) {
                    let whitelist = [
                        /\/api\/v1\/user\/login(?!\/renew)/,
                        /\/api\/v1\/user\/recover-password/,
                        /\/api\/v1\/user\/forgot-password/,
                        /\/api\/v1\/user\/is-loggedin/,
                        /\/api\/v1\/user\/create-secure/,
                        /\/api\/v1\/app\/tennant/
                    ];
                    resp && this.options.environment == 'production' ? whitelist.splice(whitelist.indexOf(/\/api\/v1\/user\/create-secure/, 1)) : null;
                    app.use('/', expressJWT({
                        secret: process.env.JWT_SECRET,
                        credentialsRequired: true,
                        getToken: (req) => {
                            //console.log('req---->', req);
                            if (req && req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
                                return req.headers.authorization.split(' ')[1];
                            }
                            else if (req && req.query && req.query.token) {
                                return req.query.token;
                            }
                            return null;
                        }
                    }).unless({
                        path: whitelist
                    }));
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            }));
        });
    }
    configureCors(app) {
        return new Promise((resolve) => {
            let sameOrigin = false;
            app.use((req, res, next) => {
                sameOrigin = req.headers.origin === undefined;
                req.headers.origin = req.headers.origin || req.headers.host;
                next();
            });
            const corsHostnameWhitelist = ['http://localhost:4200'];
            const options = {
                origin: (origin, callback) => {
                    if (sameOrigin || corsHostnameWhitelist.indexOf(origin) !== -1) {
                        callback(null, true);
                    }
                    else {
                        callback(new Error(`Origin: ${origin} is not allowed to access API!`));
                    }
                },
                credentials: true
            };
            app.options('*', cors(options)); // preflight
            app.use(cors(options));
            resolve(true);
        });
    }
    configureCron(api) {
        return new Promise((resolve) => {
            if (this.options.cluster && cluster && cluster.worker && cluster.worker.process.env.role == 'data_broker' || !(this.options.cluster)) {
                const emailCron = new email_cron_1.EmailCron(api);
                emailCron.scheduleMassPasswordReset({ days: 90, maxEmailSend: 3 });
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    }
    migrate(options) {
        const tables = [
            // tables to migrate
            {
                table: '_AAName',
            }
        ];
        new mssql_to_postgres_1.MSSQLToPG(options, tables, this).run();
    }
    handleError(app) {
        // log unhandledRejection stack trace in dev mode
        if (this.options.environment == 'development') {
            process.on('unhandledRejection', (r) => console.log(r));
        }
        app.use((error, req, res, next) => {
            if (!error) {
                next();
            }
            else {
                if (this.options.environment == 'development') {
                    console.error(error.stack);
                    res.status(500).send({ error: error.stack });
                }
                else if (this.options.environment == 'production') {
                    next();
                }
            }
            req.socket.on("error", () => {
                if (this.options.environment == 'development') {
                    console.log('from api.ts req socket err');
                    res.status(500).send({ error: error.stack });
                }
                else if (this.options.environment == 'production') {
                    next();
                }
            });
        });
    }
    loadTennancy(db) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((cluster && (cluster.isMaster)) || !(this.options.cluster)) {
                return new Promise((resolve) => {
                    if (db && db != null && db != undefined && db.query != null) {
                        db.query(`select * from "App" where "active" = true and "primary" = false`, null, (err, resp) => __awaiter(this, void 0, void 0, function* () {
                            if (!err) {
                                if (resp && resp.rows.length > 0) {
                                    let promises = [];
                                    resp.rows.map((item, i, a) => __awaiter(this, void 0, void 0, function* () {
                                        // if main app, do not spawn again
                                        let main = item.options.dbName == process.env.DB_NAME;
                                        if (!main) {
                                            let api = new API(item.options);
                                            promises.push(api.initialize(api.app, item.options));
                                        }
                                    }));
                                    if (promises && promises.length > 0) {
                                        return Promise.all(promises).then((resps) => {
                                            if (resps && resps.length > 0) {
                                                resps.forEach((normalize) => {
                                                    normalize.ready((norm) => {
                                                        norm.spawn();
                                                    });
                                                });
                                                resolve(resps);
                                            }
                                        });
                                    }
                                    else {
                                        resolve();
                                    }
                                }
                                else {
                                    resolve();
                                }
                            }
                            else {
                                resolve();
                            }
                        }));
                    }
                    else {
                        resolve([]);
                    }
                });
            }
            else {
                Promise.resolve([]);
            }
        });
    }
    initialize(app, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                //options.migrate != null ? this.migrate(options) : false;
                yield this.configureJWT(app);
                yield this.configureMiddleware(app);
                yield this.configureCors(app);
                yield this.configureRoutes(app);
                yield this.configureCron(this);
                this.handleError(app);
                this.initialized = true;
                if (this.readyCallback)
                    this.readyCallback(this);
                resolve(this);
            }));
        });
    }
    // callback for when normalize is ready
    ready(cb) {
        if (this.initialized) {
            cb(this);
        }
        else {
            this.readyCallback = cb;
        }
    }
    importModel(name, schema, desc, customRoutes, seedDir) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let m = new base_model_1.BaseModel(this.options, name, schema, desc != null ? desc : 'N/A', customRoutes != null ? customRoutes : [], this);
            this.models.push(m.model);
            this.schema[name] = m.model;
            this.app.use(`${this.options.routePrefix}/${name.toLowerCase()}`, m.model.router.make());
            let model = yield m.init();
            if (!model.ready) {
                yield model.init();
            }
            else {
                model.seed(this.options.seedDir != null ? this.options.seedDir : '../../seed', model.name);
            }
            //for (let i in m.model.router.make().stack) {
            // if (name === 'Test') console.log(`KEY: ${name} ROUTE:${m.model.router.make().stack[i].regexp}`);
            //}
            resolve(true);
            return this;
        }));
    }
    getModelByName(name) {
        return this.models.filter((model) => { return model.controller.name == name; }).pop();
    }
    getSchema(name) {
        return this.schema[name];
    }
    superAdminExistCheck() {
        return new Promise((resolve) => {
            this.pool != null ? this.pool.query(`select * from "User"`, null, (err, resp) => {
                if (resp && resp.rows.length > 0) {
                    resolve(resp.rows.filter((user) => {
                        return user.super_admin == true;
                    }).length > 0);
                }
                else {
                    resolve(false);
                }
            }) : resolve(false);
        });
    }
    spawn() {
        if ((cluster && !(cluster.isMaster)) || !(this.options.cluster)) {
            this.server = http.createServer(this.app)
                .on('listening', (address) => {
                console.log(`Server is running and serving: ${this.options.dbName}`, this.server.address());
                if (this.server.address().port != this.port) {
                    throw new Error('Server not listening correctly - is address in use?');
                }
            })
                .on('connection', (socket) => {
                //  socket.setTimeout(240 * 1000);
            })
                .on('error', (err) => {
                if (err.code == 'EADDRINUSE') {
                    console.log(`Port: ${this.port} is in use by worker pid: ${process.pid}!`);
                    setTimeout(() => {
                        this.server.close();
                        //this.spawn();
                    }, 1000);
                }
            }).listen(this.port);
        }
        return {
            server: this.server,
            api: this
        };
    }
    listen() {
        this.server != null ? this.server.listen(this.port) : null;
    }
    restartWorkers() {
        let workerIds = [];
        if (cluster && cluster.workers) {
            for (let id in cluster.workers) {
                workerIds.push(id);
            }
            workerIds.forEach((id) => {
                cluster.workers[id].send({
                    cmd: 'shutdown',
                    from: 'master'
                });
                setTimeout(() => {
                    if (cluster.workers[id]) {
                        cluster.workers[id].kill('SIGKILL');
                    }
                }, 5000);
            });
        }
    }
}
exports.API = API;
