import { PredictionRepository } from "../../../domain/interfaces/PredictionRepository.js";
import { MatchRepository } from "../../../domain/interfaces/MatchRepository.js";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../../../domain/errors/domainErrors.js";
import { Prediction } from "../../../domain/entities/Prediction.js";

export interface EditPredictionDTO {
  userId: string;
  predictionId: string;
  predictionHome: number;
  predictionAway: number;
}

export class EditPrediction {
  constructor(
    private predictionRepository: PredictionRepository,
    private matchRepository: MatchRepository
  ) {}

  async execute(data: EditPredictionDTO): Promise<Prediction> {
    const prediction = await this.predictionRepository.findById(data.predictionId);
    if (!prediction) {
      throw new NotFoundError("Prediction", data.predictionId);
    }

    if (prediction.userId !== data.userId) {
      throw new ForbiddenError("You can only edit your own predictions");
    }

    const match = await this.matchRepository.findById(prediction.matchId);
    if (!match) {
      throw new NotFoundError("Match", prediction.matchId);
    }

    const oneHourBeforeMatch = new Date(match.matchDate.getTime() - 60 * 60 * 1000);
    if (new Date() > oneHourBeforeMatch) {
      throw new ValidationError("Cannot edit prediction after deadline");
    }

    if (match.status !== "pending") {
      throw new ValidationError("Cannot edit prediction for matches that are not pending");
    }

    return this.predictionRepository.update(data.predictionId, {
      predictionHome: data.predictionHome,
      predictionAway: data.predictionAway,
    });
  }
}
