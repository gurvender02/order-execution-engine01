"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
class OrderService {
    constructor() {
        this.orders = new Map();
        this.orderCounter = 1;
    }
    generateOrderId() {
        return `order_${Date.now()}_${this.orderCounter++}`;
    }
    createOrder(orderRequest) {
        const order = {
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
    getOrder(orderId) {
        return this.orders.get(orderId);
    }
    updateOrderStatus(orderId, status, updates = {}) {
        const order = this.orders.get(orderId);
        if (order) {
            order.status = status;
            Object.assign(order, updates);
            this.orders.set(orderId, order);
            console.log(`Updated order ${orderId} to status: ${status}`);
        }
    }
    getAllOrders() {
        return Array.from(this.orders.values());
    }
}
exports.OrderService = OrderService;
