import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';

@Injectable()
export class WebSocketClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebSocketClient.name);
  private socket: Socket;

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  private connect() {
    try {
      this.socket = io('http://localhost:3001', {
        auth: {
          // AI service authentication - you might want to use a service token
          service: 'ai-service',
        },
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        this.logger.log('Connected to backend WebSocket server');
      });

      this.socket.on('disconnect', () => {
        this.logger.log('Disconnected from backend WebSocket server');
      });

      this.socket.on('connect_error', (error) => {
        this.logger.error('WebSocket connection error:', error);
      });
    } catch (error) {
      this.logger.error('Failed to initialize WebSocket connection:', error);
    }
  }

  /**
   * Send application status update to backend
   */
  sendApplicationStatusUpdate(applicationId: string, status: string, details?: any) {
    if (!this.socket?.connected) {
      this.logger.warn('WebSocket not connected, skipping status update');
      return;
    }

    const updateData = {
      applicationId,
      status,
      timestamp: new Date().toISOString(),
      source: 'ai-service',
      ...details,
    };

    this.logger.log(`Sending status update: ${applicationId} -> ${status}`);
    this.socket.emit('ai-service-status-update', updateData);
  }

  /**
   * Send application rejection details
   */
  sendApplicationRejection(applicationId: string, rejectionDetails: any) {
    if (!this.socket?.connected) {
      this.logger.warn('WebSocket not connected, skipping rejection update');
      return;
    }

    const rejectionData = {
      applicationId,
      status: 'REJECTED',
      isRejected: true,
      timestamp: new Date().toISOString(),
      source: 'ai-service',
      ...rejectionDetails,
    };

    this.logger.log(`Sending rejection details for application ${applicationId}`);
    this.socket.emit('ai-service-rejection', rejectionData);
  }

  /**
   * Send AI review progress updates
   */
  sendAIReviewProgress(applicationId: string, stage: string, result: string, details?: any) {
    if (!this.socket?.connected) {
      this.logger.warn('WebSocket not connected, skipping review progress update');
      return;
    }

    const progressData = {
      applicationId,
      reviewStage: stage,
      result,
      timestamp: new Date().toISOString(),
      source: 'ai-service',
      ...details,
    };

    this.logger.log(`Sending review progress: ${applicationId} - ${stage} -> ${result}`);
    this.socket.emit('ai-service-review-progress', progressData);
  }
}
