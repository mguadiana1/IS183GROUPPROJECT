"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cron_1 = require("./cron");
const moment = require("moment");
const mailer_1 = require("../email/mailer");
const jwt = require('jsonwebtoken');
class EmailCron extends cron_1.Cron {
    constructor(api) {
        super();
        this.api = api;
        this.emailer = new mailer_1.Emailer();
    }
    scheduleMassPasswordReset(options) {
        const userController = this.api.getSchema('User').controller;
        this.schedule('every day at midnight', () => {
            let now = moment();
            userController.psql.get({
                body: {
                    get: ['id', 'email', 'password_reset_at', 'email_reminder_count', 'locked'],
                    sort: {
                        password_reset_at: 'DESC'
                    }
                }
            }, null, null, (users) => {
                if (users && users.length > 0) {
                    users.forEach((user, i, a) => __awaiter(this, void 0, void 0, function* () {
                        if (user.password_reset_at != null) {
                            let passwordResetAt = moment(user.password_reset_at);
                            //console.log('user.password_reset_at', user.password_reset_at);
                            passwordResetAt.subtract(options.days, 'days'); // for test
                            // console.log('now--->', now);
                            let daysSince = now.diff(passwordResetAt, 'days');
                            //console.log('daysSince', daysSince, "options.days", options.days);
                            if (daysSince >= options.days) {
                                yield this.sendMail(user, options);
                            }
                        }
                    }));
                }
            });
        }, {
            log: true,
            start: true
        });
    }
    lockAccount(user, options) {
        const userController = this.api.getSchema('User').controller;
        let payload = {
            body: {
                locked: true,
                where: { id: user.id }
            }
        };
        userController.psql.updateSet(payload, null, null, (resp) => {
            this.sendMail(user, options);
        });
    }
    sendMail(user, options) {
        return new Promise((resolve) => {
            const userController = this.api.getSchema('User').controller;
            let count = user.email_reminder_count != null ? parseInt(user.email_reminder_count) : 0;
            if (count < options.maxEmailSend) {
                let attempt = count == 1 ? '(first reminder)' : count == 2 ? '(second reminder)' : count == 3 ? '(third reminder)' : '';
                this.emailer.send({
                    from: process.env.TEST_EMAIL,
                    //to: user.email,
                    to: process.env.TEST_EMAIL,
                    subject: `Password Reset Required! ${attempt}`,
                    html: `<p>Password must be updated every ${options.days}! 
                  Please go <a href="${process.env.CLIENT_URL}/#/password-reset?token=${jwt.sign({ email: user.email, id: user.id }, process.env.JWT_SECRET, { expiresIn: 60 * 30 })}">
                  Here</a> to reset your password. This link is only valid for the next 30 minutes.</p>`
                }, (mailResp) => {
                    userController.psql.updateSet({
                        body: {
                            email_reminder_count: count + 1,
                            where: { id: user.id }
                        }
                    }, null, null, (resp) => {
                        //console.log('resp from updateSet email_reminder_count:', resp[0].email_reminder_count);
                    });
                });
            }
        });
    }
}
exports.EmailCron = EmailCron;
