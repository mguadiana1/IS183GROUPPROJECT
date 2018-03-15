"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require('nodemailer');
const cluster = require('cluster');
//const ses = require('nodemailer-ses-transport'); // use with AWS environment
class Emailer {
    constructor(config) {
        this.createTransport(config);
    }
    createTransport(config) {
        const configOptions = config || {
            pool: true,
            host: process.env.MAILER_HOST,
            port: process.env.MAILER_PORT,
            secure: true,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: process.env.MAILER_USER,
                pass: process.env.MAILER_PASS
            }
        };
        //console.log('configOptions', configOptions);
        this.transporter = nodemailer.createTransport(configOptions);
    }
    send(mailReq, cb) {
        // if (cluster.worker.process.env.role == 'data_broker') {
        const mailOptions = {
            from: mailReq.from,
            to: Array.isArray(mailReq.to) && mailReq.to.length > 0 ? mailReq.to.join(', ') : mailReq.to,
            subject: mailReq.subject,
            html: mailReq.html // email body
        };
        //console.log('email payload from send()', mailOptions);
        // send mail with defined transport object
        return this.transporter.sendMail(mailOptions)
            .then((resp) => {
            cb ? cb(resp) : false;
            return resp;
        }).catch(this.handleError);
        // }
    }
    ;
    handleError(err) {
        return err;
    }
    test(mailReq) {
        const request = mailReq || {
            from: process.env.TEST_EMAIL,
            to: process.env.TEST_EMAIL,
            subject: 'This is a Test',
            html: `<div><p>This is a Test</p></div>` // email body
        };
        this.send(request);
    }
}
exports.Emailer = Emailer;
