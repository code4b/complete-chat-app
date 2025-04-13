export const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Secure Group Messaging API',
        version: '1.0.0',
        description: `
API documentation for secure group messaging system with real-time capabilities.

## Real-time Communication
This API supports real-time messaging using WebSocket connections and RabbitMQ message queuing.

### WebSocket Events
- **Connection**: Connect with authentication token
  \`\`\`javascript
  const socket = io('http://localhost:3000', {
    auth: { token: 'your-jwt-token' }
  });
  \`\`\`

- **Join Group**: Join a group's real-time channel
  \`\`\`javascript
  socket.emit('joinGroup', groupId);
  \`\`\`

- **Send Message**: Send a real-time message
  \`\`\`javascript
  socket.emit('sendMessage', {
    groupId: 'group-id',
    content: 'message content'
  });
  \`\`\`

### Message Queue Integration
Messages are processed through RabbitMQ exchanges:
- chat_messages (fanout): Real-time message broadcasting
- group_events (topic): Group-specific events`
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Local development server'
        }
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            WebSocketMessage: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['message', 'join', 'leave'],
                        description: 'Type of WebSocket event'
                    },
                    groupId: {
                        type: 'string',
                        description: 'ID of the group'
                    },
                    content: {
                        type: 'string',
                        description: 'Message content (for message type)'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Event timestamp'
                    }
                },
                required: ['type', 'groupId']
            },
            WebSocketError: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        description: 'Error message'
                    },
                    code: {
                        type: 'string',
                        description: 'Error code'
                    }
                },
                required: ['error']
            },
            WebSocketEvent: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['joinGroup', 'leaveGroup', 'sendMessage', 'newMessage', 'error'],
                        description: 'Type of WebSocket event'
                    },
                    payload: {
                        type: 'object',
                        oneOf: [
                            {
                                type: 'object',
                                properties: {
                                    groupId: { type: 'string' }
                                },
                                required: ['groupId']
                            },
                            {
                                type: 'object',
                                properties: {
                                    groupId: { type: 'string' },
                                    content: { type: 'string' }
                                },
                                required: ['groupId', 'content']
                            }
                        ]
                    }
                }
            },
            WebSocketResponse: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['joined', 'newMessage', 'error']
                    },
                    payload: {
                        type: 'object'
                    }
                }
            }
        }
    },
    paths: {
        '/api/messages/{groupId}': {
            post: {
                tags: ['Messages'],
                summary: 'Send a message to a group',
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        in: 'path',
                        name: 'groupId',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['content'],
                                properties: {
                                    content: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Message sent successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        _id: { type: 'string' },
                                        content: { type: 'string' },
                                        sender: { type: 'string' },
                                        group: { type: 'string' },
                                        timestamp: { 
                                            type: 'string',
                                            format: 'date-time'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/websocket': {
            get: {
                tags: ['WebSocket'],
                summary: 'WebSocket connection endpoint',
                description: `
Establishes a WebSocket connection for real-time messaging.
                
Authentication is required via token in the connection handshake:
\`\`\`javascript
const socket = io('http://localhost:3000', {
    auth: { token: 'your-jwt-token' }
});
\`\`\``,
                security: [{ BearerAuth: [] }],
                responses: {
                    '101': {
                        description: 'WebSocket connection established',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'connected' }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        description: 'Authentication failed',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        }
    },
    tags: [
        {
            name: 'Real-time Communication',
            description: 'WebSocket endpoints for real-time messaging'
        },
        {
            name: 'WebSocket',
            description: 'Real-time messaging endpoints using WebSocket'
        }
    ],
    webhooks: {
        'newMessage': {
            post: {
                summary: 'New message event (WebSocket)',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/WebSocketMessage'
                            }
                        }
                    }
                }
            }
        },
        'joinGroup': {
            post: {
                summary: 'Join group event (WebSocket)',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    groupId: { type: 'string' }
                                },
                                required: ['groupId']
                            }
                        }
                    }
                }
            }
        }
    }
};