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
class Author {
    constructor(norm) {
        this.model = [{
                id: { type: Number, key: 'primary' },
                author: { type: String, maxlength: 24 },
                user_id: {
                    type: Number,
                    key: 'foreign',
                    references: { table: 'User', foreignKey: 'id' },
                    onDelete: 'cascade',
                    onUpdate: 'cascade'
                },
            }, 'A table to store authors',
            [
                {
                    route: '/get-all-author',
                    method: 'POST',
                    callback: this.getALLAuthor,
                    requireToken: true,
                },
                {
                    route: '/get-author-by-id/:id',
                    method: 'POST',
                    callback: this.getAuthorById,
                    requireToken: true,
                },
                {
                    route: '/create-author',
                    method: 'POST',
                    callback: this.createAuthor,
                    requireToken: true,
                },
                {
                    route: '/update-author/id/:id',
                    method: 'PUT',
                    callback: this.updateAuthor,
                    requireToken: true,
                },
                {
                    route: '/delete-author/id/:id',
                    method: 'DELETE',
                    callback: this.deleteAuthor,
                    requireToken: true,
                }
            ]];
    }
    updateAuthor(model) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            console.log('reg.body==>', req.body);
            let authorCtrl = model.controller;
            let resp = yield authorCtrl.update(req, null, null);
            res.json({ message: 'Success', resp });
        });
    }
    deleteAuthor(model) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            console.log('reg.body==>', req.body);
            let authorCtrl = model.controller;
            let resp = yield authorCtrl.remove(req, null, null);
            console.log('resp from delete', resp);
            res.json({ message: 'Success', resp });
        });
    }
    createAuthor(model) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            console.log('reg.body==>', req.body);
            let authorCtrl = model.controller;
            let resp = yield authorCtrl.insert(req, null, null);
            res.json({ message: 'Success', resp });
        });
    }
    getALLAuthor(model) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            req.body = {
                get: ["*"]
            };
            let authorCtrl = model.controller;
            let resp = yield authorCtrl.get(req, null, null);
            res.json({ message: 'Success', resp });
        });
    }
    getAuthorById(model) {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            req.body = {
                get: ["*"],
                where: {
                    id: req.params.id
                }
            };
            let authorCtrl = model.controller;
            let resp = yield authorCtrl.get(req, null, null);
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
exports.Author = Author;
