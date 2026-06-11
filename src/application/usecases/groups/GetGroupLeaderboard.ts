import { GroupRepository } from "../../../domain/interfaces/GroupRepository.js";
import { LeaderboardEntry } from "../../../domain/interfaces/GroupRepository.js";
import { NotFoundError } from "../../../domain/errors/domainErrors.js";

export class GetGroupLeaderboard {
  constructor(private groupRepository: GroupRepository) {}

  async execute(groupId: string): Promise<LeaderboardEntry[]> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError("Group", groupId);
    }

    return this.groupRepository.getLeaderboard(groupId);
  }
}
