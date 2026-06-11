import { MatchRepository } from "../../../domain/interfaces/MatchRepository.js";
import { PredictionRepository } from "../../../domain/interfaces/PredictionRepository.js";
import { GroupRepository } from "../../../domain/interfaces/GroupRepository.js";
import { NotFoundError, ValidationError } from "../../../domain/errors/domainErrors.js";
import { Match } from "../../../domain/entities/Match.js";

export interface UpdateMatchResultDTO {
  matchId: string;
  scoreHome: number;
  scoreAway: number;
}

export class UpdateMatchResult {
  constructor(
    private matchRepository: MatchRepository,
    private predictionRepository: PredictionRepository,
    private groupRepository: GroupRepository
  ) {}

  async execute(data: UpdateMatchResultDTO): Promise<Match> {
    const match = await this.matchRepository.findById(data.matchId);
    if (!match) {
      throw new NotFoundError("Match", data.matchId);
    }

    if (match.status === "finished") {
      throw new ValidationError("Match is already finished");
    }

    const updatedMatch = await this.matchRepository.updateResult(
      data.matchId,
      data.scoreHome,
      data.scoreAway
    );

    await this.calculatePoints(data.matchId, data.scoreHome, data.scoreAway);

    return updatedMatch;
  }

  private async calculatePoints(
    matchId: string,
    actualHome: number,
    actualAway: number
  ): Promise<void> {
    const predictions = await this.predictionRepository.findByMatchId(matchId);

    for (const prediction of predictions) {
      const scoringConfig = await this.groupRepository.getScoringConfig(prediction.groupId);

      const getPoints = (ruleCode: string): number => {
        const config = scoringConfig.find(
          (c) => c.ruleType?.code === ruleCode && c.enabled
        );
        return config?.points || 0;
      };

      let points = 0;

      const predictedWinner = prediction.predictionHome - prediction.predictionAway;
      const actualWinner = actualHome - actualAway;

      if (prediction.predictionHome === actualHome && prediction.predictionAway === actualAway) {
        points += getPoints("exact_score");
      }

      if (
        (predictedWinner > 0 && actualWinner > 0) ||
        (predictedWinner < 0 && actualWinner < 0) ||
        (predictedWinner === 0 && actualWinner === 0)
      ) {
        points += getPoints("winner");
      }

      if (predictedWinner === actualWinner) {
        points += getPoints("goal_difference");
      }

      if (prediction.predictionHome === actualHome || prediction.predictionAway === actualAway) {
        points += getPoints("team_goals");
      }

      await this.predictionRepository.updatePoints(prediction.id, points);
    }
  }
}
