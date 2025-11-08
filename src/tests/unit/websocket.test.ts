import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import { WebSocketManager } from '../../services/websocket.manager';

// Mock WebSocket interface
interface MockWebSocket {
  readyState: number;
  send: jest.Mock;
}

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    wsManager = new WebSocketManager();
  });

  test('should add and remove clients', () => {
    const mockWs: MockWebSocket = { 
      readyState: 1, 
      send: jest.fn() 
    };
    
    // These should not throw errors
    expect(() => {
      wsManager.addClient('test-order-1', mockWs as any);
    }).not.toThrow();
    
    expect(() => {
      wsManager.removeClient('test-order-1');
    }).not.toThrow();
  });

  test('should send status to connected client', async () => {
    const mockWs: MockWebSocket = { 
      readyState: 1, 
      send: jest.fn() 
    };
    
    wsManager.addClient('test-order-2', mockWs as any);
    await wsManager.sendStatus('test-order-2', 'pending');
    
    expect(mockWs.send).toHaveBeenCalled();
    
    // Parse the sent message to verify content
    const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0] as string);
    expect(sentMessage.status).toBe('pending');
    expect(sentMessage.orderId).toBe('test-order-2');
  });

  test('should not send status to disconnected client', async () => {
    const mockWs: MockWebSocket = { 
      readyState: 3, // CLOSED state
      send: jest.fn() 
    };
    
    wsManager.addClient('test-order-3', mockWs as any);
    await wsManager.sendStatus('test-order-3', 'pending');
    
    expect(mockWs.send).not.toHaveBeenCalled();
  });

  test('should handle broadcast to multiple clients', () => {
    const mockWs1: MockWebSocket = { readyState: 1, send: jest.fn() };
    const mockWs2: MockWebSocket = { readyState: 1, send: jest.fn() };
    
    wsManager.addClient('order-1', mockWs1 as any);
    wsManager.addClient('order-2', mockWs2 as any);
    
    const broadcastMessage = { type: 'system', message: 'test' };
    
    // Access the private broadcast method
    (wsManager as any).broadcast(broadcastMessage);
    
    // Verify both clients received the message
    const expectedMessage = JSON.stringify(broadcastMessage);
    expect(mockWs1.send).toHaveBeenCalledWith(expectedMessage);
    expect(mockWs2.send).toHaveBeenCalledWith(expectedMessage);
  });
});