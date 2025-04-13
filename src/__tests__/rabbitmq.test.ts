import { rabbitmq } from '../utils/rabbitmq';
import { Channel } from 'amqplib';

describe('RabbitMQ Integration', () => {
    let channel: Channel;
    let testQueue: string;
    let isRabbitMQAvailable = false;

    beforeAll(async () => {
        try {
            await rabbitmq.connect();
            channel = rabbitmq.getChannel();
            isRabbitMQAvailable = true;
        } catch (error) {
            console.warn('RabbitMQ not available, skipping tests');
            isRabbitMQAvailable = false;
        }
    });

    beforeEach(async () => {
        if (!isRabbitMQAvailable) {
            return;
        }
        const queueResult = await channel.assertQueue('', { exclusive: true });
        testQueue = queueResult.queue;
    });

    afterEach(async () => {
        if (isRabbitMQAvailable && channel && testQueue) {
            await channel.deleteQueue(testQueue);
        }
    });

    afterAll(async () => {
        if (isRabbitMQAvailable) {
            await rabbitmq.close();
        }
    });

    it('should connect to RabbitMQ successfully', () => {
        if (!isRabbitMQAvailable) {
            console.log('Skipping test: RabbitMQ not available');
            return;
        }
        expect(channel).toBeDefined();
        expect(typeof channel.publish).toBe('function');
    });

    it('should handle chat message publication and consumption', (done) => {
        if (!isRabbitMQAvailable) {
            console.log('Skipping test: RabbitMQ not available');
            done();
            return;
        }
        const testMessage = {
            groupId: 'test-group',
            message: {
                content: 'Hello World',
                sender: 'test-user',
                timestamp: new Date()
            }
        };

        // Bind the test queue to the chat_messages exchange
        channel.bindQueue(testQueue, 'chat_messages', '').then(() => {
            // Start consuming messages
            channel.consume(testQueue, (msg) => {
                if (msg) {
                    const receivedMessage = JSON.parse(msg.content.toString());
                    expect(receivedMessage).toEqual(testMessage);
                    channel.ack(msg);
                    done();
                }
            });

            // Publish test message
            channel.publish(
                'chat_messages',
                '',
                Buffer.from(JSON.stringify(testMessage))
            );
        });
    });

    it('should handle group events with topic routing', (done) => {
        if (!isRabbitMQAvailable) {
            console.log('Skipping test: RabbitMQ not available');
            done();
            return;
        }
        const testEvent = {
            type: 'new_message',
            groupId: 'test-group',
            messageId: 'test-message'
        };

        const routingKey = `group.${testEvent.groupId}.message`;

        // Bind the test queue to the group_events exchange with routing key
        channel.bindQueue(testQueue, 'group_events', routingKey).then(() => {
            // Start consuming messages
            channel.consume(testQueue, (msg) => {
                if (msg) {
                    const receivedEvent = JSON.parse(msg.content.toString());
                    expect(receivedEvent).toEqual(testEvent);
                    channel.ack(msg);
                    done();
                }
            });

            // Publish test event
            channel.publish(
                'group_events',
                routingKey,
                Buffer.from(JSON.stringify(testEvent))
            );
        });
    });

    it('should handle multiple consumers for the same message', (done) => {
        if (!isRabbitMQAvailable) {
            console.log('Skipping test: RabbitMQ not available');
            done();
            return;
        }
        let consumersReceived = 0;
        const numberOfConsumers = 3;
        const testMessage = { content: 'Broadcast message' };

        const setupConsumer = () => {
            channel.consume(testQueue, (msg) => {
                if (msg) {
                    const receivedMessage = JSON.parse(msg.content.toString());
                    expect(receivedMessage).toEqual(testMessage);
                    channel.ack(msg);
                    consumersReceived++;

                    if (consumersReceived === numberOfConsumers) {
                        done();
                    }
                }
            });
        };

        // Setup multiple consumers
        channel.bindQueue(testQueue, 'chat_messages', '').then(() => {
            for (let i = 0; i < numberOfConsumers; i++) {
                setupConsumer();
            }

            // Publish test message
            channel.publish(
                'chat_messages',
                '',
                Buffer.from(JSON.stringify(testMessage))
            );
        });
    });

    it('should handle connection recovery', async () => {
        if (!isRabbitMQAvailable) {
            console.log('Skipping test: RabbitMQ not available');
            return;
        }
        // Close the connection
        await rabbitmq.close();
        
        // Attempt to reconnect
        await rabbitmq.connect();
        
        const newChannel = rabbitmq.getChannel();
        expect(newChannel).toBeDefined();
        expect(typeof newChannel.publish).toBe('function');
    });
});