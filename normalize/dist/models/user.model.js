"use strict";
/*
    Required. A table used to store user information.
*/
Object.defineProperty(exports, "__esModule", { value: true });
const base_model_1 = require("./base.model");
const authentication_1 = require("../authentication/authentication");
class User extends base_model_1.BaseModel {
    constructor(options, name, api) {
        // call the super class and create the model
        super(options, name, {
            id: { type: Number, key: 'primary', desc: `A numeric property used to identify ${name} record.`, nice_name: '' },
            email: { type: String, unique: true, desc: '', nice_name: '' },
            username: { type: String, desc: '', nice_name: '' },
            password: { type: String, maxlength: 200, bcrypt: true, desc: '', nice_name: '' },
            super_admin: { type: Boolean, default: false, desc: '', nice_name: '' },
            is_activated: { type: Boolean, default: false, desc: '', nice_name: '' },
            locked: { type: Boolean, default: false, desc: '', nice_name: '' },
            app_id: {
                type: Number,
                key: 'foreign',
                references: { table: 'App', foreignKey: 'id' },
                onDelete: 'set null',
                onUpdate: 'cascade',
                desc: '',
                nice_name: ''
            },
            email_reminder_count: { type: Number, default: 0, desc: '', nice_name: '' },
            password_reset_at: { type: Date, default: Date.now(), desc: '', nice_name: '' },
            site_admin: { type: Boolean, default: false },
        }, 'A table used to store user information.', [], api);
        this.options = options;
        this.name = name;
        this.api = api;
        // register custom endpoints
        this.auth = new authentication_1.Authentication(this.model, options, name);
        this.route('/id/:id/super', 'GET', this.auth.isSuperAdmin);
        this.route('/login', 'POST', this.auth.login);
        this.route('/find-by-email', 'POST', this.auth.findByEmail);
        this.route('/create-secure', 'POST', this.auth.createSecureUser);
        this.route('/id/:id/change-password', 'POST', this.auth.changePassword);
        this.route('/forgot-password', 'POST', this.auth.sendRecoverEmail);
        this.route('/recover-password', 'POST', this.auth.recoverPassword);
        this.route('/logout', 'GET', this.auth.logout);
        this.route('/unlock-account', 'POST', this.auth.unlockAccount);
        this.route('/is-loggedin', 'GET', this.auth.isLoggedIn);
    }
}
exports.User = User;
