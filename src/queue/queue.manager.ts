import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { OrderProcessor } from './order.processor';
import { WebSocketManager } from '../services/websocket.manager';
import { OrderService } from '../services/order.service';

export class QueueManager {
  private connection: IORedis;
  public orderQueue: Queue;
  private worker: Worker;
  private orderProcessor: OrderProcessor;

  constructor(wsManager: WebSocketManager, orderService: OrderService) {
    this.connection = new IORedis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null
    });

    this.orderProcessor = new OrderProcessor(wsManager, orderService);

    this.orderQueue = new Queue('order execution', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    });

    this.worker = new Worker(
      'order execution',
      async (job) => {
        return await this.orderProcessor.processOrder(job);
      },
      { 
        connection: this.connection,
        concurrency: 10 // Process up to 10 orders concurrently
      }
    );

    this.setupWorkerEvents();
  }

  private setupWorkerEvents() {
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

  async addOrderToQueue(orderId: string) {
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