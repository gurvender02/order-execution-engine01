"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDEXRouter = void 0;
class MockDEXRouter {
    constructor() {
        this.basePrices = {
            'SOL/USDC': 100,
            'USDC/SOL': 0.01,
            'SOL/RAY': 0.5,
            'RAY/SOL': 2,
        };
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async getRaydiumQuote(tokenIn, tokenOut, amount) {
        await this.sleep(200 + Math.random() * 300);
        const pair = `${tokenIn}/${tokenOut}`;
        const basePrice = this.basePrices[pair] || 1;
        const price = basePrice * (0.98 + Math.random() * 0.04);
        return {
            price,
            fee: 0.003,
            dex: 'raydium'
        };
    }
    async getMeteoraQuote(tokenIn, tokenOut, amount) {
        await this.sleep(200 + Math.random() * 300);
        const pair = `${tokenIn}/${tokenOut}`;
        const basePrice = this.basePrices[pair] || 1;
        const price = basePrice * (0.97 + Math.random() * 0.05);
        return {
            price,
            fee: 0.002,
            dex: 'meteora'
        };
    }
    async executeSwap(dex, order) {
        // Simulate 2-3 second execution
        await this.sleep(2000 + Math.random() * 1000);
        // Generate mock transaction hash
        const txHash = 'mock_tx_' + Math.random().toString(36).substring(2, 15);
        // Get final executed price (slightly different from quote)
        const pair = `${order.tokenIn}/${order.tokenOut}`;
        const basePrice = this.basePrices[pair] || 1;
        const executedPrice = basePrice * (0.99 + Math.random() * 0.02);
        return {
            txHash,
            executedPrice,
            success: Math.random() > 0.1 // 90% success rate
        };
    }
}
exports.MockDEXRouter = MockDEXRouter;
