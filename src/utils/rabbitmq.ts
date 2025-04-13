import * as amqplib from 'amqplib';
import { EventEmitter } from 'events';

interface RabbitMQConnection extends EventEmitter {
    createChannel(): Promise<amqplib.Channel>;
    close(): Promise<void>;
}

class RabbitMQWrapper {
    private _connection?: RabbitMQConnection;
    private _channel?: amqplib.Channel;
    private static instance: RabbitMQWrapper;

    private constructor() {}

    static getInstance(): RabbitMQWrapper {
        if (!RabbitMQWrapper.instance) {
            RabbitMQWrapper.instance = new RabbitMQWrapper();
        }
        return RabbitMQWrapper.instance;
    }

    async connect(): Promise<void> {
        try {
            // Use the Promise-based API with type assertion
            const connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost') as unknown as RabbitMQConnection;
            this._connection = connection;
            
            const channel = await this._connection.createChannel();
            this._channel = channel;
            
            // Setup exchanges
            await channel.assertExchange('chat_messages', 'fanout', { durable: false });
            await channel.assertExchange('group_events', 'topic', { durable: true });
            
            // Setup error handlers
            this._connection.on('error', (err) => {
                console.error('RabbitMQ connection error:', err);
                this.reconnect();
            });

            this._connection.on('close', () => {
                console.log('RabbitMQ connection closed, attempting to reconnect...');
                this.reconnect();
            });
            
            console.log('Successfully connected to RabbitMQ');
        } catch (error) {
            console.error('RabbitMQ Connection Error:', error);
            throw error;
        }
    }

    private async reconnect() {
        try {
            await this.close();
            await this.connect();
        } catch (error) {
            console.error('Failed to reconnect to RabbitMQ:', error);
            // Retry after delay
            setTimeout(() => this.reconnect(), 5000);
        }
    }

    getChannel(): amqplib.Channel {
        if (!this._channel) {
            throw new Error('RabbitMQ channel not initialized');
        }
        return this._channel;
    }

    async close(): Promise<void> {
        try {
            if (this._channel) {
                await this._channel.close();
                this._channel = undefined;
            }
            if (this._connection) {
                await this._connection.close();
                this._connection = undefined;
            }
        } catch (error) {
            console.error('Error closing RabbitMQ connection:', error);
            throw error;
        }
    }
}

export const rabbitmq = RabbitMQWrapper.getInstance();