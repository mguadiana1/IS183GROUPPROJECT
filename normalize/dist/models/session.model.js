"use strict";
/*
    Required. A table used to store user session and login data.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base.model");
class Session extends base_model_1.BaseModel {
    constructor(options, name, api) {
        super(options, name, {
            id: { type: Number, key: 'primary', desc: `A numeric property used to identify ${name} record.`, nice_name: '' },
            sid: { type: String, default: null, desc: '', nice_name: '' },
            sess: { type: JSON, defalut: null, desc: '', nice_name: '' },
            expire: { type: Date, default: null, desc: '', nice_name: '' },
            user_id: {
                type: Number,
                key: 'foreign',
                references: { table: 'User', foreignKey: 'id' },
                onDelete: 'cascade',
                onUpdate: 'cascade',
                desc: '',
                nice_name: ''
            }
        }, 'A table used to store user session and login data.', [], api);
        this.options = options;
        this.name = name;
        this.api = api;
    }
}
exports.Session = Session;
