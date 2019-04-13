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
class Publisher {
    constructor(norm) {
        this.model = [{
                id: { type: Number, key: 'primary' },
                publisher: { type: String, maxlength: 24 },
                country: { type: String, maxlength: 24 },
                user_id: {
                    type: Number,
                    key: 'foreign',
                    references: { table: 'User', foreignKey: 'id' },
                    onDelete: 'cascade',
                    onUpdate: 'cascade'
                },
            }, 'A table to store book info',
            [
                {
                    route: '/get-all-publisher',
                    method: 'POST',
                    callback: this.getALLPublisher,
                    requireToken: true,
                },
                {
                    route: '/get-publisher-by-id/:id',
                    method: 'POST',
                    callback: this.getPublisherById,
                    requireToken: true,
                },
                {
                    route: '/create-publisher',
                    method: 'POST',
                    callback: this.createPublisher,
                    requireToken: true,
                },
                {
                    route: '/update-publisher/id/:id',
                    method: 'PUT',
                    callback: this.updatePublisher,
                    requireToken: true,
                },
                {
                    route: '/delete-publisher/id/:id',
                    method: 'DELETE',
                    callback: this.deletePublisher,
                    requireToken: true,
                }
            ]];
    }
    updatePublisher(model) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            console.log('reg.body==>', req.body);
            let publisherCtrl = model.controller;
            let resp = yield publisherCtrl.update(req, null, null);
            res.json({ message: 'Success', resp });
        });
    }
    deletePublisher(model) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            console.log('reg.body==>', req.body);
            let publisherCtrl = model.controller;
            let resp = yield publisherCtrl.remove(req, null, null);
            console.log('resp from delete', resp);
            res.json({ message: 'Success', resp });
        });
    }
    createPublisher(model) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            console.log('reg.body==>', req.body);
            let publisherCtrl = model.controller;
            let resp = yield publisherCtrl.insert(req, null, null);
            res.json({ message: 'Success', resp });
        });
    }
    getALLPublisher(model) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            req.body = {
                get: ["*"]
            };
            let publisherCtrl = model.controller;
            let resp = yield publisherCtrl.get(req, null, null);
            res.json({ message: 'Success', resp });
        });
    }
    getPublisherById(model) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            req.body = {
                get: ["*"],
                where: {
                    id: req.params.id
                }
            };
            let publisherCtrl = model.controller;
            let resp = yield publisherCtrl.get(req, null, null);
            res.json({ message: 'Success', resp });
        });
    }
    set model(model) {
        this._model = model;
    }
    get model() {
        return this._model;
    }
}
exports.Publisher = Publisher;
