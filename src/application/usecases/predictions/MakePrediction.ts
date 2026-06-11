import { PredictionRepository } from "../../../domain/interfaces/PredictionRepository.js";
import { MatchRepository } from "../../../domain/interfaces/MatchRepository.js";
import { GroupRepository } from "../../../domain/interfaces/GroupRepository.js";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from "../../../domain/errors/domainErrors.js";
import { Prediction } from "../../../domain/entities/Prediction.js";

export interface MakePredictionDTO {
  userId: string;
  matchId: string;
  groupId: string;
  predictionHome: number;
  predictionAway: number;
}

export class MakePrediction {
  constructor(
    private predictionRepository: PredictionRepository,
    private matchRepository: MatchRepository,
    private groupRepository: GroupRepository
  ) {}

  async execute(data: MakePredictionDTO): Promise<Prediction> {
    const match = await this.matchRepository.findById(data.matchId);
    if (!match) {
      throw new NotFoundError("Match", data.matchId);
    }

    const oneHourBeforeMatch = new Date(match.matchDate.getTime() - 60 * 60 * 1000);
    if (new Date() > oneHourBeforeMatch) {
      throw new ValidationError("Prediction deadline has passed (1 hour before match)");
    }

    const isMember = await this.groupRepository.isMember(data.groupId, data.userId);
    if (!isMember) {
      throw new ForbiddenError("You are not a member of this group");
    }

    const existingPrediction = await this.predictionRepository.findByUserAndMatch(
      data.userId,
      data.matchId,
      data.groupId
    );
    if (existingPrediction) {
      throw new ConflictError("You already have a prediction for this match");
    }

    if (match.status !== "pending") {
      throw new ValidationError("Cannot predict for matches that are not pending");
    }

    return this.predictionRepository.create({
      userId: data.userId,
      matchId: data.matchId,
      groupId: data.groupId,
      predictionHome: data.predictionHome,
      predictionAway: data.predictionAway,
    });
  }
}
