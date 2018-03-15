"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailer_1 = require("../email/mailer");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10;
const request = require('request').defaults({ encoding: null });
class Authentication {
    constructor(model, options, name) {
        this.model = model;
        this.options = options;
        this.name = name;
        this.isSuperAdmin = (req, res, next) => {
            if (this.options.dbType == 'mongo') {
                this.model.findById(req.params.id, (err, resp) => {
                    if (!err) {
                        res.json(this.model.controller.send(200, { is_super_admin: resp.super_admin }));
                    }
                    else {
                        res.json(this.model.controller.sendError(500, err));
                    }
                });
            }
            else if (this.options.dbType == 'postgres') {
                const query = {
                    get: ["super_admin"],
                    table: this.name,
                    where: {
                        id: req.params.id
                    }
                };
                this.model.controller.psql.get(Object.assign(req.body, { body: query }), res, next, (resp) => {
                    if (resp.length > 0) {
                        res.json(this.model.controller.send(200, resp[0]));
                    }
                    else {
                        res.json(this.model.controller.sendError(500, resp));
                    }
                });
            }
        };
        this.findByEmail = (req, res, next) => {
            this.findUser(req, res, next).then((resp) => {
                res.json(this.model.controller.send(200, resp));
            });
        };
        this.createSecureUser = (req, res, next) => {
            this.appendSecretFields(req);
            this.findUser(req, res, next).then((user) => {
                if (user['errorCode'] == 500) {
                    this.model.controller.psql.insert(req, res, next, (resp) => {
                        if (resp) {
                            const message = {
                                from: process.env.TEST_EMAIL,
                                //to: req.body.email, // list of receivers
                                to: process.env.TEST_EMAIL,
                                subject: 'Secure User Created!',
                                html: `<p>You are now a part of NobleOne user group!</p>` // email body
                            };
                            this.emailer.send(message);
                            res.json(this.model.controller.send(200, resp));
                        }
                    });
                }
                else {
                    res.json(this.model.controller.sendError(401, 'user already exist!'));
                }
            });
        };
        this.isLoggedIn = (req, res, next) => {
            res.json(this.model.controller.send(200, req['session'].user !== null));
        };
        this.logout = (req, res, next) => {
            req['session'].destroy((err) => {
                res.json(this.model.controller.send(200, 'User is logged out!'));
            });
        };
        this.login = (req, res, next) => {
            // this.appendSecretFields(req);
            const docServerEnabled = process.env.DOC_STORAGE_API_URL != null && process.env.DOC_STORAGE_API_URL != '';
            if (this.options.dbType == 'mongo') {
                this.model.findOne({ email: req.body.email }, (err, user) => {
                    if (err) {
                        res.json(this.model.controller.sendError(500, err));
                    }
                    else if (user) {
                        bcrypt.compare(req.body.password, user.password, (err, resp) => {
                            if (!resp) {
                                res.json(this.model.controller.sendError(500, 'Incorrect password!'));
                            }
                            else {
                                res.json({
                                    token: jwt.sign(user, process.env.JWT_SECRET),
                                    user: user
                                });
                            }
                        });
                    }
                    else {
                        res.json(this.model.controller.sendError(500, err));
                    }
                });
            }
            else if (this.options.dbType == 'postgres') {
                req['session'].login == null ? req['session'].login = [] : null;
                const obj = {};
                obj[req.body.email] = {};
                let index = req['session'].login.findIndex((item, i, a) => {
                    return item[req.body.email] != null;
                });
                if (index == -1) {
                    req['session'].login.push(obj);
                    index = req['session'].login.length - 1;
                }
                req['session'].login[index].loginErrCount == null ? req['session'].login[index].loginErrCount = 0 : null;
                this.findUser(req, res, next).then((user) => {
                    if (user['errorCode'] == 500) {
                        res.json(this.model.controller.sendError(500, user));
                    }
                    else if (user) {
                        if (!user['locked']) {
                            bcrypt.compare(req.body.password, user['password'], (err, resp) => {
                                if (!resp) {
                                    req['session'].login[index].loginErrCount++;
                                    if (req['session'].login[index].loginErrCount >= 5) {
                                        this.lockAccount(user, index, req, res, next);
                                    }
                                    else {
                                        res.json(this.model.controller.sendError(500, { message: 'Incorrect password!', attempt: req['session'].login[index].loginErrCount }));
                                    }
                                }
                                else {
                                    req['session'].login[index].loginErrCount = 0;
                                    this.appendSecretFields(req);
                                    if (!user['is_activated']) {
                                        this.activateAccount(user, req, res, next, (activatedUser) => {
                                            req['session'].user = activatedUser[0];
                                            if (docServerEnabled) {
                                                this.docServerLogin(req, res, next, activatedUser[0]);
                                            }
                                            else {
                                                res.json({
                                                    token: jwt.sign(activatedUser[0], process.env.JWT_SECRET),
                                                    user: activatedUser[0]
                                                });
                                            }
                                        });
                                    }
                                    else {
                                        req['session'].user = user;
                                        if (docServerEnabled) {
                                            this.docServerLogin(req, res, next, user);
                                        }
                                        else {
                                            res.json({
                                                token: jwt.sign(user, process.env.JWT_SECRET),
                                                user: user
                                            });
                                        }
                                    }
                                }
                            });
                        }
                        else {
                            res.json(this.model.controller.sendError(423, 'Your account has been locked! Please contact your administrator to unlock your account!'));
                        }
                    }
                    else {
                        res.json(this.model.controller.sendError(500, 'User not found!'));
                    }
                });
            }
        };
        this.unlockAccount = (req, res, next) => {
            let findReq = { body: { email: req['reqUser'].email } };
            this.findUser(findReq, res, next).then((user) => {
                if (user['errorCode'] == 500) {
                    res.json(this.model.controller.sendError(500, 'Account Locked! This is unusual!'));
                }
                else if (user) {
                    if (user['super_admin']) {
                        const payload = {
                            body: {
                                locked: false,
                                where: { id: req.body['userID'] } // the user with locked account
                            }
                        };
                        this.model.controller.psql.updateSet(payload, res, next, (resp) => {
                            if (resp) {
                                this.emailer.send({
                                    from: process.env.TEST_EMAIL,
                                    //to: resp.email,
                                    to: process.env.TEST_EMAIL,
                                    subject: 'Account Restored!',
                                    html: `<p>Dear User</p>
                 <p>Your account has been unlocked and restored by an administrator!</p>`
                                });
                                res.json(this.model.controller.send(200, 'Account Restored! Your account has been restored!'));
                            }
                        });
                    }
                    else {
                        res.json(this.model.controller.sendError(500, 'Account Restore Failed! Your account does not have proper privileges to unlock account! Please contact an administrator!'));
                    }
                }
            });
        };
        this.docServerLogin = (req, res, next, user) => {
            return new Promise((resolve) => {
                request({
                    url: `${process.env.DOC_STORAGE_API_URL}/user/login`,
                    method: "POST",
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {
                        email: process.env.FILE_STORAGE_APP_EMAIL,
                        password: process.env.FILE_STORAGE_APP_PASSWORD
                    }
                }, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        res.json({
                            token: jwt.sign(user, process.env.JWT_SECRET),
                            docToken: body['token'],
                            user: user
                        });
                    }
                    else {
                        res.status(500).send({ message: 'Unable to login to document server' });
                    }
                });
            });
        };
        this.changePassword = (req, res, next) => {
            this.model.controller.getRequestUser(this.model.controller.getToken(req), (err, decodedUser) => {
                this.findUser(req, res, next).then((user) => {
                    req['reqUser'] == null ? req['reqUser'] = decodedUser : null;
                    if (!user['errorCode']) {
                        const oldPassword = req.body.oldPassword;
                        const newPassword = req.body.password;
                        if (oldPassword && oldPassword != null) {
                            bcrypt.compare(req.body.oldPassword, user['password'], (err, resp) => {
                                if (!resp) {
                                    res.json(this.model.controller.sendError(500, 'Incorrect password!'));
                                }
                                else {
                                    const canUpdate = req['reqUser'] && req['reqUser'] != null ?
                                        (req['reqUser'].email === user['email'] &&
                                            parseInt(req.params.id, null) === parseInt(req['reqUser'].id, null)) || user['super_admin'] : false;
                                    if (canUpdate) {
                                        if (newPassword) {
                                            req.body['email'] ? delete req.body['email'] : null;
                                            req.body['password_reset_at'] = 'localtimestamp';
                                            req.body['email_reminder_count'] = 0;
                                            req.body['locked'] = false;
                                            this.model.controller.psql.update(req, res, next, (resp) => {
                                                if (resp) {
                                                    res.json(this.model.controller.send(200, `Password updated!`));
                                                    this.emailer.send({
                                                        from: process.env.TEST_EMAIL,
                                                        //to: resp.email,
                                                        to: process.env.TEST_EMAIL,
                                                        subject: 'Change Password!',
                                                        html: `<p>You have changed your password! Please Login.</p>`
                                                    });
                                                }
                                            });
                                        }
                                        else {
                                            res.json(this.model.controller.sendError(500, `Password must be defined!`));
                                        }
                                    }
                                    else {
                                        res.json(this.model.controller.sendError(500, `Trying to change someone else's password?`));
                                    }
                                }
                            });
                        }
                        else {
                            res.json(this.model.controller.sendError(401, 'oldPassword must be defined!'));
                        }
                    }
                    else if (user['errorCode'] == 500) {
                        res.json(this.model.controller.sendError(401, 'user does not exist!'));
                    }
                });
            });
        };
        this.recoverPassword = (req, res, next) => {
            this.findUser(req, res, next).then((user) => {
                if (!user['errorCode']) {
                    const newPassword = req.body['newPassword'];
                    const canUpdate = req.body['email'] && req.body['email'] != null ?
                        (req.body['email'] === user['email']) : false;
                    let tokenExpired = false;
                    jwt.verify(req.body['token'], process.env.JWT_SECRET, (err, decoded) => {
                        if (err) {
                            tokenExpired = true;
                        }
                        if (canUpdate && !tokenExpired) {
                            if (newPassword) {
                                this.appendSecretFields(req);
                                req.body = {
                                    password: req.body['newPassword'],
                                    password_reset_at: 'localtimestamp',
                                    email_reminder_count: 0,
                                    locked: false,
                                    where: { id: user['id'] }
                                };
                                this.model.controller.psql.updateSet(req, res, next, (resp) => {
                                    if (resp) {
                                        this.emailer.send({
                                            from: process.env.TEST_EMAIL,
                                            //to: resp.email,
                                            to: process.env.TEST_EMAIL,
                                            subject: 'Recover Password!',
                                            html: `<p>You have recovered your password! Please Login!</p>`
                                        });
                                        res.json(this.model.controller.send(200, resp));
                                    }
                                });
                            }
                            else {
                                res.json(this.model.controller.sendError(500, `newPassword must be defined!`));
                            }
                        }
                        else {
                            res.json(this.model.controller.sendError(500, `Token is no longer valid or has expired!`));
                        }
                    });
                }
                else if (user['errorCode'] == 500) {
                    res.json(this.model.controller.sendError(401, 'user does not exist!'));
                }
            });
        };
        this.sendRecoverEmail = (req, res, next) => {
            this.findUser(req, res, next).then((user) => {
                if (!user['errorCode']) {
                    this.emailer.send({
                        from: process.env.TEST_EMAIL,
                        //to: resp.email,
                        to: process.env.TEST_EMAIL,
                        subject: 'Password Reset Request!',
                        html: `<p>You have requested a password reset! Please go <a href="${process.env.CLIENT_URL}/#/password-reset?token=${jwt.sign({ email: user['email'], id: user['id'] }, process.env.JWT_SECRET, { expiresIn: 60 * 30 })}">Here</a> to reset your password. This link is only valid for the next 30 minutes.</p>`
                    }, (resp) => {
                        res.json(this.model.controller.send(200, []));
                    });
                }
                else if (user['errorCode'] == 500) {
                    res.json(this.model.controller.sendError(401, 'user does not exist!'));
                }
            });
        };
        this.emailer = new mailer_1.Emailer();
    }
    appendSecretFields(req) {
        req['secretFields'] == null ? req['secretFields'] = this.model.controller.getAllSecretFields() : null;
        return req;
    }
    findUser(req, res, next) {
        return new Promise((resolve) => {
            if (this.options.dbType == 'mongo') {
                this.model.findOne({ email: req.body.email }, (err, user) => {
                    if (err) {
                        resolve(err);
                    }
                    else if (user) {
                        resolve(user);
                    }
                    else {
                        resolve({ errorCode: 500, errorMessage: 'find by email error! User may not exist!' });
                    }
                });
            }
            else if (this.options.dbType == 'postgres') {
                const query = {
                    get: ["*"],
                    table: this.name,
                    where: {
                        email: req.body.email
                    }
                };
                this.model.controller.psql.get(Object.assign(req.body, { body: query }), res, next, (resp) => {
                    if (resp.length == 0) {
                        resolve({ errorCode: 500, errorMessage: 'find by email error! User may not exist!' });
                    }
                    else {
                        resolve(resp[0]);
                    }
                });
            }
        });
    }
    activateAccount(user, req, res, next, cb) {
        req.body = {
            is_activated: true,
            where: { id: user['id'] }
        };
        this.model.controller.psql.updateSet(req, res, next, (resp) => {
            if (resp) {
                this.emailer.send({
                    from: process.env.TEST_EMAIL,
                    //to: resp.email,
                    to: process.env.TEST_EMAIL,
                    subject: 'Change Password!',
                    html: `<p>You have changed your password! Please Login.</p>`
                });
                cb(resp);
            }
        });
    }
    lockAccount(user, index, req, res, next) {
        req.body = {
            locked: true,
            where: { id: user['id'] }
        };
        this.model.controller.psql.updateSet(req, res, next, (updateResp) => {
            if (updateResp) {
                req['session']['login'][index].loginErrCount = 0;
                this.emailer.send({
                    from: process.env.TEST_EMAIL,
                    //to: resp.email,
                    to: process.env.TEST_EMAIL,
                    subject: 'Account Locked!',
                    html: `<p>Dear Admin</p>
                 <p>The account for user email: ${user['email']} is locked because of too many failed login attempt!</p>`
                });
                res.json(this.model.controller.sendError(423, 'Your account has been locked! Please contact your administrator to unlock your account!'));
            }
        });
    }
}
exports.Authentication = Authentication;
