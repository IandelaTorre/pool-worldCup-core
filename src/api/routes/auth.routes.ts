import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validation.middleware.js";
import { DrizzleUserRepository } from "../../infrastructure/repositories/DrizzleUserRepository.js";
import { DrizzleRoleRepository } from "../../infrastructure/repositories/DrizzleRoleRepository.js";
import { JWTService } from "../../infrastructure/auth/JWTService.js";
import { RegisterUser } from "../../application/usecases/auth/RegisterUser.js";
import { LoginUser } from "../../application/usecases/auth/LoginUser.js";
import { successResponse } from "../middleware/responseFormatter.js";

const router = Router();
const userRepository = new DrizzleUserRepository();
const roleRepository = new DrizzleRoleRepository();
const jwtService = new JWTService();

const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(1).max(100),
  }),
});

const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1),
    password: z.string(),
  }),
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a new user account with basic information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, fullName]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict - email or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  const useCase = new RegisterUser(userRepository, roleRepository, jwtService);
  const result = await useCase.execute(req.body);
  res.status(201).json(successResponse(result, 201));
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     description: Authenticates a user with email or username and returns a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or username
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  const useCase = new LoginUser(userRepository, jwtService);
  const result = await useCase.execute(req.body);
  res.status(200).json(successResponse(result));
});

export default router;
