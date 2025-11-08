import { Order, OrderRequest, OrderStatus } from '../types';

export class OrderService {
  private orders: Map<string, Order> = new Map();
  private orderCounter = 1;

  generateOrderId(): string {
    return `order_${Date.now()}_${this.orderCounter++}`;
  }

  createOrder(orderRequest: OrderRequest): Order {
    const order: Order = {
      id: this.generateOrderId(),
      type: 'market',
      tokenIn: orderRequest.tokenIn,
      tokenOut: orderRequest.tokenOut,
      amount: orderRequest.amount,
      status: 'pending',
      createdAt: new Date()
    };

    this.orders.set(order.id, order);
    console.log(`Created new order: ${order.id}`);
    
    return order;
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  updateOrderStatus(orderId: string, status: OrderStatus, updates: Partial<Order> = {}) {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = status;
      Object.assign(order, updates);
      this.orders.set(orderId, order);
      console.log(`Updated order ${orderId} to status: ${status}`);
    }
  }

  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }
}