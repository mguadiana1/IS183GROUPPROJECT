"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cron = require('node-cron');
class Cron {
    constructor() { }
    schedule(when, task, options) {
        let pattern = '';
        switch (when) {
            case 'every second':
                pattern = '* * * * * *';
                break;
            case 'every 5 second':
                pattern = '*/5 * * * * *';
                break;
            case 'every minute':
                pattern = '* * * * *';
                break;
            case 'every hour':
                pattern = '0 */59 * * * *';
                break;
            case 'every 55 min':
                pattern = '0 */55 * * * *';
                break;
            case 'every other hour':
                pattern = '0 0 */2 * * *';
                break;
            case 'every day at 3am':
                pattern = '1 1 3 * * *';
                break;
            case 'every day at 6am':
                pattern = '1 1 6 * * *';
                break;
            case 'every day at midnight':
                pattern = '0 0 0 * * *';
                break;
            case 'every 15 days at midnight':
                pattern = '0 0 0 15 * *';
                break;
            case 'every 7 days at midnight':
                pattern = '0 0 0 7 * *';
                break;
            default:
                pattern = '0 0 0 * * *';
                break;
        }
        return cron.schedule(pattern, () => {
            options && options.log ? console.log(`Running a task ${when}`) : '';
            task();
        }, options && options.start ? options.start : false);
    }
}
exports.Cron = Cron;
