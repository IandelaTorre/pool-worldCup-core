export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  groupId: string;
  predictionHome: number;
  predictionAway: number;
  pointsEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PredictionWithRelations extends Prediction {
  user?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
  match?: {
    id: string;
    matchNumber: number;
    teamHome: string;
    teamAway: string;
    matchDate: Date;
    scoreHome: number | null;
    scoreAway: number | null;
    status: "pending" | "in_progress" | "finished";
  } | null;
  group?: {
    id: string;
    name: string;
  } | null;
}
