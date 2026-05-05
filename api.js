const serverless = require("serverless-http");
const { app, connectDB } = require("./server/app");

connectDB();

module.exports = serverless(app);
