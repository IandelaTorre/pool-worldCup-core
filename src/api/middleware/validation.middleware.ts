import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { ValidationError } from "../../domain/errors/domainErrors.js";

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        res.status(400).json({
          type: "https://httpstatuses.io/400",
          title: "VALIDATION",
          status: 400,
          detail: "Validation failed",
          requestId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          errors,
        });
      } else {
        next(error);
      }
    }
  };
};
