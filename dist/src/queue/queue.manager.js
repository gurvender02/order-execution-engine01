"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueManager = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const order_processor_1 = require("./order.processor");
class QueueManager {
    constructor(wsManager, orderService) {
        this.connection = new ioredis_1.default({
            host: 'localhost',
            port: 6379,
            maxRetriesPerRequest: null
        });
        this.orderProcessor = new order_processor_1.OrderProcessor(wsManager, orderService);
        this.orderQueue = new bullmq_1.Queue('order execution', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                }
            }
        });
        this.worker = new bullmq_1.Worker('order execution', async (job) => {
            return await this.orderProcessor.processOrder(job);
        }, {
            connection: this.connection,
            concurrency: 10 // Process up to 10 orders concurrently
        });
        this.setupWorkerEvents();
    }
    setupWorkerEvents() {
        this.worker.on('completed', (job) => {
            console.log(`Order ${job.id} completed successfully`);
        });
        this.worker.on('failed', (job, err) => {
            console.error(`Order ${job?.id} failed:`, err);
        });
        this.worker.on('error', (err) => {
            console.error('Queue worker error:', err);
        });
    }
    async addOrderToQueue(orderId) {
        return await this.orderQueue.add('process-order', { orderId }, {
            jobId: orderId,
            removeOnComplete: true,
            removeOnFail: false
        });
    }
    async close() {
        await this.worker.close();
        await this.orderQueue.close();
        await this.connection.quit();
    }
}
exports.QueueManager = QueueManager;
