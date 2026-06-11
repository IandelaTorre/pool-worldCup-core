import { Request, Response, NextFunction } from "express";
import { JWTService, TokenPayload } from "../../infrastructure/auth/JWTService.js";
import { UnauthorizedError, ForbiddenError } from "../../domain/errors/domainErrors.js";
import { DrizzleUserRepository } from "../../infrastructure/repositories/DrizzleUserRepository.js";
import { DrizzleGroupRepository } from "../../infrastructure/repositories/DrizzleGroupRepository.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

const jwtService = new JWTService();
const userRepository = new DrizzleUserRepository();
const groupRepository = new DrizzleGroupRepository();

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.split(" ")[1];
    const payload = jwtService.verifyToken(token);

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(error.statusCode).json({
        type: `https://httpstatuses.io/${error.statusCode}`,
        title: error.code,
        status: error.statusCode,
        detail: error.message,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(401).json({
        type: "https://httpstatuses.io/401",
        title: "UNAUTHORIZED",
        status: 401,
        detail: "Invalid token",
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      });
    }
  }
};

export const requireRole = (roleName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Not authenticated");
      }

      const roles = await userRepository.getRoles(req.user.sub);
      const hasRole = roles.some((r) => r.name === roleName);

      if (!hasRole) {
        throw new ForbiddenError(`Role ${roleName} required`);
      }

      next();
    } catch (error) {
      if (error instanceof ForbiddenError) {
        res.status(error.statusCode).json({
          type: `https://httpstatuses.io/${error.statusCode}`,
          title: error.code,
          status: error.statusCode,
          detail: error.message,
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        });
      } else {
        next(error);
      }
    }
  };
};

export const requireGroupMembership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Not authenticated");
    }

    const groupId = req.params.groupId || req.body.groupId;

    if (groupId) {
      const isMember = await groupRepository.isMember(groupId, req.user.sub);
      if (!isMember) {
        throw new ForbiddenError("You are not a member of this group");
      }
    }

    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      res.status(error.statusCode).json({
        type: `https://httpstatuses.io/${error.statusCode}`,
        title: error.code,
        status: error.statusCode,
        detail: error.message,
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      });
    } else {
      next(error);
    }
  }
};
