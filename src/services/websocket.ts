import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string, userId: string) {
    if (this.socket?.connected) {
      return;
    }

    // In production, WebSocket will be on the same domain
    const isDevelopment = import.meta.env.DEV;
    const serverUrl = isDevelopment 
      ? (import.meta.env.VITE_WS_URL || 'https://server-nwxv.onrender.com')
      : window.location.origin;
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Authenticate with the server
      this.socket?.emit('authenticate', { userId, token });
    });

    this.socket.on('authenticated', (data) => {
      if (data.success) {
        console.log('WebSocket authenticated successfully');
        // Subscribe to user-specific updates
        this.subscribeToPortfolio();
        this.subscribeToAnalytics();
      } else {
        console.error('WebSocket authentication failed:', data.error);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Portfolio updates
    this.socket.on('portfolio_update', (data) => {
      this.emit('portfolioUpdate', data);
    });

    // Market data updates
    this.socket.on('market_data_update', (data) => {
      this.emit('marketDataUpdate', data);
    });

    this.socket.on('market_update', (data) => {
      this.emit('marketUpdate', data);
    });

    // Notifications
    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });

    // Analytics updates
    this.socket.on('analytics_update', (data) => {
      this.emit('analyticsUpdate', data);
    });

    // System alerts
    this.socket.on('market_alert', (data) => {
      this.emit('marketAlert', data);
    });

    this.socket.on('system_alert', (data) => {
      this.emit('systemAlert', data);
    });

    // System metrics (for admin users)
    this.socket.on('system_metrics', (data) => {
      this.emit('systemMetrics', data);
    });

    // Support responses
    this.socket.on('support_response', (data) => {
      this.emit('supportResponse', data);
    });

    // Pong response for health checks
    this.socket.on('pong', (data) => {
      console.log('WebSocket health check OK:', data.timestamp);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.socket?.connect();
    }, delay);
  }

  subscribeToPortfolio() {
    this.socket?.emit('subscribe_portfolio');
  }

  subscribeToMarketData(symbols: string[]) {
    this.socket?.emit('subscribe_market_data', { symbols });
  }

  unsubscribeFromMarketData(symbols: string[]) {
    this.socket?.emit('unsubscribe_market_data', { symbols });
  }

  subscribeToAnalytics() {
    this.socket?.emit('subscribe_analytics');
  }

  sendSupportMessage(message: string, type = 'general') {
    this.socket?.emit('support_message', { message, type });
  }

  sendCustomEvent(eventName: string, data: any) {
    this.socket?.emit('custom_event', { event: eventName, data });
  }

  // Health check
  ping() {
    this.socket?.emit('ping');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event emitter functionality
  private eventListeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        (listener) => listener !== callback
      );
    }
  }

  private emit(event: string, data: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach((callback) => callback(data));
    }
  }
}

export const websocketService = new WebSocketService();
export default websocketService;