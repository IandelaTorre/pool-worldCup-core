import { eq, and } from "drizzle-orm";
import { db } from "../database/connection.js";
import { matches } from "../database/schema/index.js";
import { MatchRepository, MatchFilters } from "../../domain/interfaces/MatchRepository.js";
import { Match } from "../../domain/entities/Match.js";

export class DrizzleMatchRepository implements MatchRepository {
  async findById(id: string): Promise<Match | null> {
    const result = await db.query.matches.findFirst({
      where: eq(matches.id, id),
    });
    return result || null;
  }

  async findAll(filters?: MatchFilters): Promise<Match[]> {
    const conditions = [];

    if (filters?.groupName) {
      conditions.push(eq(matches.groupName, filters.groupName));
    }

    if (filters?.status) {
      conditions.push(eq(matches.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db.query.matches.findMany({
      where: whereClause,
      orderBy: (matches, { asc }) => [asc(matches.matchNumber)],
    });
    return result;
  }

  async findByGroup(groupName: string): Promise<Match[]> {
    const result = await db.query.matches.findMany({
      where: eq(matches.groupName, groupName),
      orderBy: (matches, { asc }) => [asc(matches.matchNumber)],
    });
    return result;
  }

  async create(
    matchData: Omit<Match, "id" | "createdAt">
  ): Promise<Match> {
    const result = await db
      .insert(matches)
      .values({
        matchNumber: matchData.matchNumber,
        groupName: matchData.groupName,
        teamHome: matchData.teamHome,
        teamAway: matchData.teamAway,
        matchDate: matchData.matchDate,
        scoreHome: matchData.scoreHome,
        scoreAway: matchData.scoreAway,
        status: matchData.status,
      })
      .returning();
    return result[0];
  }

  async updateResult(
    id: string,
    scoreHome: number,
    scoreAway: number
  ): Promise<Match> {
    const result = await db
      .update(matches)
      .set({ scoreHome, scoreAway, status: "finished" })
      .where(eq(matches.id, id))
      .returning();
    return result[0];
  }

  async updateStatus(
    id: string,
    status: "pending" | "in_progress" | "finished"
  ): Promise<Match> {
    const result = await db
      .update(matches)
      .set({ status })
      .where(eq(matches.id, id))
      .returning();
    return result[0];
  }
}
