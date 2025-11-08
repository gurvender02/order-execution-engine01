import { MockDEXRouter } from '../utils/mock.dex';
import { DEXQuote, OrderRequest } from '../types';

export class DEXRouterService {
  private mockRouter: MockDEXRouter;

  constructor() {
    this.mockRouter = new MockDEXRouter();
  }

  async getBestQuote(orderRequest: OrderRequest): Promise<DEXQuote> {
    console.log('Fetching quotes from both DEXs...');
    
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.mockRouter.getRaydiumQuote(
        orderRequest.tokenIn, 
        orderRequest.tokenOut, 
        orderRequest.amount
      ),
      this.mockRouter.getMeteoraQuote(
        orderRequest.tokenIn, 
        orderRequest.tokenOut, 
        orderRequest.amount
      )
    ]);

    // Calculate effective price after fees
    const raydiumEffective = raydiumQuote.price * (1 - raydiumQuote.fee);
    const meteoraEffective = meteoraQuote.price * (1 - meteoraQuote.fee);

    const bestQuote = raydiumEffective > meteoraEffective ? raydiumQuote : meteoraQuote;
    
    console.log(`DEX Routing Decision:
      - Raydium: ${raydiumQuote.price} (effective: ${raydiumEffective})
      - Meteora: ${meteoraQuote.price} (effective: ${meteoraEffective})
      - Selected: ${bestQuote.dex.toUpperCase()}
    `);

    return bestQuote;
  }

  async executeOrder(dex: 'raydium' | 'meteora', order: any) {
    console.log(`Executing order on ${dex.toUpperCase()}...`);
    return await this.mockRouter.executeSwap(dex, order);
  }
}