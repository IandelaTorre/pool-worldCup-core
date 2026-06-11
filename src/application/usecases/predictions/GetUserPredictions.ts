import { PredictionRepository, PredictionFilters } from "../../../domain/interfaces/PredictionRepository.js";
import { PredictionWithRelations } from "../../../domain/entities/Prediction.js";

export class GetUserPredictions {
  constructor(private predictionRepository: PredictionRepository) {}

  async execute(
    groupId: string,
    userId: string,
    filters?: PredictionFilters,
    include?: string[]
  ): Promise<PredictionWithRelations[]> {
    return this.predictionRepository.findByGroup(
      groupId,
      { ...filters, userId },
      include
    );
  }
}
