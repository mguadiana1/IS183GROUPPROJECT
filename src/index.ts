const envFile = require('../.env');
const dotEnv = require('dotenv').load(envFile);
const Normalize = require('../normalize/dist/normalize').Normalize;
const models = require('./models');

const n = new Normalize({
  port: process.env.PORT,
  cluster: true,
  seedDir: '/seed',
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
}, models); // import the entire models directory

n.ready(async (norm: any) => {

  const mKeys = Object.keys(models) || [];
  const promises = mKeys && mKeys.length > 0 ? mKeys.map((key: any, index: number) => {
    const m = new models[key](norm);
    const params = [...m.model];
    // import a single model
    return norm.importModel(key, params[0], params[1] != null ? params[1] : 'N/A', params[2] != null && params[2].length > 0 ? params[2] : []);
  }) : [];
  const resps = promises.length > 0 ? await Promise.all(promises) : false;
  //resps ? norm.spawn() : norm.spawn(); // NO NEED TO SPIN SERVER, DID IT IN NORMALIZE

});
