"use strict";
/*
    Required. A table used to store Tables/Schema data. This table is useful for reporting and dynammic routing.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base.model");
class Schema extends base_model_1.BaseModel {
    constructor(options, name, api) {
        super(options, name, {
            id: { type: Number, key: 'primary', desc: `A numeric property used to identify ${name} record.`, nice_name: '' },
            schema_name: { type: String, maxlength: 75, desc: '', nice_name: '' },
            schema_nice_name: { type: String, maxlength: 75, desc: '', nice_name: '' },
            description: { type: String, maxlength: 500, desc: '', nice_name: '' },
            schema: { type: JSON, desc: '', nice_name: '' }
        }, 'A table used to store Tables/Schema data. This table is useful for reporting and dynammic routing.', [], api);
        this.options = options;
        this.name = name;
    }
}
exports.Schema = Schema;
