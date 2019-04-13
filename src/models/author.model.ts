import { Request, Response, NextFunction } from 'express';
export class Author {
    _model: any;
    constructor(norm: any) {
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
        // book_id: {
          // type: Number,
          // key: 'foreign',
          // references: { table: 'Book', foreignKey: 'id' },
          // onDelete: 'null',
          // onUpdate: 'cascade'
        // },
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
updateAuthor(model: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
   console.log('reg.body==>', req.body);
    let authorCtrl = model.controller;
    let resp = await authorCtrl.update(req, null, null);
    res.json({ message: 'Success', resp });
  }
}
  deleteAuthor(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
     console.log('reg.body==>', req.body);
      let authorCtrl = model.controller;
      let resp = await authorCtrl.remove(req, null, null);
      console.log('resp from delete', resp);
      res.json({ message: 'Success', resp });
    }
}
createAuthor(model: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
   console.log('reg.body==>', req.body);
    let authorCtrl = model.controller;
    let resp = await authorCtrl.insert(req, null, null);
    res.json({ message: 'Success', resp });
  }
}

getALLAuthor(model: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    req.body = {
      get: ["*"]
    }
    let authorCtrl = model.controller;
    let resp = await authorCtrl.get(req, null, null);
    res.json({ message: 'Success', resp });
  }
}
getAuthorById(model: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    req.body = {
      
        get: ["*"],
        where: {
          id: req.params.id
        }
      }
    
    let authorCtrl = model.controller;

    let resp = await authorCtrl.get(req, null, null);

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