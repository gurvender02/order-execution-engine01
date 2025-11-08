import { Job } from 'bullmq';
import { DEXRouterService } from '../services/dex.router';
import { WebSocketManager } from '../services/websocket.manager';
import { OrderService } from '../services/order.service';

export class OrderProcessor {
  private dexRouter: DEXRouterService;
  private wsManager: WebSocketManager;
  private orderService: OrderService;

  constructor(wsManager: WebSocketManager, orderService: OrderService) {
    this.dexRouter = new DEXRouterService();
    this.wsManager = wsManager;
    this.orderService = orderService;
  }

  async processOrder(job: Job) {
    const { orderId } = job.data;
    const order = this.orderService.getOrder(orderId);

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    try {
      // Update status: routing
      await this.wsManager.sendStatus(orderId, 'routing');
      this.orderService.updateOrderStatus(orderId, 'routing');

      // Get best quote from DEXs
      const bestQuote = await this.dexRouter.getBestQuote({
        tokenIn: order.tokenIn,
        tokenOut: order.tokenOut,
        amount: order.amount
      });

      // Update status: building
      await this.wsManager.sendStatus(orderId, 'building', { dex: bestQuote.dex });
      this.orderService.updateOrderStatus(orderId, 'building', { dexUsed: bestQuote.dex });

      // Update status: submitted
      await this.wsManager.sendStatus(orderId, 'submitted');
      this.orderService.updateOrderStatus(orderId, 'submitted');

      // Execute the swap
      const swapResult = await this.dexRouter.executeOrder(bestQuote.dex, order);

      if (swapResult.success) {
        // Update status: confirmed
        await this.wsManager.sendStatus(orderId, 'confirmed', {
          txHash: swapResult.txHash,
          executedPrice: swapResult.executedPrice
        });
        this.orderService.updateOrderStatus(orderId, 'confirmed', {
          txHash: swapResult.txHash,
          executedPrice: swapResult.executedPrice
        });
        
        return { success: true, orderId, txHash: swapResult.txHash };
      } else {
        throw new Error('Swap execution failed');
      }

    } catch (error) {
      console.error(`Order ${orderId} failed:`, error);
      
      // Update status: failed
      await this.wsManager.sendStatus(orderId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.orderService.updateOrderStatus(orderId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error; // This will trigger retry logic
    }
  }
}