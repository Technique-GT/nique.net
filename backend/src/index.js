"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("./app");
const env_1 = require("./utils/env");
const logger_1 = require("./utils/logger");
if (env_1.env.MONGO_DB_NAME === 'technique' && env_1.env.NODE_ENV !== 'production') {
    throw new Error('Refusing to start with MONGO_DB_NAME=technique (read-only safety rule)');
}
const app = (0, app_1.createApp)();
const PORT = env_1.env.PORT;
// Connect to MongoDB
logger_1.logger.info({ dbName: env_1.env.MONGO_DB_NAME }, 'Mongo target database');
mongoose_1.default
    .connect(env_1.env.ATLAS_URI, { dbName: env_1.env.MONGO_DB_NAME })
    .then(() => {
    logger_1.logger.info('Connected to MongoDB');
    app.listen(PORT, () => {
        logger_1.logger.info({ port: PORT }, 'Server listening');
    });
})
    .catch((error) => {
    logger_1.logger.error({ error }, 'MongoDB connection error');
    process.exit(1);
});
