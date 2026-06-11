import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Quiniela Mundial API",
      version: "1.0.0",
      description: "API para quiniela del mundial con arquitectura hexagonal",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            data: {
              description: "Response data (object or array)",
            },
            metadata: {
              type: "object",
              properties: {
                timestamp: {
                  type: "string",
                  format: "date-time",
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            type: {
              type: "string",
              example: "https://httpstatuses.io/400",
            },
            title: {
              type: "string",
              example: "VALIDATION",
            },
            status: {
              type: "integer",
              example: 400,
            },
            detail: {
              type: "string",
              example: "Validation failed",
            },
            requestId: {
              type: "string",
              format: "uuid",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                  },
                  message: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            username: {
              type: "string",
            },
            email: {
              type: "string",
              format: "email",
            },
            fullName: {
              type: "string",
            },
            avatarUrl: {
              type: "string",
              nullable: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: {
              $ref: "#/components/schemas/User",
            },
            token: {
              type: "string",
            },
          },
        },
        Group: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
            },
            inviteCode: {
              type: "string",
            },
            createdById: {
              type: "string",
              format: "uuid",
            },
            maxMembers: {
              type: "integer",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        GroupWithRelations: {
          allOf: [
            { $ref: "#/components/schemas/Group" },
            {
              type: "object",
              properties: {
                createdBy: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    username: { type: "string" },
                    email: { type: "string" },
                    fullName: { type: "string" },
                  },
                },
                members: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      groupId: { type: "string", format: "uuid" },
                      userId: { type: "string", format: "uuid" },
                      role: { type: "string", enum: ["admin", "member"] },
                      joinedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
                scoringRules: {
                  type: "object",
                  properties: {
                    groupId: { type: "string", format: "uuid" },
                    exactScore: { type: "integer" },
                    winner: { type: "integer" },
                    goalDifference: { type: "integer" },
                    teamGoals: { type: "integer" },
                  },
                },
              },
            },
          ],
        },
        Match: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            matchNumber: {
              type: "integer",
            },
            groupName: {
              type: "string",
              example: "A",
            },
            teamHome: {
              type: "string",
            },
            teamAway: {
              type: "string",
            },
            matchDate: {
              type: "string",
              format: "date-time",
            },
            scoreHome: {
              type: "integer",
              nullable: true,
            },
            scoreAway: {
              type: "integer",
              nullable: true,
            },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "finished"],
            },
          },
        },
        Prediction: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            userId: {
              type: "string",
              format: "uuid",
            },
            matchId: {
              type: "string",
              format: "uuid",
            },
            groupId: {
              type: "string",
              format: "uuid",
            },
            predictionHome: {
              type: "integer",
            },
            predictionAway: {
              type: "integer",
            },
            pointsEarned: {
              type: "integer",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        LeaderboardEntry: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              format: "uuid",
            },
            username: {
              type: "string",
            },
            fullName: {
              type: "string",
            },
            avatarUrl: {
              type: "string",
              nullable: true,
            },
            totalPoints: {
              type: "integer",
            },
            exactScores: {
              type: "integer",
            },
            correctWinners: {
              type: "integer",
            },
            correctDifferences: {
              type: "integer",
            },
            correctTeamGoals: {
              type: "integer",
            },
          },
        },
        ScoringRules: {
          type: "object",
          properties: {
            groupId: {
              type: "string",
              format: "uuid",
            },
            exactScore: {
              type: "integer",
              description: "Points for exact score prediction",
              example: 3,
            },
            winner: {
              type: "integer",
              description: "Points for correct winner/draw",
              example: 1,
            },
            goalDifference: {
              type: "integer",
              description: "Points for correct goal difference",
              example: 1,
            },
            teamGoals: {
              type: "integer",
              description: "Points for correct team goals",
              example: 1,
            },
          },
        },
      },
    },
  },
  apis: ["./src/api/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
