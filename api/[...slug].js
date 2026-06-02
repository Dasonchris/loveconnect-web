const serverless = require('serverless-http');
const { app, connectDB } = require('../server/app');

let dbConnection = null;

const ensureDbConnection = async () => {
  if (!dbConnection) {
    dbConnection = connectDB();
  }
  return dbConnection;
};

const handler = serverless(app);

module.exports = async (req, res) => {
  await ensureDbConnection();
  return handler(req, res);
};
