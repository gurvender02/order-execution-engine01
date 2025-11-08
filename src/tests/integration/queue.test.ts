import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import { SimpleQueueManager } from '../../queue/simple.queue.manager';
import { WebSocketManager } from '../../services/websocket.manager';
import { OrderService } from '../../services/order.service';

// Create a proper mock for OrderProcessor
jest.mock('../../queue/order.processor', () => {
  return {
    OrderProcessor: jest.fn().mockImplementation(() => ({
      processOrder: jest.fn().mockImplementation(() => Promise.resolve({ success: true }))
    }))
  };
});

describe('Queue Integration', () => {
  let queueManager: SimpleQueueManager;
  let wsManager: WebSocketManager;
  let orderService: OrderService;

  beforeEach(() => {
    wsManager = new WebSocketManager();
    orderService = new OrderService();
    queueManager = new SimpleQueueManager(wsManager, orderService);
  });

  test('should add order to queue', async () => {
    const order = orderService.createOrder({
      tokenIn: 'SOL', 
      tokenOut: 'USDC', 
      amount: 1.0
    });

    const job = await queueManager.addOrderToQueue(order.id);
    
    expect(job.id).toBe(order.id);
  });

  test('should process multiple orders', async () => {
    const order1 = orderService.createOrder({
      tokenIn: 'SOL', 
      tokenOut: 'USDC', 
      amount: 1.0
    });
    
    const order2 = orderService.createOrder({
      tokenIn: 'USDC', 
      tokenOut: 'SOL', 
      amount: 100
    });

    await queueManager.addOrderToQueue(order1.id);
    await queueManager.addOrderToQueue(order2.id);

    // Wait a bit for queue processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Access the private method using type assertion
    const stats = (queueManager as any).getQueueStats();
    expect(stats.concurrentJobs).toBeLessThanOrEqual(10);
  });

  test('should handle queue stats', () => {
    // Access the private method using type assertion
    const stats = (queueManager as any).getQueueStats();
    
    expect(stats).toHaveProperty('queueLength');
    expect(stats).toHaveProperty('concurrentJobs');
    expect(stats).toHaveProperty('maxConcurrent');
    expect(stats.maxConcurrent).toBe(10);
  });

  test('should close queue manager', async () => {
    await queueManager.close();
    
    const stats = (queueManager as any).getQueueStats();
    expect(stats.queueLength).toBe(0);
  });
});