import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validation.middleware.js";
import { authMiddleware, requireRole } from "../middleware/auth.middleware.js";
import { DrizzleMatchRepository } from "../../infrastructure/repositories/DrizzleMatchRepository.js";
import { DrizzlePredictionRepository } from "../../infrastructure/repositories/DrizzlePredictionRepository.js";
import { DrizzleGroupRepository } from "../../infrastructure/repositories/DrizzleGroupRepository.js";
import { UpdateMatchResult } from "../../application/usecases/matches/UpdateMatchResult.js";
import { successResponse } from "../middleware/responseFormatter.js";

const router = Router();
const matchRepository = new DrizzleMatchRepository();
const predictionRepository = new DrizzlePredictionRepository();
const groupRepository = new DrizzleGroupRepository();

/**
 * @openapi
 * /api/matches:
 *   get:
 *     tags: [Matches]
 *     summary: Get all matches
 *     description: Returns a list of matches with optional filters
 *     parameters:
 *       - in: query
 *         name: group_name
 *         schema:
 *           type: string
 *           enum: [A, B, C, D, E, F, G, H]
 *         description: Filter by group letter
 *         example: A
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, finished]
 *         description: Filter by match status
 *         example: pending
 *     responses:
 *       200:
 *         description: Matches retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Match'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get("/", async (req: Request, res: Response) => {
  const { group_name, status } = req.query;
  const filters: any = {};

  if (group_name) {
    filters.groupName = group_name;
  }

  if (status) {
    filters.status = status;
  }

  const matches = await matchRepository.findAll(filters);
  res.status(200).json(successResponse(matches));
});

/**
 * @openapi
 * /api/matches/{id}:
 *   get:
 *     tags: [Matches]
 *     summary: Get match by ID
 *     description: Returns a single match
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Match retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Match'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Match not found
 */
router.get("/:id", async (req: Request, res: Response) => {
  const match = await matchRepository.findById(req.params.id);
  if (!match) {
    return res.status(404).json({
      type: "https://httpstatuses.io/404",
      title: "NOT_FOUND",
      status: 404,
      detail: "Match not found",
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    });
  }
  res.status(200).json(successResponse(match));
});

const updateResultSchema = z.object({
  body: z.object({
    scoreHome: z.number().min(0).max(20),
    scoreAway: z.number().min(0).max(20),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

/**
 * @openapi
 * /api/matches/{id}/result:
 *   put:
 *     tags: [Matches]
 *     summary: Update match result
 *     description: Updates the final score of a match and calculates points for all predictions. Admin only.
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
 *             required: [scoreHome, scoreAway]
 *             properties:
 *               scoreHome:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 20
 *                 description: Goals scored by home team
 *                 example: 2
 *               scoreAway:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 20
 *                 description: Goals scored by away team
 *                 example: 1
 *     responses:
 *       200:
 *         description: Match result updated and points calculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Match'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or match already finished
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Match not found
 */
router.put(
  "/:id/result",
  authMiddleware,
  requireRole("admin"),
  validate(updateResultSchema),
  async (req: Request, res: Response) => {
    const useCase = new UpdateMatchResult(
      matchRepository,
      predictionRepository,
      groupRepository
    );
    const match = await useCase.execute({
      matchId: req.params.id,
      ...req.body,
    });
    res.status(200).json(successResponse(match));
  }
);

export default router;
