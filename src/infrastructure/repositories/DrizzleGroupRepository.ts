import { eq, and, sql } from "drizzle-orm";
import { db } from "../database/connection.js";
import {
  groups,
  groupMembers,
  groupScoringConfig,
  scoringRuleTypes,
  users,
  predictions,
  matches,
} from "../database/schema/index.js";
import {
  GroupRepository,
  LeaderboardEntry,
} from "../../domain/interfaces/GroupRepository.js";
import {
  Group,
  GroupMember,
  ScoringConfig,
  GroupWithRelations,
} from "../../domain/entities/Group.js";

export class DrizzleGroupRepository implements GroupRepository {
  async findById(
    id: string,
    include?: string[]
  ): Promise<GroupWithRelations | null> {
    const result = await db.query.groups.findFirst({
      where: eq(groups.id, id),
    });

    if (!result) return null;

    let group: GroupWithRelations = result;

    if (include?.includes("created_by")) {
      const creator = await db.query.users.findFirst({
        where: eq(users.id, result.createdById),
        columns: {
          id: true,
          username: true,
          email: true,
          fullName: true,
        },
      });
      group = { ...group, createdBy: creator };
    }

    if (include?.includes("members")) {
      const members = await db.query.groupMembers.findMany({
        where: eq(groupMembers.groupId, id),
      });
      group = { ...group, members };
    }

    if (include?.includes("scoring_config")) {
      const config = await this.getScoringConfig(id);
      group = { ...group, scoringConfig: config };
    }

    return group;
  }

  async findByInviteCode(code: string): Promise<Group | null> {
    const result = await db.query.groups.findFirst({
      where: eq(groups.inviteCode, code),
    });
    return result || null;
  }

  async create(
    groupData: Omit<Group, "id" | "createdAt">
  ): Promise<Group> {
    const result = await db
      .insert(groups)
      .values({
        name: groupData.name,
        inviteCode: groupData.inviteCode,
        createdById: groupData.createdById,
        maxMembers: groupData.maxMembers,
      })
      .returning();
    return result[0];
  }

  async addMember(
    groupId: string,
    userId: string,
    role: "admin" | "member"
  ): Promise<GroupMember> {
    await db.insert(groupMembers).values({ groupId, userId, role });
    return { groupId, userId, role, joinedAt: new Date() };
  }

  async getMembers(groupId: string): Promise<GroupMember[]> {
    const result = await db.query.groupMembers.findMany({
      where: eq(groupMembers.groupId, groupId),
    });
    return result;
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const result = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      ),
    });
    return !!result;
  }

  async getMemberRole(
    groupId: string,
    userId: string
  ): Promise<"admin" | "member" | null> {
    const result = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      ),
    });
    return result?.role || null;
  }

  async getScoringConfig(groupId: string): Promise<ScoringConfig[]> {
    const result = await db
      .select({
        groupId: groupScoringConfig.groupId,
        ruleTypeId: groupScoringConfig.ruleTypeId,
        points: groupScoringConfig.points,
        enabled: groupScoringConfig.enabled,
        ruleType: {
          id: scoringRuleTypes.id,
          code: scoringRuleTypes.code,
          name: scoringRuleTypes.name,
          description: scoringRuleTypes.description,
          defaultPoints: scoringRuleTypes.defaultPoints,
          createdAt: scoringRuleTypes.createdAt,
        },
      })
      .from(groupScoringConfig)
      .innerJoin(
        scoringRuleTypes,
        eq(groupScoringConfig.ruleTypeId, scoringRuleTypes.id)
      )
      .where(eq(groupScoringConfig.groupId, groupId));

    return result;
  }

  async updateScoringConfig(
    groupId: string,
    configs: { ruleTypeId: string; points: number; enabled: boolean }[]
  ): Promise<ScoringConfig[]> {
    for (const config of configs) {
      const existing = await db
        .select()
        .from(groupScoringConfig)
        .where(
          and(
            eq(groupScoringConfig.groupId, groupId),
            eq(groupScoringConfig.ruleTypeId, config.ruleTypeId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(groupScoringConfig)
          .set({
            points: config.points,
            enabled: config.enabled,
          })
          .where(
            and(
              eq(groupScoringConfig.groupId, groupId),
              eq(groupScoringConfig.ruleTypeId, config.ruleTypeId)
            )
          );
      } else {
        await db.insert(groupScoringConfig).values({
          groupId,
          ruleTypeId: config.ruleTypeId,
          points: config.points,
          enabled: config.enabled,
        });
      }
    }

    return this.getScoringConfig(groupId);
  }

  async getLeaderboard(groupId: string): Promise<LeaderboardEntry[]> {
    const result = await db
      .select({
        userId: users.id,
        username: users.username,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        totalPoints: sql<number>`COALESCE(SUM(CASE WHEN ${matches.status} = 'finished' THEN ${predictions.pointsEarned} ELSE 0 END), 0)`.as("total_points"),
        exactScores: sql<number>`COUNT(CASE WHEN ${matches.status} = 'finished' AND ${predictions.predictionHome} = ${matches.scoreHome} AND ${predictions.predictionAway} = ${matches.scoreAway} THEN 1 END)`.as("exact_scores"),
        correctWinners: sql<number>`COUNT(CASE WHEN ${matches.status} = 'finished' AND ((${predictions.predictionHome} > ${predictions.predictionAway} AND ${matches.scoreHome} > ${matches.scoreAway}) OR (${predictions.predictionHome} < ${predictions.predictionAway} AND ${matches.scoreHome} < ${matches.scoreAway}) OR (${predictions.predictionHome} = ${predictions.predictionAway} AND ${matches.scoreHome} = ${matches.scoreAway})) THEN 1 END)`.as("correct_winners"),
        correctDifferences: sql<number>`COUNT(CASE WHEN ${matches.status} = 'finished' AND (${predictions.predictionHome} - ${predictions.predictionAway}) = (${matches.scoreHome} - ${matches.scoreAway}) THEN 1 END)`.as("correct_differences"),
        correctTeamGoals: sql<number>`COUNT(CASE WHEN ${matches.status} = 'finished' AND (${predictions.predictionHome} = ${matches.scoreHome} OR ${predictions.predictionAway} = ${matches.scoreAway}) THEN 1 END)`.as("correct_team_goals"),
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .leftJoin(predictions, eq(groupMembers.userId, predictions.userId))
      .leftJoin(matches, eq(predictions.matchId, matches.id))
      .where(eq(groupMembers.groupId, groupId))
      .groupBy(users.id, users.username, users.fullName, users.avatarUrl)
      .orderBy(sql`total_points DESC`);

    return result;
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const result = await db
      .select({
        id: groups.id,
        name: groups.name,
        inviteCode: groups.inviteCode,
        createdById: groups.createdById,
        maxMembers: groups.maxMembers,
        createdAt: groups.createdAt,
      })
      .from(groups)
      .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .where(eq(groupMembers.userId, userId));
    return result;
  }
}
