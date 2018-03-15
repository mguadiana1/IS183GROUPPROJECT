"use strict";
/*
    Required. A table used to store various entity types. Useful to populate dropdown list and create groupings etc.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base.model");
class Type extends base_model_1.BaseModel {
    constructor(options, name, api) {
        super(options, name, {
            id: { type: Number, key: 'primary', desc: `A numeric property used to identify ${name} record.`, nice_name: '' },
            type_name: { type: String, maxlength: 75, desc: '', nice_name: '' },
            abbr: { type: String, maxlength: 50, desc: '', nice_name: '' },
            description: { type: String, maxlength: 5000, desc: '', nice_name: '' },
            type_code_id: {
                type: Number,
                key: 'foreign',
                references: { table: 'TypeCode', foreignKey: 'id' },
                onDelete: 'cascade',
                onUpdate: 'cascade',
                desc: '',
                nice_name: ''
            }
        }, 'A table used to store various entity types. Useful to populate dropdown list and create groupings etc.', [], api);
        this.options = options;
        this.name = name;
        this.api = api;
    }
}
exports.Type = Type;
