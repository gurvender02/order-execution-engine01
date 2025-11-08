import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { WebSocketManager } from './services/websocket.manager';
import { OrderService } from './services/order.service';
import { QueueManager } from './queue/queue.manager';
import { orderRoutes } from './api/orders.routes';
import { SimpleQueueManager } from './queue/simple.queue.manager';
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// ADD CORS SUPPORT
fastify.addHook('onRequest', (request, reply, done) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  done();
});

// Handle preflight requests
fastify.options('/*', async (request, reply) => {
  reply.send();
});

// Initialize services
const wsManager = new WebSocketManager();
const orderService = new OrderService();
// const queueManager = new QueueManager(wsManager, orderService);
const queueManager = new SimpleQueueManager(wsManager, orderService); // Use SimpleQueueManage

async function startServer() {
  try {
    // Register WebSocket plugin
    await fastify.register(fastifyWebsocket, {
      options: {
        maxPayload: 1048576 // 1MB
      }
    });
    // Register order routes with /api/orders prefix
    await fastify.register(async (apiInstance) => {
      apiInstance.register(orderRoutes, { 
        wsManager, 
        orderService, 
        queueManager 
      });
    }, { prefix: '/api/orders' });

    // WebSocket connection handler
    fastify.register(async function (fastify) {
      fastify.get('/ws/:orderId', { websocket: true }, (connection, req) => {
        const { orderId } = req.params as { orderId: string };
        
        console.log(`WebSocket connection established for order: ${orderId}`);
        
        // Use the connection directly (it's already a WebSocket)
        wsManager.addClient(orderId, connection as any);

        connection.on('close', () => {
          console.log(`WebSocket connection closed for order: ${orderId}`);
          wsManager.removeClient(orderId);
        });

        connection.on('error', (error: any) => {
          console.error(`WebSocket error for order ${orderId}:`, error);
        });
      });
    });

    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
      return { status: 'OK', timestamp: new Date().toISOString() };
    });

    // Start server
    // const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📊 Order execution engine ready`);
    console.log(`🔌 WebSocket available at ws://localhost:${port}/ws/:orderId`);

  } catch (err) {
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