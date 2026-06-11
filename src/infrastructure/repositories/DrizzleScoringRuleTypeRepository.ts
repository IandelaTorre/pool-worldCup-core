import { eq } from "drizzle-orm";
import { db } from "../database/connection.js";
import { scoringRuleTypes } from "../database/schema/index.js";
import { ScoringRuleType } from "../../domain/entities/Group.js";

export interface ScoringRuleTypeRepository {
  findById(id: string): Promise<ScoringRuleType | null>;
  findByCode(code: string): Promise<ScoringRuleType | null>;
  findAll(): Promise<ScoringRuleType[]>;
}

export class DrizzleScoringRuleTypeRepository implements ScoringRuleTypeRepository {
  async findById(id: string): Promise<ScoringRuleType | null> {
    const result = await db.query.scoringRuleTypes.findFirst({
      where: eq(scoringRuleTypes.id, id),
    });
    return result || null;
  }

  async findByCode(code: string): Promise<ScoringRuleType | null> {
    const result = await db.query.scoringRuleTypes.findFirst({
      where: eq(scoringRuleTypes.code, code),
    });
    return result || null;
  }

  async findAll(): Promise<ScoringRuleType[]> {
    const result = await db.query.scoringRuleTypes.findMany();
    return result;
  }
}
