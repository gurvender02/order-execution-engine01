export interface Order {
  id: string;
  type: 'market';
  tokenIn: string;
  tokenOut: string;
  amount: number;
  status: OrderStatus;
  dexUsed?: string;
  executedPrice?: number;
  txHash?: string;
  error?: string;
  createdAt: Date;
}

export type OrderStatus = 
  | 'pending'
  | 'routing' 
  | 'building'
  | 'submitted'
  | 'confirmed'
  | 'failed';

export interface DEXQuote {
  price: number;
  fee: number;
  dex: 'raydium' | 'meteora';
}

export interface OrderRequest {
  tokenIn: string;
  tokenOut: string;
  amount: number;
}

export interface IQueueManager {
  addOrderToQueue(orderId: string): Promise<{ id: string }>;
  close(): Promise<void>;
}