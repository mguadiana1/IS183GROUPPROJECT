import { Request, Response, NextFunction } from 'express';
export class Publisher {
  _model: any;
  constructor(norm: any) {
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
      // book_id: {
        // type: Number,
        // key: 'foreign',
        // references: { table: 'Book', foreignKey: 'id' },
        // onDelete: 'null',
        // onUpdate: 'cascade'
      // },
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
        route: '/delete/id/:id',
        method: 'DELETE',
        callback: this.deletePublisher,
        requireToken: true,
      }
    
    ]];
  }
  updatePublisher(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
     console.log('reg.body==>', req.body);
      let publisherCtrl = model.controller;
      let resp = await publisherCtrl.update(req, null, null);
      res.json({ message: 'Success', resp });
    }
  }
    deletePublisher(model: any) {
      return async (req: Request, res: Response, next: NextFunction) => {
       console.log('reg.body==>', req.body);
        let publisherCtrl = model.controller;
        let resp = await publisherCtrl.remove(req, null, null);
        console.log('resp from delete', resp);
        res.json({ message: 'Success', resp });
      }
  }
  createPublisher(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
     console.log('reg.body==>', req.body);
      let publisherCtrl = model.controller;
      let resp = await publisherCtrl.insert(req, null, null);
      res.json({ message: 'Success', resp });
    }
  }
  
  getALLPublisher(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
      req.body = {
        get: ["*"]
      }
      let publisherCtrl = model.controller;
      let resp = await publisherCtrl.get(req, null, null);
      res.json({ message: 'Success', resp });
    }
  }
  getPublisherById(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
      req.body = {
        
          get: ["*"],
          where: {
            id: req.params.id
          }
        }
      
      let publisherCtrl = model.controller;

      let resp = await publisherCtrl.get(req, null, null);

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