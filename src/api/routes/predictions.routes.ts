import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validation.middleware.js";
import { authMiddleware, requireGroupMembership } from "../middleware/auth.middleware.js";
import { DrizzlePredictionRepository } from "../../infrastructure/repositories/DrizzlePredictionRepository.js";
import { DrizzleMatchRepository } from "../../infrastructure/repositories/DrizzleMatchRepository.js";
import { DrizzleGroupRepository } from "../../infrastructure/repositories/DrizzleGroupRepository.js";
import { MakePrediction } from "../../application/usecases/predictions/MakePrediction.js";
import { EditPrediction } from "../../application/usecases/predictions/EditPrediction.js";
import { successResponse } from "../middleware/responseFormatter.js";

const router = Router();
const predictionRepository = new DrizzlePredictionRepository();
const matchRepository = new DrizzleMatchRepository();
const groupRepository = new DrizzleGroupRepository();

router.use(authMiddleware);

const makePredictionSchema = z.object({
  body: z.object({
    matchId: z.string().uuid(),
    groupId: z.string().uuid(),
    predictionHome: z.number().min(0).max(20),
    predictionAway: z.number().min(0).max(20),
  }),
});

const editPredictionSchema = z.object({
  body: z.object({
    predictionHome: z.number().min(0).max(20),
    predictionAway: z.number().min(0).max(20),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * @openapi
 * /api/predictions:
 *   post:
 *     tags: [Predictions]
 *     summary: Create a new prediction
 *     description: Creates a prediction for a match in a group. Must be before match deadline (1 hour before).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [matchId, groupId, predictionHome, predictionAway]
 *             properties:
 *               matchId:
 *                 type: string
 *                 format: uuid
 *               groupId:
 *                 type: string
 *                 format: uuid
 *               predictionHome:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 20
 *                 example: 2
 *               predictionAway:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 20
 *                 example: 1
 *     responses:
 *       201:
 *         description: Prediction created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Prediction'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or deadline passed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a member of this group
 *       409:
 *         description: Prediction already exists for this match
 */
router.post("/", validate(makePredictionSchema), async (req: Request, res: Response) => {
  const useCase = new MakePrediction(predictionRepository, matchRepository, groupRepository);
  const prediction = await useCase.execute({
    userId: req.user!.sub,
    ...req.body,
  });
  res.status(201).json(successResponse(prediction, 201));
});

/**
 * @openapi
 * /api/predictions/{id}:
 *   put:
 *     tags: [Predictions]
 *     summary: Update a prediction
 *     description: Updates an existing prediction. Must be before match deadline.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [predictionHome, predictionAway]
 *             properties:
 *               predictionHome:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 20
 *                 example: 3
 *               predictionAway:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 20
 *                 example: 0
 *     responses:
 *       200:
 *         description: Prediction updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Prediction'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or deadline passed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not your prediction
 *       404:
 *         description: Prediction not found
 */
router.put("/:id", validate(editPredictionSchema), async (req: Request, res: Response) => {
  const useCase = new EditPrediction(predictionRepository, matchRepository);
  const prediction = await useCase.execute({
    userId: req.user!.sub,
    predictionId: req.params.id,
    ...req.body,
  });
  res.status(200).json(successResponse(prediction));
});

/**
 * @openapi
 * /api/predictions/group/{groupId}:
 *   get:
 *     tags: [Predictions]
 *     summary: Get predictions by group
 *     description: Returns all predictions for a specific group with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: match_status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, finished]
 *         description: Filter by match status
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *         description: Comma-separated relations to include (match, user, group)
 *         example: "match,user"
 *     responses:
 *       200:
 *         description: Predictions retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Prediction'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a member of this group
 */
router.get("/group/:groupId", requireGroupMembership, async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { match_status, include } = req.query;

  const filters: any = {};
  if (match_status) {
    filters.matchStatus = match_status;
  }

  const includeArray = include ? (include as string).split(",") : [];

  const predictions = await predictionRepository.findByGroup(
    groupId,
    filters,
    includeArray
  );

  res.status(200).json(successResponse(predictions));
});

/**
 * @openapi
 * /api/predictions/user/{userId}/group/{groupId}:
 *   get:
 *     tags: [Predictions]
 *     summary: Get user predictions in a group
 *     description: Returns all predictions for a specific user in a group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *         description: Comma-separated relations to include (match, group)
 *         example: "match,group"
 *     responses:
 *       200:
 *         description: User predictions retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Prediction'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a member of this group
 */
router.get("/user/:userId/group/:groupId", requireGroupMembership, async (req: Request, res: Response) => {
  const { userId, groupId } = req.params;
  const { include } = req.query;

  const includeArray = include ? (include as string).split(",") : [];

  const predictions = await predictionRepository.findByGroup(
    groupId,
    { userId },
    includeArray
  );

  res.status(200).json(successResponse(predictions));
});

/**
 * @openapi
 * /api/predictions/{id}:
 *   get:
 *     tags: [Predictions]
 *     summary: Get prediction by ID
 *     description: Returns a single prediction with optional related data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *         description: Comma-separated relations to include (user, match, group)
 *         example: "user,match,group"
 *     responses:
 *       200:
 *         description: Prediction retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Prediction'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Prediction not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const { include } = req.query;
  const includeArray = include ? (include as string).split(",") : [];

  const prediction = await predictionRepository.findById(req.params.id, includeArray);
  if (!prediction) {
    return res.status(404).json({
      type: "https://httpstatuses.io/404",
      title: "NOT_FOUND",
      status: 404,
      detail: "Prediction not found",
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    });
  }
  res.status(200).json(successResponse(prediction));
});

export default router;
