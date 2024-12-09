import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TransactionDto } from './transaction.dto';

@WebSocketGateway({ cors: true })
export class TransactionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TransactionGateway.name);
  @WebSocketServer() server: Server;
  private clientCount: number = 0;

  handleConnection(client: Socket) {
    this.clientCount++;
    this.logger.debug(`Client connected: ${client.id}. We now have a total of ${this.clientCount} connected client(s)`);
  }

  handleDisconnect(client: Socket) {
    this.clientCount--;
    this.logger.debug(`Client disconnected: ${client.id}. We now have a total of ${this.clientCount} connected client(s)`);
  }

  broadcastNewTransaction(transaction: TransactionDto) {
    this.logger.log(`Emiting newTransaction event to ${this.clientCount} clients`);
    this.server.emit('newTransaction', transaction);
  }

  broadcastTransactionUpdate(transaction: TransactionDto) {
    this.logger.log(`Emiting transactionUpdated event to ${this.clientCount} clients`);
    this.server.emit('transactionUpdated', transaction);
  }
}
