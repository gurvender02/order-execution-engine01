"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dex_router_1 = require("../../src/services/dex.router");
describe('DEXRouterService', () => {
    let dexRouter;
    beforeEach(() => {
        dexRouter = new dex_router_1.DEXRouterService();
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
