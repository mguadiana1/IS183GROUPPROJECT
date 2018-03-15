"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const xlsx = require('node-xlsx').default;
class FileManager {
    constructor() {
    }
    createTmpFile(data, dataType, prefix) {
        // let file = tmp.tmpNameSync({ postfix: '.jpeg' });
        //fs.writeFileSync(file, data, 'base64');
        let file = tmp.tmpNameSync({ postfix: prefix });
        fs.writeFileSync(file, data, dataType);
        return file;
    }
    readStream(file, options, cb) {
        let readStream = fs.createReadStream(file, { encoding: '', highWaterMark: options.chunkSize });
        let data = '';
        let chunksArray = [];
        let buffer = new Buffer('');
        readStream
            .on('error', (err) => {
            console.log('err', err);
        })
            .on('data', (chunk) => {
            //console.log('daa...');
            data += chunk;
            chunksArray.push(chunk);
        })
            .on('end', () => {
            //console.log('data: ========>', data);
            let fullBuffer;
            chunksArray.forEach((item, i, arr) => {
                //console.log(arr[i]);
                if (i > 0) {
                    //console.log('i', i, '[arr[i - 1]', [arr[i - 1]]);
                    fullBuffer = Buffer.concat([arr[i - 1], item]);
                    arr[i] = fullBuffer;
                }
                else {
                    fullBuffer = item;
                }
            });
            // console.log('bufferFull', fullBuffer);
            //console.log(fullBuffer.toString('base64'));
            switch (options.returnType) {
                case 'base64':
                    cb(fullBuffer != null ? fullBuffer.toString('base64') : '');
                    break;
                case 'buffer':
                    cb(fullBuffer != null ? fullBuffer : '');
                    break;
                case 'arrayOfBuffer':
                    cb(chunksArray);
                    break;
                case 'utf8':
                    cb(data);
                    break;
                default:
                    cb(data.toString('base64'));
                    break;
            }
        });
    }
    readDir(folder, cb) {
        fs.readdir(folder, (err, datafiles) => {
            //console.log('path.resolve folder', path.resolve(folder));
            if (!err) {
                //console.log('dataFiles', datafiles);
            }
            else {
                console.log('readDir err', err);
            }
            cb(err, datafiles);
        });
    }
    readFile(filePath, encoding, cb) {
        //console.log('path.resolve', path.resolve(filePath));
        fs.readFile(filePath, encoding, (err, data) => {
            if (err) {
                console.log('readFile err', err);
            }
            cb(err, data);
        });
    }
    readFileSync(filePath, encoding, options) {
        let content;
        if (options && options['toJSON'] == true) {
            content = JSON.parse(fs.readFileSync(filePath, encoding));
        }
        else {
            content = fs.readFileSync(filePath, encoding);
        }
        return content;
    }
    deleteFile(filePath, options) {
        if (options['async']) {
            return new Promise((resolve) => {
                fs.unlink(filePath, (err) => {
                    if (!err) {
                        resolve(true);
                    }
                    resolve(false);
                });
            });
        }
        else {
            return fs.unlink(filePath);
        }
    }
    base64Encode(file) {
        const bitmap = fs.readFileSync(file);
        return new Buffer(bitmap).toString('base64');
    }
    base64Decode(base64str, file) {
        const bitmap = Buffer.from(base64str, 'base64');
        fs.writeFileSync(file, bitmap);
    }
    base64ToBufferToJson(base64) {
        const buffer = Buffer.from(base64, 'base64');
        const json = xlsx.parse(buffer);
        // console.log('from filemanager json', json);
        return json;
    }
    isFileExist(fullFilePath) {
        return fs.existsSync(fullFilePath);
    }
    getFileStats(fileName) {
        return fs.statSync(fileName);
    }
    test(dir) {
    }
}
exports.FileManager = FileManager;
