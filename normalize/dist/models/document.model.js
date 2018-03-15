"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base.model");
const request = require('request').defaults({ encoding: null });
class Document extends base_model_1.BaseModel {
    constructor(options, name, api) {
        super(options, name, {
            id: { type: Number, key: 'primary', desc: `A numeric property used to identify ${name} record.`, nice_name: '' },
            file_name: { type: String, maxlength: 300, desc: '', nice_name: '' },
            file: { type: String, maxlength: 300, unique: true, desc: '', nice_name: '' },
            file_size: { type: Number, default: null, desc: '', nice_name: '' },
            description: { type: String, maxlength: 150, desc: '', nice_name: '' },
            document_type_id: {
                type: Number,
                key: 'foreign',
                references: { table: 'Type', foreignKey: 'id' },
                onDelete: 'cascade',
                onUpdate: 'cascade',
                desc: '',
                nice_name: ''
            }
        }, 'A table to store documents of any type. This table is linked to document type and client', [], api);
        this.options = options;
        this.name = name;
        this.api = api;
        this.insert = (req, res, next) => {
            if (this.options.dbType == 'mongo') {
                res.json(this.model.controller.send(200, { message: 'Comming soon!' }));
            }
            else if (this.options.dbType == 'postgres') {
                req['reqUser'] != null ? this.model.controller.setTouchByUser(req, 'insert') : false;
                req.body.file = this.model.controller.hash();
                this.model.controller.psql.insert(req, res, next, (resp) => {
                    this.model.controller.log(req, resp.id, 'POST');
                    if (res == null)
                        return resp;
                    res.status(201).send(resp);
                });
            }
        };
        this.removeDocument = (req, res, next) => {
            const blobController = this.api.getSchema('DocumentBlob').controller;
            /*
                body: {
                    where: {
                        file: "28gf4038-1938-c8h-824-0ehab12e99"
                    }
                }
            */
            this.model.controller.removeWhere(req, res, next);
        };
        this.getDocument = (req, res, next) => {
            const blobController = this.api.getSchema('DocumentBlob').controller;
            return blobController.findById(req, res, next);
        };
        this.saveDocument = (req, res, next) => {
            const blobController = this.api.getSchema('DocumentBlob').controller;
            req['body'] = {
                path: '',
                postfix: req.body.payload.postfix,
                size: req.body.payload.size,
                doc_guid: req.body.payload.doc_guid,
                base64: req.body.payload.base64
            };
            console.log('from saveDocument ', req.body);
            return blobController.insert(req, res, next);
        };
        this.route('/document/id/:id', 'POST', this.getDocument);
        this.route('/document', 'POST', this.saveDocument);
        this.route('/blob/remove', 'POST', this.removeDocument);
        this.route('/', 'POST', this.insert);
    }
}
exports.Document = Document;
