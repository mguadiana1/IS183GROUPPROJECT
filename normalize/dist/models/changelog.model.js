"use strict";
/*
    Required. A table uses to store application activities.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base.model");
class Changelog extends base_model_1.BaseModel {
    constructor(options, name, api) {
        super(options, name, {
            id: { type: Number, key: 'primary', desc: `A numeric property used to identify ${name} record.`, nice_name: '' },
            table_name: { type: String, maxlength: 75, desc: '', nice_name: '' },
            record_id: { type: String, maxlength: 5, desc: '', nice_name: '' },
            user_id: { type: String, maxlength: 20, desc: '', nice_name: '' },
            method: { type: String, maxlength: 20, desc: '', nice_name: '' },
            timestamp: { type: Number.MAX_SAFE_INTEGER, desc: '', nice_name: '' }
        }, 'A table uses to store application activities.', [], api);
        this.options = options;
        this.name = name;
        this.api = api;
    }
}
exports.Changelog = Changelog;
