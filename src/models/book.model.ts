import { Request, Response, NextFunction } from 'express';
import { isDate } from 'util';
export class Book {
  _model: any;
  constructor(norm: any) {
    this.model = [{
      id: { type: Number, key: 'primary' },
      title: { type: String, maxlength: 100 },
      price: { type: String, maxlength: 24 },
      isbn: { type: String, maxlength: 24 },
      edition:{type: String, maxlength: 24},
      description:{type: String, maxlength: 1000},
      category: {type: String, maxlength:24},
      condition: {type: String, maxlength:24},
      cover: { type: String, maxlength: 1000 },
      created_date: {type: new Date()},
      
     
      
      user_id: {
        type: Number,
        key: 'foreign',
        references: { table: 'User', foreignKey: 'id' },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      },
      author_id: {
        type: Number,
        key: 'foreign',
        references: { table: 'Author', foreignKey: 'id' },
        onDelete: 'set null',
        onUpdate: 'cascade'
      },
      publisher_id: {
        type: Number,
        key: 'foreign',
        references: { table: 'Publisher', foreignKey: 'id' },
        onDelete: 'set null',
        onUpdate: 'cascade'
      },
    }, 'A table to store book info',
    [
      {
        route: '/get-all-books',
        method: 'POST',
        callback: this.getALLBooks,
        requireToken: true,
      },
      {
        route: '/get-book-by-id/:id',
        method: 'POST',
        callback: this.getBookById,
        requireToken: true,
      },
      {
        route: '/create-book',
        method: 'POST',
        callback: this.createBook,
        requireToken: true,
      },
      {
        route: '/update-book/id/:id',
        method: 'PUT',
        callback: this.updateBook,
        requireToken: true,
      },
      {
        route: '/delete/id/:id',
        method: 'DELETE',
        callback: this.deleteBook,
        requireToken: true,
      }
    
    ]];
  }
  updateBook(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
     console.log('reg.body==>', req.body);
      let bookCtrl = model.controller;
      let resp = await bookCtrl.update(req, null, null);
      res.json({ message: 'Success', resp });
    }
  }
    deleteBook(model: any) {
      return async (req: Request, res: Response, next: NextFunction) => {
       console.log('reg.body==>', req.body);
        let bookCtrl = model.controller;
        let resp = await bookCtrl.remove(req, null, null);
        console.log('resp from delete', resp);
        res.json({ message: 'Success', resp });
      }
  }
  createBook(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
     console.log('reg.body==>', req.body);
      let bookCtrl = model.controller;
      let resp = await bookCtrl.insert(req, null, null);
      res.json({ message: 'Success', resp });
    }
  }
  
  getALLBooks(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
      req.body = {
        get: ["*"]
      }
      let bookCtrl = model.controller;
      let resp = await bookCtrl.get(req, null, null);
      res.json({ message: 'Success', resp });
    }
  }
  getBookById(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
      req.body = {
        
          get: ["*"],
          where: {
            id: req.params.id
          }
        }
      
      let bookCtrl = model.controller;

      let resp = await bookCtrl.get(req, null, null);

      res.json({ message: 'Success', resp });
    }
  }
  set model(model: any) {
    this._model = model;
  }

  get model() {
    return this._model;
  }

}