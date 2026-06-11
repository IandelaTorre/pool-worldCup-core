import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./api/routes/auth.routes.js";
import groupsRoutes from "./api/routes/groups.routes.js";
import predictionsRoutes from "./api/routes/predictions.routes.js";
import matchesRoutes from "./api/routes/matches.routes.js";
import { errorHandler } from "./api/middleware/errorHandler.js";
import { pool } from "./infrastructure/database/connection.js";
import { swaggerSpec } from "./api/swagger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Quiniela Mundial API",
}));

app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/predictions", predictionsRoutes);
app.use("/api/matches", matchesRoutes);

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Check API health status
 *     description: Returns the health status of the API and database connection
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     service:
 *                       type: string
 *                       example: quiniela-mundial-api
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 *                     database:
 *                       type: string
 *                       example: connected
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       503:
 *         description: Service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      data: {
        status: "ok",
        service: "quiniela-mundial-api",
        version: "1.0.0",
        database: "connected",
      },
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(503).json({
      type: "https://httpstatuses.io/503",
      title: "SERVICE_UNAVAILABLE",
      status: 503,
      detail: "Database connection failed",
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    });
  }
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
});

export default app;
