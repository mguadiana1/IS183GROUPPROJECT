"use strict";
/*
    Required. A table use to store user, internal and application notifications.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base.model");
class Notification extends base_model_1.BaseModel {
    constructor(options, name, api) {
        super(options, name, {
            id: { type: Number, key: 'primary', desc: `A numeric property used to identify ${name} record.`, nice_name: '' },
            content: { type: String, maxlength: 255, desc: '', nice_name: '' },
            regarding: { type: String, maxlength: 55, desc: '', nice_name: '' },
            public: { type: Boolean, default: true, desc: '', nice_name: '' },
            pristine: { type: Boolean, default: true, desc: '', nice_name: '' },
            from_user_id: {
                type: Number,
                key: 'foreign',
                references: { table: 'User', foreignKey: 'id' },
                onDelete: 'cascade',
                onUpdate: 'cascade',
                desc: '',
                nice_name: ''
            },
            to_user_id: {
                type: Number,
                key: 'foreign',
                references: { table: 'User', foreignKey: 'id' },
                onDelete: 'cascade',
                onUpdate: 'cascade',
                desc: '',
                nice_name: ''
            }
        }, 'A table used to store notifications sent to and from user to other users and branches.', [], api);
        this.options = options;
        this.name = name;
        this.api = api;
    }
}
exports.Notification = Notification;
