export interface Match {
  id: string;
  matchNumber: number;
  groupName: string;
  stage: string;
  teamHome: string;
  teamHomeIso2: string | null;
  teamHomeNameEn: string | null;
  teamHomeFlagUrl: string | null;
  teamAway: string;
  teamAwayIso2: string | null;
  teamAwayNameEn: string | null;
  teamAwayFlagUrl: string | null;
  matchDate: Date;
  venue: string | null;
  city: string | null;
  countryHost: string | null;
  scoreHome: number | null;
  scoreAway: number | null;
  status: "pending" | "in_progress" | "finished";
  createdAt: Date;
}

export interface MatchWithRelations extends Match {
  predictions?: Prediction[];
}

import { Prediction } from "./Prediction.js";
