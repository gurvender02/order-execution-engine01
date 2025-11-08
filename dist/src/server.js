"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const websocket_manager_1 = require("./services/websocket.manager");
const order_service_1 = require("./services/order.service");
const orders_routes_1 = require("./api/orders.routes");
const simple_queue_manager_1 = require("./queue/simple.queue.manager");
const fastify = (0, fastify_1.default)({
    logger: {
        level: 'info',
        transport: {
            target: 'pino-pretty'
        }
    }
});
// Initialize services
const wsManager = new websocket_manager_1.WebSocketManager();
const orderService = new order_service_1.OrderService();
// const queueManager = new QueueManager(wsManager, orderService);
const queueManager = new simple_queue_manager_1.SimpleQueueManager(wsManager, orderService); // Use SimpleQueueManage
async function startServer() {
    try {
        // Register WebSocket plugin
        await fastify.register(websocket_1.default, {
            options: {
                maxPayload: 1048576 // 1MB
            }
        });
        // Register order routes with /api/orders prefix
        await fastify.register(async (apiInstance) => {
            apiInstance.register(orders_routes_1.orderRoutes, {
                wsManager,
                orderService,
                queueManager
            });
        }, { prefix: '/api/orders' });
        // WebSocket connection handler
        fastify.register(async function (fastify) {
            fastify.get('/ws/:orderId', { websocket: true }, (connection, req) => {
                const { orderId } = req.params;
                console.log(`WebSocket connection established for order: ${orderId}`);
                // Use the connection directly (it's already a WebSocket)
                wsManager.addClient(orderId, connection);
                connection.on('close', () => {
                    console.log(`WebSocket connection closed for order: ${orderId}`);
                    wsManager.removeClient(orderId);
                });
                connection.on('error', (error) => {
                    console.error(`WebSocket error for order ${orderId}:`, error);
                });
            });
        });
        // Health check endpoint
        fastify.get('/health', async (request, reply) => {
            return { status: 'OK', timestamp: new Date().toISOString() };
        });
        // Start server
        const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Server running on http://localhost:${port}`);
        console.log(`📊 Order execution engine ready`);
        console.log(`🔌 WebSocket available at ws://localhost:${port}/ws/:orderId`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await queueManager.close();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await queueManager.close();
    process.exit(0);
});
startServer();
