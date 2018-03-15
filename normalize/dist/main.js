"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_1 = require("./normalize");
new normalize_1.Normalize({
    cluster: true,
    seedDir: '/seed',
    port: process.env.PORT || 3000,
    routePrefix: `/api/v1`,
    environment: process.env.NODE_ENV || 'development',
    dbType: 'postgres',
    dbName: process.env.DB_NAME,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASS,
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT,
    connectionString: process.env.DB_CONN,
    migrate: {
        dbDriver: 'mssql',
        dbName: process.env.MIGRATE_DB_NAME,
        dbUser: process.env.MIGRATE_USER,
        dbPassword: process.env.MIGRATE_PASS,
        dbServer: process.env.MIGRATE_SERVER
    }
}, {});
