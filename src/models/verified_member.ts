import { Request, Response, NextFunction } from 'express';
export class Verified_member {
    _model: any;
    constructor(norm: any) {
        this.model = [{
            id: { type: Number, key: 'primary' },
            member_status: { type: Boolean, maxlength: 1 },
            user_id: {
                type: Number,
                key: 'foreign',
                references: { table: 'User', foreignKey: 'id' },
                onDelete: 'cascade',
                onUpdate: 'cascade'
            },

            student_id: {
                type: Number,
                key: 'foreign',
                references: { table: 'student_member', foreignKey: 'id' },
                onDelete: 'cascade',
                onUpdate: 'cascade'
            },
        }, 'A table to store student info',
        [
            {
                route: '/get-all-verified_member',
                method: 'POST',
                callback: this.getALLVerified_member,
                requireToken: true,
            },
            {
                route: '/get-verified_member-by-id/:id',
                method: 'POST',
                callback: this.getVerified_memberById,
                requireToken: true,
            },
            {
                route: '/create-verified_member',
                method: 'POST',
                callback: this.createVerified_member,
                requireToken: true,
            },
            {
                route: '/update-verified_member/id/:id',
                method: 'PUT',
                callback: this.updateVerified_member,
                requireToken: true,
            },
            {
                route: '/delete-verified_member/id/:id',
                method: 'DELETE',
                callback: this.deleteVerified_member,
                requireToken: true,
            }

        ]];
    }
    updateVerified_member(model: any) {
        return async (req: Request, res: Response, next: NextFunction) => {
            console.log('reg.body==>', req.body);
            let Verified_memberCtrl = model.controller;
            let resp = await Verified_memberCtrl.update(req, null, null);
            res.json({ message: 'Success', resp });
        }
    }
    deleteVerified_member(model: any) {
        return async (req: Request, res: Response, next: NextFunction) => {
            console.log('reg.body==>', req.body);
            let Verified_memberCtrl = model.controller;
            let resp = await Verified_memberCtrl.remove(req, null, null);
            console.log('resp from delete', resp);
            res.json({ message: 'Success', resp });
        }
    }
    createVerified_member(model: any) {
        return async (req: Request, res: Response, next: NextFunction) => {
            console.log('reg.body==>', req.body);
            let Verified_memberCtrl = model.controller;
            let resp = await Verified_memberCtrl.insert(req, null, null);
            res.json({ message: 'Success', resp });
        }
    }

    getALLVerified_member(model: any) {
        return async (req: Request, res: Response, next: NextFunction) => {
            req.body = {
                get: ["*"]
            }
            let Verified_memberCtrl = model.controller;
            let resp = await Verified_memberCtrl.get(req, null, null);
            res.json({ message: 'Success', resp });
        }
    }
    getVerified_memberById(model: any) {
        return async (req: Request, res: Response, next: NextFunction) => {
            req.body = {

                get: ["*"],
                where: {
                    id: req.params.id
                }
            }

            let Verified_memberCtrl = model.controller;

            let resp = await Verified_memberCtrl.get(req, null, null);

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