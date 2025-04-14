// Swagger documentation setup
export const apiDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Secure Group Messaging API',
        version: '1.0.0',
        description: 'API documentation for the secure group messaging system'
    },
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    email: { type: 'string' },
                    token: { type: 'string' }
                }
            },
            Otp: {
                type: 'object',
                properties: {
                    message: { type: 'string' }
                }
            },
            Group: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    isPrivate: { type: 'boolean' },
                    owner: { type: 'string' },
                    members: { 
                        type: 'array',
                        items: { type: 'string' }
                    },
                    joinRequests: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    bannedUsers: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            },
            Message: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    content: { type: 'string' },
                    sender: { type: 'string' },
                    group: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    message: { type: 'string' }
                }
            }
        }
    },
    paths: {
        '/api/auth/register': {
            post: {
                tags: ['Authentication'],
                summary: 'Register a new user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', format: 'password' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'User registered successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' }
                            }
                        }
                    },
                    '400': {
                        description: 'Invalid input or user already exists',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/api/auth/sendotp': {
            post: {
                tags: ['Authentication'],
                summary: 'Send OTP to email',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: { type: 'string', format: 'email' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'OTP sent successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Otp' }
                            }
                        }
                    },
                    '400': {
                        description: 'Invalid input or user already exists',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/api/auth/verifyotp': {
            post: {
                tags: ['Authentication'],
                summary: 'Verify OTP',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'otp'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    otp: { type: 'string', format: 'password' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'User registered successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' }
                            }
                        }
                    },
                    '400': {
                        description: 'Invalid input or user already exists',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/api/auth/login': {
            post: {
                tags: ['Authentication'],
                summary: 'Login user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', format: 'password' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Login successful',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' }
                            }
                        }
                    },
                    '401': {
                        description: 'Invalid credentials',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/api/groups': {
            post: {
                tags: ['Groups'],
                security: [{ BearerAuth: [] }],
                summary: 'Create a new group',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'isPrivate', 'initialMembers'],
                                properties: {
                                    name: { type: 'string' },
                                    isPrivate: { type: 'boolean' },
                                    maxMembers: { 
                                        type: 'number',
                                        minimum: 2,
                                        description: 'Maximum number of members allowed in the group. If not provided, group size is unlimited.'
                                    },
                                    initialMembers: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        minItems: 1,
                                        description: 'Array of user IDs to add as initial members. Must contain at least one member besides the owner.'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Group created successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Group' }
                            }
                        }
                    },
                    '400': {
                        description: 'Invalid input or group creation constraints not met',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            },
            get: {
                tags: ['Groups'],
                security: [{ BearerAuth: [] }],
                summary: 'List all groups',
                parameters: [
              
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { 
                            type: 'integer',
                            default: 50
                        }
                    },
                    {
                        in: 'query',
                        name: 'page',
                        schema: { 
                            type: 'integer',
                            default: 1
                        }
                    }
                ],
                responses: {
                    '200': {
                        description: 'Group List retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Message' }
                                }
                            }
                        }
                    },
                    '403': {
                        description: 'Not authorized',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        
        '/api/groups/{groupId}/join': {
            post: {
                tags: ['Groups'],
                security: [{ BearerAuth: [] }],
                summary: 'Join or request to join a group',
                parameters: [{
                    in: 'path',
                    name: 'groupId',
                    required: true,
                    schema: { type: 'string' }
                }],
                responses: {
                    '200': {
                        description: 'Joined group or sent join request',
                        content: {
                            'application/json': {
                                schema: {
                                    oneOf: [
                                        { $ref: '#/components/schemas/Group' },
                                        {
                                            type: 'object',
                                            properties: {
                                                message: { type: 'string', example: 'Join request sent' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    '403': {
                        description: 'User is banned or needs to wait after leaving',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/api/groups/{groupId}/approve/{userId}': {
            post: {
                tags: ['Groups'],
                security: [{ BearerAuth: [] }],
                summary: 'Approve a join request',
                parameters: [
                    {
                        in: 'path',
                        name: 'groupId',
                        required: true,
                        schema: { type: 'string' }
                    },
                    {
                        in: 'path',
                        name: 'userId',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    '200': {
                        description: 'Join request approved',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Group' }
                            }
                        }
                    },
                    '403': {
                        description: 'Not authorized',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/api/groups/{groupId}/leave': {
            post: {
                tags: ['Groups'],
                security: [{ BearerAuth: [] }],
                summary: 'Leave a group',
                parameters: [{
                    in: 'path',
                    name: 'groupId',
                    required: true,
                    schema: { type: 'string' }
                }],
                responses: {
                    '200': {
                        description: 'Left group successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '400': {
                        description: 'Owner must transfer ownership before leaving',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/api/groups/{groupId}/ban/{userId}': {
            post: {
                tags: ['Groups'],
                security: [{ BearerAuth: [] }],
                summary: 'Ban a user from the group',
                parameters: [
                    {
                        in: 'path',
                        name: 'groupId',
                        required: true,
                        schema: { type: 'string' }
                    },
                    {
                        in: 'path',
                        name: 'userId',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    '200': {
                        description: 'User banned successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Group' }
                            }
                        }
                    },
                    '403': {
                        description: 'Not authorized or cannot ban owner',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/api/groups/{groupId}/transfer/{newOwnerId}': {
            post: {
                tags: ['Groups'],
                security: [{ BearerAuth: [] }],
                summary: 'Transfer group ownership',
                parameters: [
                    {
                        in: 'path',
                        name: 'groupId',
                        required: true,
                        schema: { type: 'string' }
                    },
                    {
                        in: 'path',
                        name: 'newOwnerId',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    '200': {
                        description: 'Ownership transferred successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Group' }
                            }
                        }
                    },
                    '403': {
                        description: 'Not authorized or new owner must be a member',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        },
        '/api/messages/{groupId}': {
            post: {
                tags: ['Messages'],
                security: [{ BearerAuth: [] }],
                summary: 'Send a message to a group',
                parameters: [{
                    in: 'path',
                    name: 'groupId',
                    required: true,
                    schema: { type: 'string' }
                }],
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
                                schema: { $ref: '#/components/schemas/Message' }
                            }
                        }
                    },
                    '403': {
                        description: 'Not a member of the group',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            },
            get: {
                tags: ['Messages'],
                security: [{ BearerAuth: [] }],
                summary: 'Get messages from a group',
                parameters: [
                    {
                        in: 'path',
                        name: 'groupId',
                        required: true,
                        schema: { type: 'string' }
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { 
                            type: 'integer',
                            default: 50
                        }
                    },
                    {
                        in: 'query',
                        name: 'before',
                        schema: { 
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                ],
                responses: {
                    '200': {
                        description: 'Messages retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Message' }
                                }
                            }
                        }
                    },
                    '403': {
                        description: 'Not a member of the group',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    }
                }
            }
        }
    }
};