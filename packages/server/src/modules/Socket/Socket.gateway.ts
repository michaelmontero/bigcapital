import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Helper function to get CORS origins from environment
function getCorsOrigins(): string | string[] {
  const corsOrigins = process.env.CORS_ORIGINS || '*';
  if (corsOrigins === '*') {
    return '*';
  }
  return corsOrigins.split(',').map(origin => origin.trim()).filter(Boolean);
}

@WebSocketGateway({
  namespace: '/',
  path: '/socket',
  cors: {
    origin: getCorsOrigins(),
    methods: ['GET', 'POST'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SocketGateway');

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    // Update CORS configuration from environment
    const corsConfig = this.configService.get('app.cors');
    if (corsConfig?.origins) {
      // Note: Socket.IO CORS is set at initialization, but we log the config
      this.logger.log(`Socket.IO Gateway initialized with CORS origins: ${Array.isArray(corsConfig.origins) ? corsConfig.origins.join(', ') : corsConfig.origins}`);
    } else {
      this.logger.log('Socket.IO Gateway initialized');
    }
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Method to emit NEW_TRANSACTIONS_DATA event
  emitNewTransactionsData() {
    this.server.emit('NEW_TRANSACTIONS_DATA');
    this.logger.log('Emitted NEW_TRANSACTIONS_DATA event');
  }

  // Method to emit SUBSCRIPTION_CHANGED event
  emitSubscriptionChanged() {
    this.server.emit('SUBSCRIPTION_CHANGED');
    this.logger.log('Emitted SUBSCRIPTION_CHANGED event');
  }
}


