export class WebSocketManager {
  private clients: Map<string, any> = new Map(); // Use 'any' to be flexible with WebSocket implementations

  addClient(orderId: string, ws: any) {
    this.clients.set(orderId, ws);
    console.log(`WebSocket client added for order: ${orderId}`);
  }

  removeClient(orderId: string) {
    this.clients.delete(orderId);
    console.log(`WebSocket client removed for order: ${orderId}`);
  }

  async sendStatus(orderId: string, status: string, data?: any) {
    const client = this.clients.get(orderId);
    if (client && client.readyState === 1) { // 1 = OPEN
      const message = JSON.stringify({
        orderId,
        status,
        data,
        timestamp: new Date().toISOString()
      });
      
      client.send(message);
      console.log(`Sent status update for ${orderId}: ${status}`);
    }
  }

  // Broadcast to all clients (for multiple orders)
  broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client, orderId) => {
      if (client.readyState === 1) { // 1 = OPEN
        client.send(messageStr);
      }
    });
  }
}