"use strict";
/*
 The base router that all other router extends from
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
class BaseRouter {
    constructor(controller) {
        this.controller = controller;
        this.router = express_1.Router();
    }
    make() {
        this.router.use('/', this.controller.requestInterceptor);
        this.router.use('/id/:id', this.controller.findByIdInterceptor);
        this.router.route('/')
            .get(this.controller.getAll)
            .post(this.controller.insert);
        this.router.route('/id/:id')
            .get(this.controller.findById)
            .put(this.controller.update)
            .delete(this.controller.remove);
        this.router.route('/get')
            .post(this.controller.get);
        this.router.route('/update')
            .post(this.controller.updateSet);
        this.router.route('/remove')
            .post(this.controller.removeWhere);
        this.router.route('/bulk-insert')
            .post(this.controller.bulkInsert);
        this.router.route('/subscribe')
            .post(this.controller.subscribe);
        this.router.route('/unsubscribe')
            .post(this.controller.unsubscribe);
        this.router.route('/get-total-count')
            .get(this.controller.getTotalCount);
        this.router.route('/csv-export')
            .post(this.controller.csvExport);
        this.router.route('/list-all-table')
            .post(this.controller.listAllTables);
        this.router.route('/list-all-props')
            .post(this.controller.listAllProps);
        return this.router;
    }
    extend(endpoint, method, cb, requireToken) {
        const whitelist = [
            '/login',
            '/create-secure',
            '/recover-password',
            '/forgot-password',
            '/is-loggedin',
        ];
        let middleware = [];
        if (!requireToken) {
            ///
        }
        else {
            // if (whitelist.indexOf(endpoint) == -1 || requireToken != null && (requireToken === undefined || requireToken === true)) {
            if (whitelist.indexOf(endpoint) == -1 || requireToken != null && (requireToken === true)) {
                middleware.push(this.controller.requestInterceptor);
            }
        }
        if (endpoint.includes('/id/:id')) {
            middleware.push(this.controller.findByIdInterceptor);
        }
        middleware.push(cb);
        this.router.route(endpoint)[method.toLowerCase()](middleware);
        return this;
    }
}
exports.BaseRouter = BaseRouter;
