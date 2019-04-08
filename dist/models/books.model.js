"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class books {
    constructor(norm) {
        this.model = [{
                id: { type: Number, key: 'primary' },
                book_name: { type: String, maxlength: 24 },
                user_id: {
                    type: Number,
                    key: 'foreign',
                    references: { table: 'User', foreignKey: 'id' },
                    onDelete: 'cascade',
                    onUpdate: 'cascade'
                },
            }, 'A table to store exam model', []];
    }
    set model(model) {
        this._model = model;
    }
    get model() {
        return this._model;
    }
}
exports.books = books;
