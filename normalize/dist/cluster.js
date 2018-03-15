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
//import express = require('express');
const api_1 = require("./api");
const cluster = require('cluster');
const os = require('os');
const appMode = true;
class Cluster {
    constructor(options, models) {
        this.options = options;
        this.models = models;
        this._workers = [];
        this.masterHasExited = false;
        this.numCPUs = os.cpus().length || 1;
        this.init(cluster, options);
    }
    ;
    init(cluster, options) {
        if (cluster.isMaster) {
            console.log(`Master pid: ${process.pid} is online!`);
            this.fork(this.numCPUs);
            this.logActivities(cluster);
            this.regenerate(cluster);
            this.setOnExitListener(cluster, process);
        }
        else {
            this.setupMaster(cluster, options);
        }
    }
    get workers() {
        return this._workers;
    }
    get master() {
        return this._master;
    }
    fork(numCPUs) {
        for (let i = 0; i < numCPUs; i++) {
            let config = {
                role: i == 0 ? 'data_broker' : i == 1 ? 'interval_worker' : 'http_responder',
                debug: appMode
            };
            this._workers.push({ role: config.role, cluster: cluster.fork(config) });
        }
    }
    setupMaster(cluster, options) {
        // if(cluster.setupMaster)  cluster.setupMaster({ exec: __dirname + '/main.js' });
        this._master = new api_1.API(options);
        this._master.ready((norm) => __awaiter(this, void 0, void 0, function* () {
            const resp = yield norm.bootstrap(this.models != null ? this.models : {}, true);
            resp ? norm.spawn() : norm.spawn();
        }));
    }
    logActivities(cluster) {
        Object.keys(cluster.workers).forEach((id) => {
            // receive messages from master
            cluster.workers[id].on('message', (msg, connection) => {
                if (msg.cmd && msg.cmd == 'notifyRequest') {
                }
                if (msg.cmd && msg.cmd == 'shutdown') {
                    console.log('Received shutdown instructions from master!');
                    // process.exit(0);
                }
                console.log("Getting message from process : ", msg.procId);
            });
            //Getting worker online
            cluster.workers[id].on('online', () => {
                console.log("Worker pid: " + cluster.workers[id].process.pid + " is online!");
            });
            //printing the listening port
            cluster.workers[id].on('listening', (worker) => {
            });
        });
    }
    regenerate(cluster) {
        cluster.on("exit", (worker, code, signal) => {
            this._workers.forEach((slave, i, a) => {
                if (slave.cluster.process.pid === worker.process.pid) {
                    // revive the worker with the same role
                    console.log(slave.cluster.process.pid + ' destroyed!');
                    this._workers.splice(i, 1);
                    let config = {
                        role: slave.role,
                        debug: appMode
                    };
                    !this.masterHasExited ? this._workers.push({ role: slave.role, cluster: cluster.fork(config) }) : false;
                }
            });
        });
    }
    setOnExitListener(cluster, process) {
        process.on('SIGINT', () => {
            //console.log("exiting " + process.pid);
            this._workers.forEach((worker, i, a) => {
                console.log("destroying " + worker.cluster.process.pid);
                this._workers[i].cluster.kill('SIGKILL');
            });
            this.masterHasExited = true;
            process.exit();
        });
        cluster.on('listening', (worker, address) => {
            //console.log(`Worker pid: ${worker.process.pid} listening on port: ${address.port}.`);
        });
    }
}
exports.Cluster = Cluster;
