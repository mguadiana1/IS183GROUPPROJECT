"use strict";
/*
    Required. A table use to store user role types.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base.model");
class RoleType extends base_model_1.BaseModel {
    constructor(options, name, api) {
        super(options, name, {
            id: { type: Number, key: 'primary', desc: `A numeric property used to identify ${name} record.`, nice_name: '' },
            description: { type: String, maxlength: 50, desc: '', nice_name: '' }
        }, 'A table use to store roles', [], api);
        this.options = options;
        this.name = name;
        this.api = api;
    }
}
exports.RoleType = RoleType;
