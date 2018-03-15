"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_manager_1 = require("./file-manager");
class CSVParser {
    constructor() {
        this.fileManager = new file_manager_1.FileManager();
    }
    toJSON(path, cb) {
        this.fileManager.readStream(path, { returnType: 'utf8' }, (csv) => {
            //console.log('file', csv);
            let lines = csv.split("\n");
            let result = [];
            let headers = lines[0].split(",");
            for (let i = 1; i < lines.length; i++) {
                let obj = {};
                let currentline = lines[i].split(",");
                for (let j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }
            //console.log('results', result);
            //return result; //JavaScript object
            cb(JSON.stringify(result)); //JSON
        });
    }
}
exports.CSVParser = CSVParser;
