export interface IQueueManager {
  addOrderToQueue(orderId: string): Promise<{ id: string }>;
  close(): Promise<void>;
}