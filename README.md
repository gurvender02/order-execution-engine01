# Order Execution Engine

A backend system for processing market orders with DEX routing and real-time WebSocket updates.

## Features

- ✅ Market order execution
- ✅ DEX routing (Raydium vs Meteora price comparison)
- ✅ Real-time WebSocket status updates
- ✅ Concurrent order processing (up to 10 orders)
- ✅ Exponential backoff retry logic
- ✅ Mock DEX implementation with realistic delays

## API Endpoints

- `POST /api/orders/execute` - Create new market order
- `GET /api/orders/:orderId` - Get order status
- `GET /api/orders` - Get all orders
- `GET /health` - Health check
- `WS /ws/:orderId` - WebSocket for real-time updates

## Order Status Flow

1. **pending** - Order received
2. **routing** - Comparing DEX prices
3. **building** - Creating transaction
4. **submitted** - Transaction sent
5. **confirmed** - Transaction successful
6. **failed** - If any step fails

## Order Type Selection

**Why Market Orders?**
We chose market orders as they provide the simplest implementation while demonstrating core DEX routing logic. Immediate execution aligns perfectly with real-time WebSocket updates and serves as a foundation for more complex order types.

**Extensibility to Other Order Types:**
- **Limit Orders**: Add price monitoring service that triggers market orders when price targets are reached
- **Sniper Orders**: Extend with token launch detection and immediate market order execution upon launch

## Setup

1. Install dependencies:
   ```bash
   npm install
