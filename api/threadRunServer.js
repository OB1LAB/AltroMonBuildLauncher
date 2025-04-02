const { workerData } = require("worker_threads");
const MinecraftApi = require("./MinecraftApi");

MinecraftApi.runServer(...workerData);
