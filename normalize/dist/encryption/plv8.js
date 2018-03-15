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
const file_manager_1 = require("../file-manager/file-manager");
const cluster = require('cluster');
class PLV8 {
    constructor(pg, dbName) {
        this.pg = pg;
        this.dbName = dbName;
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                yield this.createV8Extension();
                yield this.PLV8Init(this.dbName);
                resolve(true);
            }));
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                yield this.setup();
                resolve(this);
            }));
        });
    }
    createV8Extension() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                let exists = yield this.existCheck('pg_extension', 'extname', 'plv8');
                if (!exists) {
                    const query = `create extension plv8;`;
                    this.pg.query(query, (err, resp) => {
                        if (err) {
                            resolve(err);
                        }
                        else {
                            resolve(resp);
                        }
                    });
                }
                else {
                    resolve({});
                }
            }));
        });
    }
    setStartProcess(process, dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                const query = `ALTER DATABASE "${dbName}" SET plv8.start_proc = '${process}';`;
                this.pg.query(query, (err, resp) => {
                    if (err) {
                        resolve(err);
                    }
                    else {
                        resolve(resp);
                    }
                });
            });
        });
    }
    fetchCode(path) {
        const fileManager = new file_manager_1.FileManager();
        return new Promise((resolve) => {
            fileManager.readStream(path, { returnType: 'utf8' }, (data) => {
                resolve(data);
            });
        });
    }
    PLV8Init(dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                yield this.setStartProcess('plv8_init', dbName); // must set process first then create process
                const exists = yield this.existCheck('pg_proc', 'proname', 'plv8_init');
                if (!exists) {
                    let resp = yield this.create(`create or replace function plv8_init()
                  returns void as $$
                      cache = {};

                      load = function(key, source) {
                          var module = {exports: {}};
                          eval("(function(module, exports) {" + source + "; })")(module, module.exports);
                        
                          // store in cache
                          cache[key] = module.exports;
                          return module.exports;
                      };

                      require = function(module) {
                          if(cache[module])
                              return cache[module];

                          var rows = plv8.execute(
                              'select source from "PLV8Module" where module = $1', [module]
                          );

                          if(rows.length === 0) {
                              plv8.elog(NOTICE, 'cannot load module: ' + module);
                              return null;
                          }

                          return load(module, rows[0].source);
                      };
                    
                      var query = 'select module, source from "PLV8Module" where autoload = true';
                      plv8.execute(query).forEach(function(row) {
                          load(row.module, row.source);
                      });
                  $$ language plv8;`);
                    if (resp) {
                        resolve(resp);
                    }
                }
                else {
                    resolve({});
                }
            }));
        });
    }
    create(createQuery) {
        return new Promise((resolve, reject) => {
            this.pg.query(createQuery, (err, resp) => {
                if (err) {
                    resolve(err);
                }
                else {
                    resolve(resp);
                }
            });
        });
    }
    existCheck(table, key, value) {
        return new Promise((resolve) => {
            let check = `select * from "${table}" where "${key}" = '${value}';`;
            this.pg.query(check, (err, resp) => {
                if (err) {
                    resolve(err);
                }
                else {
                    const exists = resp && resp.rows.length > 0;
                    resolve(exists);
                }
            });
        });
    }
    insertModule(moduleName, autoload, code) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                let createQuery = `insert into "PLV8Module" (module, autoload, source, created_by, updated_by) values ('${moduleName}', ${autoload}, '${code}', 'SYS', 'SYS');`;
                this.pg.query(createQuery, (err, resp) => {
                    if (err) {
                        resolve(err);
                    }
                    else {
                        resolve(resp);
                    }
                });
            });
        });
    }
}
exports.PLV8 = PLV8;
