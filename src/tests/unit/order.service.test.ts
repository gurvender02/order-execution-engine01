import { describe, beforeEach, test, expect } from '@jest/globals';
import { OrderService } from '../../services/order.service';

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    orderService = new OrderService();
  });

  test('should create order with unique ID', () => {
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

    expect(order1.id).not.toBe(order2.id);
    expect(order1.id).toContain('order_');
    expect(order2.id).toContain('order_');
  });

  test('should update order status', () => {
    const order = orderService.createOrder({
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amount: 1.0
    });

    orderService.updateOrderStatus(order.id, 'routing');
    orderService.updateOrderStatus(order.id, 'confirmed', { 
      txHash: 'test_hash',
      executedPrice: 100.5
    });

    const updatedOrder = orderService.getOrder(order.id);
    expect(updatedOrder?.status).toBe('confirmed');
    expect(updatedOrder?.txHash).toBe('test_hash');
    expect(updatedOrder?.executedPrice).toBe(100.5);
  });

  test('should return undefined for non-existent order', () => {
    const order = orderService.getOrder('non-existent-id');
    expect(order).toBeUndefined();
  });
});