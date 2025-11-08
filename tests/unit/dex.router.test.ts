import { DEXRouterService } from '../../src/services/dex.router';
import { describe, beforeEach, test, expect } from '@jest/globals';

describe('DEXRouterService', () => {
  let dexRouter: DEXRouterService;

  beforeEach(() => {
    dexRouter = new DEXRouterService();
  });

  test('should get best quote from DEXs', async () => {
    const quote = await dexRouter.getBestQuote({
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amount: 1.0
    });

    expect(quote).toHaveProperty('price');
    expect(quote).toHaveProperty('fee');
    expect(quote).toHaveProperty('dex');
    expect(['raydium', 'meteora']).toContain(quote.dex);
    expect(quote.price).toBeGreaterThan(0);
  });

  test('should execute order successfully', async () => {
    const order = {
      id: 'test-order-1',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amount: 1.0
    };

    const result = await dexRouter.executeOrder('raydium', order);
    
    expect(result).toHaveProperty('txHash');
    expect(result).toHaveProperty('executedPrice');
    expect(result).toHaveProperty('success');
    expect(result.txHash).toContain('mock_tx_');
  });
});