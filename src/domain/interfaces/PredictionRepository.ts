import { Prediction, PredictionWithRelations } from "../entities/Prediction.js";

export interface PredictionRepository {
  findById(id: string, include?: string[]): Promise<PredictionWithRelations | null>;
  findByUserAndMatch(userId: string, matchId: string, groupId: string): Promise<Prediction | null>;
  findByGroup(groupId: string, filters?: PredictionFilters, include?: string[]): Promise<PredictionWithRelations[]>;
  create(prediction: Omit<Prediction, "id" | "createdAt" | "updatedAt" | "pointsEarned">): Promise<Prediction>;
  update(id: string, data: Partial<Prediction>): Promise<Prediction>;
  updatePoints(id: string, points: number): Promise<Prediction>;
  getGroupPredictions(groupId: string): Promise<Prediction[]>;
  findByMatchId(matchId: string): Promise<Prediction[]>;
}

export interface PredictionFilters {
  matchStatus?: "pending" | "in_progress" | "finished";
  userId?: string;
  matchId?: string;
}
