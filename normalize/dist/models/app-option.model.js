"use strict";
/*
    Required.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base.model");
class AppOption extends base_model_1.BaseModel {
    constructor(options, name, api) {
        // call the super class and create the model
        super(options, name, {
            id: { type: Number, key: 'primary' },
            option_key: { type: String, maxlength: 24 },
            option_value: { type: String, maxlength: 200 },
            app_id: {
                type: Number,
                key: 'foreign',
                references: { table: 'App', foreignKey: 'id' },
                onDelete: 'cascade',
                onUpdate: 'cascade'
            }
        }, 'A table used to store application options', [], api);
        this.options = options;
        this.name = name;
        this.api = api;
    }
}
exports.AppOption = AppOption;
