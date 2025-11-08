"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEXRouterService = void 0;
const mock_dex_1 = require("../utils/mock.dex");
class DEXRouterService {
    constructor() {
        this.mockRouter = new mock_dex_1.MockDEXRouter();
    }
    async getBestQuote(orderRequest) {
        console.log('Fetching quotes from both DEXs...');
        const [raydiumQuote, meteoraQuote] = await Promise.all([
            this.mockRouter.getRaydiumQuote(orderRequest.tokenIn, orderRequest.tokenOut, orderRequest.amount),
            this.mockRouter.getMeteoraQuote(orderRequest.tokenIn, orderRequest.tokenOut, orderRequest.amount)
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
    async executeOrder(dex, order) {
        console.log(`Executing order on ${dex.toUpperCase()}...`);
        return await this.mockRouter.executeSwap(dex, order);
    }
}
exports.DEXRouterService = DEXRouterService;
