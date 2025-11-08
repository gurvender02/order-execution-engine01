"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleQueueManager = void 0;
const order_processor_1 = require("./order.processor");
class SimpleQueueManager {
    constructor(wsManager, orderService) {
        this.concurrentJobs = 0;
        this.maxConcurrent = 10;
        this.queue = [];
        this.orderProcessor = new order_processor_1.OrderProcessor(wsManager, orderService);
        console.log('SimpleQueueManager initialized (no Redis required)');
    }
    async addOrderToQueue(orderId) {
        this.queue.push(orderId);
        console.log(`Order ${orderId} added to queue. Queue length: ${this.queue.length}`);
        this.processQueue();
        return { id: orderId };
    }
    async processQueue() {
        if (this.concurrentJobs >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }
        this.concurrentJobs++;
        const orderId = this.queue.shift();
        console.log(`Processing order ${orderId}. Concurrent jobs: ${this.concurrentJobs}`);
        try {
            // Simulate job processing with retry logic
            await this.processWithRetry(orderId);
        }
        catch (error) {
            console.error(`Order ${orderId} failed after all retries:`, error);
        }
        finally {
            this.concurrentJobs--;
            // Process next order in queue
            setImmediate(() => this.processQueue());
        }
    }
    async processWithRetry(orderId, attempt = 1) {
        try {
            // Create a mock job object for the order processor
            const mockJob = { data: { orderId } };
            await this.orderProcessor.processOrder(mockJob);
            console.log(`Order ${orderId} completed successfully on attempt ${attempt}`);
        }
        catch (error) {
            if (attempt < 3) {
                const delay = 1000 * attempt; // Exponential backoff: 1s, 2s
                console.log(`Retrying order ${orderId}, attempt ${attempt + 1} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.processWithRetry(orderId, attempt + 1);
            }
            throw error; // After 3 attempts, give up
        }
    }
    async close() {
        console.log('Simple queue manager closed');
        this.queue = [];
    }
    getQueueStats() {
        return {
            queueLength: this.queue.length,
            concurrentJobs: this.concurrentJobs,
            maxConcurrent: this.maxConcurrent
        };
    }
}
exports.SimpleQueueManager = SimpleQueueManager;
