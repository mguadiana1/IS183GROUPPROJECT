"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require('mssql');
const pg = require('pg');
const fs = require('fs');
const asyncForEach = require('async-foreach').forEach;
const mssql_wrapper_1 = require("../wrapper/mssql.wrapper");
const encryptor_1 = require("../encryption/encryptor");
class MSSQLToPG {
    constructor(options, tables, api) {
        this.api = api;
        this.tables = tables;
        this.options = options;
        this.db = this.api.db;
        MSSQLToPG.legacyDB = new mssql_wrapper_1.MSSQLWrapper(options, null);
        MSSQLToPG.encryptor = new encryptor_1.Encryptor(process.env.BY_KEY);
    }
    ;
    run() {
        console.log('---- run() migrate ----->');
        let tables = this.tables;
        if (tables.length > 0) {
            let options = this.options;
            if (options.migrate != null) {
                if (options.migrate.dbDriver == 'mssql') {
                    const config = {
                        user: options.migrate.dbUser,
                        password: options.migrate.dbPassword,
                        server: options.migrate.dbServer,
                        database: options.migrate.dbName,
                        // options: {
                        //  encrypt: true // Use this if you're on Windows Azure
                        //}connectionTimeout: 300000,
                        requestTimeout: 300000,
                        pool: {
                            idleTimeoutMillis: 300000,
                            max: 100
                        }
                    };
                    // connect to legacy mssql databae
                    this.connect(config).then((resp) => {
                        if (resp) {
                            // if connection is established, drop table if exist then migrate
                            if (options.dbType == 'postgres') {
                                this.dropTableIfExistThenMigrate(tables, this.migrate);
                            }
                        }
                    });
                }
            }
        }
        else {
            console.log('No tables were configured to migrate!');
        }
    }
    connect(config) {
        return MSSQLToPG.legacyDB.connect(config).then((resp) => {
            //console.log('resp', resp);
            return resp;
        });
    }
    static getType(attribute, array) {
        for (let t in array) {
            if (array[t].attribute == attribute) {
                return array[t].type;
            }
        }
    }
    static convertToUTCDate(date) {
        let dateInput = date || null;
        let dateOutput;
        if (dateInput != null) {
            dateOutput = dateInput.slice(0, dateInput.indexOf('T'));
        }
        return dateOutput;
    }
    static sanitize(string) {
        let sanitizedStr = string.toString().replace(/(^\s+|\s+$)/g, '').trim();
        if (sanitizedStr.includes("'")) {
            sanitizedStr = sanitizedStr.replace(/'/g, "''"); // escape aphotrophe by doubling it
        }
        if (sanitizedStr.length >= 254) {
            sanitizedStr = sanitizedStr.slice(0, 250) + '...';
        }
        return sanitizedStr;
    }
    static prepareCreate(row) {
        let str = ``;
        let columnName = row['COLUMN_NAME'], encrypt = process.env.ENABLE_DB_ENCRYPTION || false, octetLength = encrypt ? 1024 : row['CHAR_OCTET_LENGTH'], // hope 1024 is enough...
        precision = encrypt ? 1024 : row['PRECISION']; // hope 1024 is enough...
        switch (row['TYPE_NAME']) {
            case 'int':
                return str = `"${columnName}" integer`;
            case 'bit':
            case 'boolean':// boolean
                return str = `"${columnName}" boolean default false`;
            case 'char':
                return str = `"${columnName}" varchar(${octetLength != null ?
                    octetLength : precision})`;
            case 'text':
            case 'image':
                return str = `"${columnName}" text`;
            case 'date':
            case 'datetime2':
            case 'datetime':
            case 'smalldatetime':
                return str = `"${columnName}" timestamp`;
            case 'uniqueidentifier':
                return str = `"${columnName}" varchar(${octetLength != null ?
                    octetLength : precision})`;
            default:
                return str = `"${columnName}" varchar(${octetLength != null ?
                    octetLength : precision})`;
        }
    }
    static encrypt(prop, value, secretFields) {
        const encrypt = process.env.ENABLE_DB_ENCRYPTION || false;
        if (secretFields && secretFields.indexOf(prop) != -1 && encrypt) {
            return MSSQLToPG.encryptor.encrypt(value);
        }
        else {
            return value;
        }
    }
    migrate(table) {
        // let i = 0;
        // return new Promise((resolve) => {
        //asyncForEach(tables, function (item: any, i: any, array: any) {
        //console.log('i', i);
        let legacyTable = table.table.slice(1, table.table.length), // strip out the '_'
        newTable = table.table, secretFields = table.secretFields != null ? table.secretFields : false;
        // done = this.async(); // table name with the '_'
        // get the columns specifications for the table from the legacy models
        MSSQLToPG.legacyDB.query(`exec sp_columns ${legacyTable}`, (err, resp) => {
            let attr = '', schema = [];
            let createTableAttr = '';
            // build out the attributes
            for (let i in resp) {
                schema.push({ attribute: resp[i].COLUMN_NAME, type: resp[i].TYPE_NAME });
                attr += `"${resp[i].COLUMN_NAME}" ` + ', ';
                createTableAttr += `${MSSQLToPG.prepareCreate(resp[i])}` + ', ';
            }
            // add createdAt and updatedAt and deletedAt to the attr list
            attr += `"created_at", "updated_at", "deleted_at"`;
            createTableAttr += `"created_at" timestamp, "updated_at" timestamp, "deleted_at" timestamp`;
            let createQuery = `create table "${newTable}" (${createTableAttr})`;
            //console.log('createQuery', createQuery);
            this.api.db.query(createQuery, null, (err, table) => {
                if (table) {
                    console.log('resp', table);
                    // get all the records for the table in the old database
                    MSSQLToPG.legacyDB.query(`SELECT * FROM "${legacyTable}" order by ${resp[0].COLUMN_NAME}`, (err, rows) => {
                        let count = rows.lenght;
                        if (err) {
                            console.log('err from legacyDB select', err);
                            //done();
                        }
                        else {
                            // foreach record, build out the values to be inserted
                            asyncForEach(rows, function (row, k, arr) {
                                let values = '', done = this.async();
                                for (let l in row) {
                                    //console.log(getType(l, schema));
                                    let type = MSSQLToPG.getType(l, schema), value = (row[l] != null || row[l] != '') ? row[l] : null;
                                    //console.log('value', value, 'type', type);
                                    switch (type) {
                                        case 'int':
                                        case 'int identity':
                                            values += (value != null) ?
                                                MSSQLToPG.encrypt(l, parseInt(value), secretFields) + ', ' : null + ', ';
                                            break;
                                        case 'decimal':
                                            values += (value != null) ?
                                                MSSQLToPG.encrypt(l, parseFloat(value), secretFields) + ', ' : null + ', ';
                                            break;
                                        case 'image':
                                            // value is already a Buffer object (binary)
                                            values += (value != null) ? "'" +
                                                MSSQLToPG.encrypt(l, value.toString('base64'), secretFields) + "'" + ', ' : null + ', ';
                                            break;
                                        case 'bit':
                                        case 'char':
                                        case 'text':
                                        case 'varchar':
                                        case 'uniqueidentifier':
                                        case 'nchar':
                                            values += (value != null) ? "'" +
                                                MSSQLToPG.encrypt(l, MSSQLToPG.sanitize(value), secretFields) + "'" + ', ' : null + ', ';
                                            break;
                                        case 'date':
                                        case 'datetime2':
                                        case 'datetime':
                                        case 'smalldatetime':
                                            values += (value != null) ? "'" +
                                                MSSQLToPG.encrypt(l, MSSQLToPG.convertToUTCDate(value.toISOString()), secretFields) + "'" + ', ' : null + ', ';
                                            break;
                                        default:
                                            values += (value != null) ? "'" +
                                                MSSQLToPG.encrypt(l, MSSQLToPG.sanitize(value), secretFields) + "'" + ', ' : null + ', ';
                                            break;
                                    }
                                }
                                // add createdAt, updatedAt and deletedAt
                                values += "'" + MSSQLToPG.convertToUTCDate(new Date().toISOString()) + "'" + ', ';
                                values += "'" + MSSQLToPG.convertToUTCDate(new Date().toISOString()) + "'" + ', ';
                                values += null;
                                // insert attributes and their values into the table for each row
                                let query = `INSERT INTO "${newTable}" (${attr}) values(${values})`;
                                console.log('insert query', query);
                                console.log('------------------- end -------------------> \n');
                                this.api.db.query(query, null, (err, resp) => {
                                    if (resp) {
                                        console.log(`------------------- resp -------------------> \n`, resp, ' k: ', k);
                                    }
                                    else {
                                        console.log(`------------------- err -------------------> \n`, err, ' k: ', k);
                                    }
                                    done();
                                });
                            });
                        }
                    });
                }
                else {
                    console.log('err', err);
                }
            });
            // end create the table
        });
    }
    dropTableIfExistThenMigrate(tables, migrate) {
        asyncForEach(tables, function (table, i, array) {
            let tableName = table['table'], query = `DROP TABLE IF EXISTS "${tableName}"`, done = this.async();
            console.log(query);
            this.api.db.query(query, null, (err, resp) => {
                if (err) {
                    console.log('dropTableIfExist err', err);
                    done();
                }
                else {
                    //console.log('resp from dropTableIfExist err: ', err)
                    //console.log('resp from dropTableIfExist resp: ', resp);
                    console.log(`---- i, ${i}, Table ${tableName} deleted if exist. migration has started ---------->`);
                    //setTimeout(() => {
                    migrate(table);
                    done();
                    //}, 2000);
                }
            });
        });
    }
}
exports.MSSQLToPG = MSSQLToPG;
