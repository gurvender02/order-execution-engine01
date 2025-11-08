import { OrderProcessor } from './order.processor';
import { WebSocketManager } from '../services/websocket.manager';
import { OrderService } from '../services/order.service';
import { IQueueManager } from '../types/queue.interface';

interface MockJob {
  data: {
    orderId: string;
  };
}

export class SimpleQueueManager implements IQueueManager {
  private orderProcessor: OrderProcessor;
  private concurrentJobs = 0;
  private maxConcurrent = 10;
  private queue: string[] = [];

  constructor(wsManager: WebSocketManager, orderService: OrderService) {
    this.orderProcessor = new OrderProcessor(wsManager, orderService);
    console.log('SimpleQueueManager initialized (no Redis required)');
  }

  async addOrderToQueue(orderId: string): Promise<{ id: string }> {
    this.queue.push(orderId);
    console.log(`Order ${orderId} added to queue. Queue length: ${this.queue.length}`);
    this.processQueue();
    return { id: orderId };
  }

private async processQueue(): Promise<void> {
  if (this.concurrentJobs >= this.maxConcurrent || this.queue.length === 0) {
    return;
  }

  this.concurrentJobs++;
  const orderId = this.queue.shift()!;

  console.log(`Processing order ${orderId}. Concurrent jobs: ${this.concurrentJobs}`);

  try {
    // Simulate job processing with retry logic
    await this.processWithRetry(orderId);
  } catch (error) {
    console.error(`Order ${orderId} failed after all retries:`, error);
  } finally {
    this.concurrentJobs--;
    // Process next order in queue
    setImmediate(() => this.processQueue());
  }
}



private async processWithRetry(orderId: string, attempt = 1): Promise<void> {
try {
    // Create a mock job object for the order processor
    const mockJob: MockJob = { data: { orderId } };
    await (this.orderProcessor as any).processOrder(mockJob);
    console.log(`Order ${orderId} completed successfully on attempt ${attempt}`);
} catch (error) {
    if (attempt < 3) {
    const delay = 1000 * attempt; // Exponential backoff: 1s, 2s
    console.log(`Retrying order ${orderId}, attempt ${attempt + 1} after ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.processWithRetry(orderId, attempt + 1);
    }
    throw error; // After 3 attempts, give up
}
}

  async close(): Promise<void> {
    console.log('Simple queue manager closed');
    this.queue = [];
  }

    getQueueStats(): { queueLength: number; concurrentJobs: number; maxConcurrent: number } {
    return {
        queueLength: this.queue.length,
        concurrentJobs: this.concurrentJobs,
        maxConcurrent: this.maxConcurrent
    };
    }
}