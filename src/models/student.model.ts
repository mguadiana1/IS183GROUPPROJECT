import { Request, Response, NextFunction } from 'express';
export class Student {
  _model: any;
  constructor(norm: any) {
    this.model = [{
      id: { type: Number, key: 'primary' },
      Student_First_Name: { type: String, maxlength: 24 },
     Student_Last_Name: { type: String, maxlength: 24 },
      State: { type: String, maxlength: 24 },
      City: { type: String, maxlength: 24 },
      University: { type: String, maxlength: 24 },
      EMail: { type: String, maxlength: 24 },
      Password: { type: String, maxlength: 24 },
      
      user_id: {
        type: Number,
        key: 'foreign',
        references: { table: 'User', foreignKey: 'id' },
        onDelete: 'cascade',
        onUpdate: 'cascade'
      },
    }, 'A table to store student info',
    [
      {
        route: '/get-all-students',
        method: 'POST',
        callback: this.getALLStudent,
        requireToken: true,
      },
      {
        route: '/get-student-by-id/:id',
        method: 'POST',
        callback: this.getStudentById,
        requireToken: true,
      },
      {
        route: '/create-student',
        method: 'POST',
        callback: this.createStudent,
        requireToken: true,
      },
      {
        route: '/update-student/id/:id',
        method: 'PUT',
        callback: this.updateStudent,
        requireToken: true,
      },
      {
        route: '/delete/id/:id',
        method: 'DELETE',
        callback: this.deleteStudent,
        requireToken: true,
      }
    
    ]];
  }
  updateStudent(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
     console.log('reg.body==>', req.body);
      let studentCtrl = model.controller;
      let resp = await studentCtrl.update(req, null, null);
      res.json({ message: 'Success', resp });
    }
  }
    deleteStudent(model: any) {
      return async (req: Request, res: Response, next: NextFunction) => {
       console.log('reg.body==>', req.body);
        let studentCtrl = model.controller;
        let resp = await studentCtrl.remove(req, null, null);
        console.log('resp from delete', resp);
        res.json({ message: 'Success', resp });
      }
  }
  createStudent(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
     console.log('reg.body==>', req.body);
      let studentCtrl = model.controller;
      let resp = await studentCtrl.insert(req, null, null);
      res.json({ message: 'Success', resp });
    }
  }
  
  getALLStudent(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
      req.body = {
        get: ["*"]
      }
      let studentCtrl = model.controller;
      let resp = await studentCtrl.get(req, null, null);
      res.json({ message: 'Success', resp });
    }
  }
  getStudentById(model: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
      req.body = {
        
          get: ["*"],
          where: {
            id: req.params.id
          }
        }
      
      let studentCtrl = model.controller;

      let resp = await studentCtrl.get(req, null, null);

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