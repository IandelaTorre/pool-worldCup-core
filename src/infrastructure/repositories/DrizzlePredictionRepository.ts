import { eq, and } from "drizzle-orm";
import { db } from "../database/connection.js";
import {
  predictions,
  users,
  matches,
  groups,
} from "../database/schema/index.js";
import {
  PredictionRepository,
  PredictionFilters,
} from "../../domain/interfaces/PredictionRepository.js";
import { Prediction, PredictionWithRelations } from "../../domain/entities/Prediction.js";

export class DrizzlePredictionRepository implements PredictionRepository {
  async findById(
    id: string,
    include?: string[]
  ): Promise<PredictionWithRelations | null> {
    const result = await db.query.predictions.findFirst({
      where: eq(predictions.id, id),
    });

    if (!result) return null;

    let prediction: PredictionWithRelations = result;

    if (include?.includes("user")) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, result.userId),
        columns: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
      });
      prediction = { ...prediction, user };
    }

    if (include?.includes("match")) {
      const match = await db.query.matches.findFirst({
        where: eq(matches.id, result.matchId),
      });
      prediction = { ...prediction, match };
    }

    if (include?.includes("group")) {
      const group = await db.query.groups.findFirst({
        where: eq(groups.id, result.groupId),
        columns: { id: true, name: true },
      });
      prediction = { ...prediction, group };
    }

    return prediction;
  }

  async findByUserAndMatch(
    userId: string,
    matchId: string,
    groupId: string
  ): Promise<Prediction | null> {
    const result = await db.query.predictions.findFirst({
      where: and(
        eq(predictions.userId, userId),
        eq(predictions.matchId, matchId),
        eq(predictions.groupId, groupId)
      ),
    });
    return result || null;
  }

  async findByGroup(
    groupId: string,
    filters?: PredictionFilters,
    include?: string[]
  ): Promise<PredictionWithRelations[]> {
    const conditions = [eq(predictions.groupId, groupId)];

    if (filters?.userId) {
      conditions.push(eq(predictions.userId, filters.userId));
    }

    if (filters?.matchId) {
      conditions.push(eq(predictions.matchId, filters.matchId));
    }

    let query = db
      .select({
        id: predictions.id,
        userId: predictions.userId,
        matchId: predictions.matchId,
        groupId: predictions.groupId,
        predictionHome: predictions.predictionHome,
        predictionAway: predictions.predictionAway,
        pointsEarned: predictions.pointsEarned,
        createdAt: predictions.createdAt,
        updatedAt: predictions.updatedAt,
      })
      .from(predictions)
      .innerJoin(matches, eq(predictions.matchId, matches.id))
      .where(and(...conditions));

    const results = await query;

    let predictionsWithRelations: PredictionWithRelations[] = results.map(
      (r) => ({ ...r, match: undefined, user: undefined, group: undefined })
    );

    if (include?.includes("user") || include?.includes("match") || include?.includes("group")) {
      for (let i = 0; i < predictionsWithRelations.length; i++) {
        const p = predictionsWithRelations[i];

        if (include.includes("user")) {
          const user = await db.query.users.findFirst({
            where: eq(users.id, p.userId),
            columns: { id: true, username: true, fullName: true, avatarUrl: true },
          });
          predictionsWithRelations[i] = { ...p, user };
        }

        if (include.includes("match")) {
          const match = await db.query.matches.findFirst({
            where: eq(matches.id, p.matchId),
          });
          predictionsWithRelations[i] = { ...predictionsWithRelations[i], match };
        }

        if (include.includes("group")) {
          const group = await db.query.groups.findFirst({
            where: eq(groups.id, p.groupId),
            columns: { id: true, name: true },
          });
          predictionsWithRelations[i] = { ...predictionsWithRelations[i], group };
        }
      }
    }

    if (filters?.matchStatus) {
      const matchIds = predictionsWithRelations
        .filter((p) => p.match?.status === filters.matchStatus)
        .map((p) => p.id);
      predictionsWithRelations = predictionsWithRelations.filter((p) =>
        matchIds.includes(p.id)
      );
    }

    return predictionsWithRelations;
  }

  async create(
    predictionData: Omit<Prediction, "id" | "createdAt" | "updatedAt" | "pointsEarned">
  ): Promise<Prediction> {
    const result = await db
      .insert(predictions)
      .values({
        userId: predictionData.userId,
        matchId: predictionData.matchId,
        groupId: predictionData.groupId,
        predictionHome: predictionData.predictionHome,
        predictionAway: predictionData.predictionAway,
      })
      .returning();
    return result[0];
  }

  async update(id: string, data: Partial<Prediction>): Promise<Prediction> {
    const result = await db
      .update(predictions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(predictions.id, id))
      .returning();
    return result[0];
  }

  async updatePoints(id: string, points: number): Promise<Prediction> {
    const result = await db
      .update(predictions)
      .set({ pointsEarned: points, updatedAt: new Date() })
      .where(eq(predictions.id, id))
      .returning();
    return result[0];
  }

  async getGroupPredictions(groupId: string): Promise<Prediction[]> {
    const result = await db.query.predictions.findMany({
      where: eq(predictions.groupId, groupId),
    });
    return result;
  }

  async findByMatchId(matchId: string): Promise<Prediction[]> {
    const result = await db.query.predictions.findMany({
      where: eq(predictions.matchId, matchId),
    });
    return result;
  }
}
