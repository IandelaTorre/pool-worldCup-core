import { eq } from "drizzle-orm";
import { GroupRepository } from "../../../domain/interfaces/GroupRepository.js";
import { UserRepository } from "../../../domain/interfaces/UserRepository.js";
import {
  ConflictError,
  ValidationError,
} from "../../../domain/errors/domainErrors.js";
import { Group } from "../../../domain/entities/Group.js";
import { db } from "../../../infrastructure/database/connection.js";
import { scoringRuleTypes } from "../../../infrastructure/database/schema/index.js";

export interface CreateGroupDTO {
  name: string;
  createdById: string;
  maxMembers?: number;
}

export class CreateGroup {
  constructor(
    private groupRepository: GroupRepository,
    private userRepository: UserRepository
  ) {}

  async execute(data: CreateGroupDTO): Promise<Group> {
    const inviteCode = this.generateInviteCode();

    const group = await this.groupRepository.create({
      name: data.name,
      inviteCode,
      createdById: data.createdById,
      maxMembers: data.maxMembers || 20,
    });

    await this.groupRepository.addMember(group.id, data.createdById, "admin");

    const ruleTypes = await db.select().from(scoringRuleTypes);

    const defaultConfigs = ruleTypes.map((ruleType) => ({
      ruleTypeId: ruleType.id,
      points: ruleType.defaultPoints,
      enabled: true,
    }));

    await this.groupRepository.updateScoringConfig(group.id, defaultConfigs);

    return group;
  }

  private generateInviteCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
