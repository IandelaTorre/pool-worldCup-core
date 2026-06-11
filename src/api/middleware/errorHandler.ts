import { Request, Response, NextFunction } from "express";
import { DomainError } from "../../domain/errors/domainErrors.js";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", error);

  if (error instanceof DomainError) {
    res.status(error.statusCode).json({
      type: `https://httpstatuses.io/${error.statusCode}`,
      title: error.code,
      status: error.statusCode,
      detail: error.message,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(500).json({
      type: "https://httpstatuses.io/500",
      title: "INTERNAL_ERROR",
      status: 500,
      detail: "Internal server error",
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    });
  }
};
