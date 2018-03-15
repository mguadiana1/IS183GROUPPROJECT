"use strict";
/*
    Required.
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
const normalize_1 = require("../normalize");
class App extends base_model_1.BaseModel {
    constructor(options, name, api) {
        super(options, name, {
            id: { type: Number, key: 'primary' },
            app_name: { type: String, maxlength: 24, unique: true },
            url: { type: String, maxlength: 200 },
            port: { type: Number, unique: true },
            version: { type: String, maxlength: 10 },
            api_prefix: { type: String, maxlength: 10 },
            environment: { type: String, maxlength: 24 },
            db_type: { type: String, maxlength: 24 },
            cluster: { type: Boolean, default: false },
            primary: { type: Boolean, default: false },
            api_key_id: { type: String, maxlength: 500 },
            api_secret: { type: String, maxlength: 500 },
            options: { type: JSON },
        }, '', [], api);
        this.options = options;
        this.name = name;
        this.api = api;
        /*
        {
            "app_name":"noble2",
            "url":"noble2.noble.cu.com",
            "port":3004,
            "version":"1.0.0",
            "api_prefix":"/api/v2",
            "primary":false,
            "environment":"development",
            "db_type":"postgres",
            "cluster":false
          }
        */
        this.getLogo = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const blobController = this.api.getSchema('DocumentBlob').controller;
            let resp = yield blobController.findById(req, null, null);
            // console.log('from getLogo resp', resp);
            if (resp.data) {
                let fileType = resp.data.postfix.split('.')[1];
                if (resp.data.postfix == '.png' || resp.data.postfix == '.jpg' || resp.data.postfix == '.jpeg' || resp.data.postfix == '.gif' || resp.data.postfix == '.svg+xml') {
                    let postfix = `image/${fileType}`;
                    return `data:${postfix};base64,${resp.data.blob}`;
                }
            }
            else {
                return null;
            }
        });
        // get all app for list
        this.getAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const resp = yield this.model.controller.get(req, res, next);
        });
        // get app with their options
        this.getApi = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const resp = yield this.model.controller.get(req, null, null);
            //console.log('resp', resp['data']);
            // console.log('resp.options', resp['data'][0].appOptions);
            let appOptions = resp && resp.data && resp.data.length > 0 && resp.data[0].appOptions && resp.data[0].appOptions.length > 0 ? resp['data'][0].appOptions : [];
            let opts = {};
            let options = appOptions.length > 0 ? appOptions.map((item, i, a) => __awaiter(this, void 0, void 0, function* () {
                // get the image
                if (item['option_key'] == 'bg_logo' || item['option_key'] == 'sm_logo') {
                    let guid = item['option_value'];
                    let logoReq = {
                        params: {
                            id: guid
                        }
                    };
                    let logo = yield this.getLogo(logoReq, null, null);
                    //console.log('logoooo', logo);
                    opts['option_value'] = logo;
                }
                item = Object.assign(item, opts);
                return item;
            })) : [];
            let o = yield Promise.all(options);
            resp.data.appOptions = options;
            res.json(resp);
        });
        this.createApi = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            req.body.api_key_id = this.model.controller.hash();
            req.body.api_secret = this.model.controller.hash();
            req.body.cluster = req.body.cluster != null ? req.body.cluster : false;
            req.body.primary = req.body.primary != null ? req.body.primary : false;
            req.body.api_prefix = req.body.api_prefix != null ? req.body.api_prefix : '/api/v1';
            req.body.environment = req.body.environment != null ? req.body.environment : 'development';
            req.body.db_type = req.body.db_type != null ? req.body.db_type : 'postgres';
            const options = req.body;
            let config = {
                cluster: options.cluster || false,
                seedDir: '/seed',
                port: parseInt(options.port),
                routePrefix: options.api_prefix || '/api/v1',
                environment: options.environment || 'development',
                dbType: options.db_type || 'postgres',
                dbName: `${options.app_name}_${process.env.DB_NAME}`,
                dbUser: process.env.DB_USER,
                dbPassword: process.env.DB_PASS,
                dbHost: process.env.DB_HOST,
                dbPort: process.env.DB_PORT,
                api_key_id: options.api_key_id,
                api_secret: options.api_secret
            };
            req.body.options = Object.assign({}, config);
            const resp = yield this.model.controller.insert(req, null, null);
            if (resp) {
                let normalize = new normalize_1.Normalize(config, {});
                normalize.ready((norm) => __awaiter(this, void 0, void 0, function* () {
                    const models = require('../models');
                    let bootstrapped = yield norm.bootstrap(models, false);
                    if (bootstrapped) {
                        res.json(resp);
                        norm.spawn();
                    }
                    else {
                        res.json(this.model.controller.sendError(500, 'Failed to spin up new application instance!'));
                    }
                }));
            }
        });
        this.route('/', 'POST', this.createApi, true);
        this.route('/tennant', 'POST', this.getApi, false);
        this.route('/get', 'POST', this.getAll, false);
    }
}
exports.App = App;
