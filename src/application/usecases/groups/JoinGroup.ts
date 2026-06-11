import { GroupRepository } from "../../../domain/interfaces/GroupRepository.js";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../../../domain/errors/domainErrors.js";
import { GroupMember } from "../../../domain/entities/Group.js";

export interface JoinGroupDTO {
  inviteCode: string;
  userId: string;
}

export class JoinGroup {
  constructor(private groupRepository: GroupRepository) {}

  async execute(data: JoinGroupDTO): Promise<GroupMember> {
    const group = await this.groupRepository.findByInviteCode(data.inviteCode);
    if (!group) {
      throw new NotFoundError("Group");
    }

    const isMember = await this.groupRepository.isMember(group.id, data.userId);
    if (isMember) {
      throw new ConflictError("You are already a member of this group");
    }

    const members = await this.groupRepository.getMembers(group.id);
    if (members.length >= group.maxMembers) {
      throw new ValidationError("Group is full");
    }

    return this.groupRepository.addMember(group.id, data.userId, "member");
  }
}
