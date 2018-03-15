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
const api_1 = require("./api");
const cluster_1 = require("./cluster");
class Normalize extends api_1.API {
    constructor(options, externalModels) {
        super(options);
        this.options = options;
        this.externalModels = externalModels;
        options.cluster = options.cluster != null ? options.cluster : false;
        if (options.cluster) {
            new cluster_1.Cluster(options, this.externalModels);
        }
        else {
            this.ready((norm) => __awaiter(this, void 0, void 0, function* () {
                if (this.externalModels) {
                    let resp = yield norm.bootstrap(this.externalModels, true);
                    resp ? norm.spawn() : norm.spawn();
                }
                else {
                    norm.spawn();
                }
            }));
        }
    }
}
exports.Normalize = Normalize;
