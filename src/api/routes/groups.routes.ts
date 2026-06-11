import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validation.middleware.js";
import { authMiddleware, requireGroupMembership } from "../middleware/auth.middleware.js";
import { DrizzleGroupRepository } from "../../infrastructure/repositories/DrizzleGroupRepository.js";
import { DrizzleUserRepository } from "../../infrastructure/repositories/DrizzleUserRepository.js";
import { CreateGroup } from "../../application/usecases/groups/CreateGroup.js";
import { JoinGroup } from "../../application/usecases/groups/JoinGroup.js";
import { GetGroupLeaderboard } from "../../application/usecases/groups/GetGroupLeaderboard.js";
import { successResponse } from "../middleware/responseFormatter.js";

const router = Router();
const groupRepository = new DrizzleGroupRepository();
const userRepository = new DrizzleUserRepository();

router.use(authMiddleware);

const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    maxMembers: z.number().min(2).max(100).optional(),
  }),
});

const joinGroupSchema = z.object({
  body: z.object({
    inviteCode: z.string().length(8),
  }),
});

/**
 * @openapi
 * /api/groups/me:
 *   get:
 *     tags: [Groups]
 *     summary: Get my groups
 *     description: Returns all groups the authenticated user belongs to
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User groups retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/me", async (req: Request, res: Response) => {
  const groups = await groupRepository.getUserGroups(req.user!.sub);
  res.status(200).json(successResponse(groups));
});

/**
 * @openapi
 * /api/groups/{id}:
 *   get:
 *     tags: [Groups]
 *     summary: Get group by ID
 *     description: Returns a group with optional related data
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
 *         description: Comma-separated relations to include (created_by, members, scoring_config)
 *         example: "created_by,members,scoring_config"
 *     responses:
 *       200:
 *         description: Group found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/GroupWithRelations'
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
 *       404:
 *         description: Group not found
 */
router.get("/:id", requireGroupMembership, async (req: Request, res: Response) => {
  const { id } = req.params;
  const include = req.query.include ? (req.query.include as string).split(",") : [];
  const group = await groupRepository.findById(id, include);
  res.status(200).json(successResponse(group));
});

/**
 * @openapi
 * /api/groups:
 *   post:
 *     tags: [Groups]
 *     summary: Create a new group
 *     description: Creates a new betting group and adds the creator as admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Friends Group
 *               maxMembers:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 100
 *                 default: 20
 *     responses:
 *       201:
 *         description: Group created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Group'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", validate(createGroupSchema), async (req: Request, res: Response) => {
  const useCase = new CreateGroup(groupRepository, userRepository);
  const group = await useCase.execute({
    ...req.body,
    createdById: req.user!.sub,
  });
  res.status(201).json(successResponse(group, 201));
});

/**
 * @openapi
 * /api/groups/join:
 *   post:
 *     tags: [Groups]
 *     summary: Join a group
 *     description: Joins an existing group using an invite code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [inviteCode]
 *             properties:
 *               inviteCode:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 8
 *                 example: ABC12345
 *     responses:
 *       201:
 *         description: Joined group successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     groupId:
 *                       type: string
 *                       format: uuid
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     role:
 *                       type: string
 *                       enum: [admin, member]
 *                     joinedAt:
 *                       type: string
 *                       format: date-time
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error or group is full
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       409:
 *         description: Already a member of this group
 */
router.post("/join", validate(joinGroupSchema), async (req: Request, res: Response) => {
  const useCase = new JoinGroup(groupRepository);
  const member = await useCase.execute({
    inviteCode: req.body.inviteCode,
    userId: req.user!.sub,
  });
  res.status(201).json(successResponse(member, 201));
});

/**
 * @openapi
 * /api/groups/{id}/leaderboard:
 *   get:
 *     tags: [Groups]
 *     summary: Get group leaderboard
 *     description: Returns the leaderboard with points for all members in the group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Leaderboard retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
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
 *       404:
 *         description: Group not found
 */
router.get("/:id/leaderboard", requireGroupMembership, async (req: Request, res: Response) => {
  const useCase = new GetGroupLeaderboard(groupRepository);
  const leaderboard = await useCase.execute(req.params.id);
  res.status(200).json(successResponse(leaderboard));
});

/**
 * @openapi
 * /api/groups/{id}/scoring-config:
 *   get:
 *     tags: [Groups]
 *     summary: Get group scoring configuration
 *     description: Returns the scoring configuration with rule types for a specific group
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Scoring config retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScoringConfig'
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
 *       404:
 *         description: Group not found
 */
router.get("/:id/scoring-config", requireGroupMembership, async (req: Request, res: Response) => {
  const config = await groupRepository.getScoringConfig(req.params.id);
  res.status(200).json(successResponse(config));
});

/**
 * @openapi
 * /api/groups/{id}/scoring-config:
 *   put:
 *     tags: [Groups]
 *     summary: Update group scoring configuration
 *     description: Updates the scoring configuration for a group (admin only)
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
 *             required: [configs]
 *             properties:
 *               configs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [ruleTypeId, points, enabled]
 *                   properties:
 *                     ruleTypeId:
 *                       type: string
 *                       format: uuid
 *                     points:
 *                       type: integer
 *                       minimum: 0
 *                     enabled:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Scoring config updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScoringConfig'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not an admin of this group
 *       404:
 *         description: Group not found
 */
router.put("/:id/scoring-config", requireGroupMembership, async (req: Request, res: Response) => {
  const role = await groupRepository.getMemberRole(req.params.id, req.user!.sub);
  if (role !== "admin") {
    return res.status(403).json({
      type: "https://httpstatuses.io/403",
      title: "FORBIDDEN",
      status: 403,
      detail: "Only group admins can update scoring configuration",
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    });
  }

  const config = await groupRepository.updateScoringConfig(req.params.id, req.body.configs);
  res.status(200).json(successResponse(config));
});

export default router;
