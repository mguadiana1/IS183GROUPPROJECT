"use strict";
/*
    Required. A table that establishes a many to many relationship on table User and RoleType.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base.model");
class UserRole extends base_model_1.BaseModel {
    constructor(options, name, api) {
        super(options, name, {
            id: { type: Number, key: 'primary', desc: `A numeric property used to identify ${name} record.`, nice_name: '' },
            user_id: {
                type: Number,
                key: 'foreign',
                references: { table: 'User', foreignKey: 'id' },
                onDelete: 'cascade',
                onUpdate: 'cascade',
                desc: '',
                nice_name: ''
            },
            role_type_id: {
                type: Number,
                key: 'foreign',
                references: { table: 'RoleType', foreignKey: 'id' },
                onDelete: 'cascade',
                onUpdate: 'cascade',
                desc: '',
                nice_name: ''
            }
        }, 'A table that establishes a many to many relationship on table User and RoleType.', [], api);
        this.options = options;
        this.name = name;
        this.api = api;
    }
}
exports.UserRole = UserRole;
