import { Match, Prediction, User } from "../../domain/entities/index.js";

export class PointsCalculator {
  calculatePoints(
    prediction: Prediction,
    match: Match,
    rules: {
      exactScore: number;
      winner: number;
      goalDifference: number;
      teamGoals: number;
    }
  ): number {
    if (!match.scoreHome || !match.scoreAway) {
      return 0;
    }

    let points = 0;

    if (
      prediction.predictionHome === match.scoreHome &&
      prediction.predictionAway === match.scoreAway
    ) {
      points += rules.exactScore;
    }

    const predictedWinner = prediction.predictionHome - prediction.predictionAway;
    const actualWinner = match.scoreHome - match.scoreAway;

    if (
      (predictedWinner > 0 && actualWinner > 0) ||
      (predictedWinner < 0 && actualWinner < 0) ||
      (predictedWinner === 0 && actualWinner === 0)
    ) {
      points += rules.winner;
    }

    if (predictedWinner === actualWinner) {
      points += rules.goalDifference;
    }

    if (
      prediction.predictionHome === match.scoreHome ||
      prediction.predictionAway === match.scoreAway
    ) {
      points += rules.teamGoals;
    }

    return points;
  }
}
