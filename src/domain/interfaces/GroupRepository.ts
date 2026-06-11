import { Group, GroupMember, ScoringConfig, GroupWithRelations } from "../entities/Group.js";

export interface GroupRepository {
  findById(id: string, include?: string[]): Promise<GroupWithRelations | null>;
  findByInviteCode(code: string): Promise<Group | null>;
  create(group: Omit<Group, "id" | "createdAt">): Promise<Group>;
  addMember(groupId: string, userId: string, role: "admin" | "member"): Promise<GroupMember>;
  getMembers(groupId: string): Promise<GroupMember[]>;
  isMember(groupId: string, userId: string): Promise<boolean>;
  getMemberRole(groupId: string, userId: string): Promise<"admin" | "member" | null>;
  getScoringConfig(groupId: string): Promise<ScoringConfig[]>;
  updateScoringConfig(groupId: string, configs: { ruleTypeId: string; points: number; enabled: boolean }[]): Promise<ScoringConfig[]>;
  getLeaderboard(groupId: string): Promise<LeaderboardEntry[]>;
  getUserGroups(userId: string): Promise<Group[]>;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
  correctDifferences: number;
  correctTeamGoals: number;
}
