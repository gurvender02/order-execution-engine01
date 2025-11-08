import { OrderService } from '../../src/services/order.service';
import { describe, beforeEach, test, expect } from '@jest/globals';
describe('Order Service Integration', () => {
  let orderService: OrderService;

  beforeEach(() => {
    orderService = new OrderService();
  });

  test('should create and process order', async () => {
    const order = orderService.createOrder({
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amount: 1.5
    });

    expect(order.id).toContain('order_');
    expect(order.status).toBe('pending');
    expect(order.tokenIn).toBe('SOL');
    expect(order.tokenOut).toBe('USDC');

    // Simulate status updates
    orderService.updateOrderStatus(order.id, 'routing');
    orderService.updateOrderStatus(order.id, 'building', { dexUsed: 'raydium' });
    orderService.updateOrderStatus(order.id, 'confirmed', { 
      txHash: 'test_tx_hash', 
      executedPrice: 100.5 
    });

    const updatedOrder = orderService.getOrder(order.id);
    expect(updatedOrder?.status).toBe('confirmed');
    expect(updatedOrder?.txHash).toBe('test_tx_hash');
  });

  test('should handle multiple orders', () => {
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

    const allOrders = orderService.getAllOrders();
    expect(allOrders).toHaveLength(2);
    expect(allOrders.map(o => o.id)).toContain(order1.id);
    expect(allOrders.map(o => o.id)).toContain(order2.id);
  });
});