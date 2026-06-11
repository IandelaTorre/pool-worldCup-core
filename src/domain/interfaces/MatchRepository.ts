import { Match, MatchWithRelations } from "../entities/Match.js";

export interface MatchRepository {
  findById(id: string): Promise<Match | null>;
  findAll(filters?: MatchFilters): Promise<Match[]>;
  findByGroup(groupName: string): Promise<Match[]>;
  create(match: Omit<Match, "id" | "createdAt">): Promise<Match>;
  updateResult(id: string, scoreHome: number, scoreAway: number): Promise<Match>;
  updateStatus(id: string, status: "pending" | "in_progress" | "finished"): Promise<Match>;
}

export interface MatchFilters {
  groupName?: string;
  status?: "pending" | "in_progress" | "finished";
  matchDate?: Date;
}
