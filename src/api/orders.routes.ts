import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WebSocketManager } from '../services/websocket.manager';
import { OrderService } from '../services/order.service';
import { IQueueManager } from '../types/queue.interface';
import { OrderRequest } from '../types';

export async function orderRoutes(
  fastify: FastifyInstance,
  options: { wsManager: WebSocketManager; orderService: OrderService; queueManager: IQueueManager }
) {
  const { wsManager, orderService, queueManager } = options;

  // Order execution endpoint
  fastify.post('/execute', {
    schema: {
      body: {
        type: 'object',
        required: ['tokenIn', 'tokenOut', 'amount'],
        properties: {
          tokenIn: { type: 'string' },
          tokenOut: { type: 'string' },
          amount: { type: 'number', minimum: 0.01 }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: OrderRequest }>, reply: FastifyReply) => {
    try {
      // Create new order
      const order = orderService.createOrder(request.body);
      
      // Send immediate response with orderId
      reply.send({ 
        orderId: order.id, 
        status: 'pending',
        message: 'Order received. Upgrade to WebSocket for live updates.'
      });

      // Add order to processing queue
      await queueManager.addOrderToQueue(order.id);

      return reply;
    } catch (error) {
      console.error('Order creation error:', error);
      return reply.status(500).send({ error: 'Failed to create order' });
    }
  });

  // Get order status endpoint
  fastify.get('/:orderId', async (request: FastifyRequest<{ Params: { orderId: string } }>, reply: FastifyReply) => {
    const { orderId } = request.params;
    const order = orderService.getOrder(orderId);
    
    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }

    return reply.send(order);
  });

  // Get all orders endpoint (for testing)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const orders = orderService.getAllOrders();
    return reply.send(orders);
  });
}