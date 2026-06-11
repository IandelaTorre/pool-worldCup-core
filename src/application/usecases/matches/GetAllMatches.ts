import { MatchRepository } from "../../../domain/interfaces/MatchRepository.js";
import { MatchFilters } from "../../../domain/interfaces/MatchRepository.js";
import { Match } from "../../../domain/entities/Match.js";

export class GetAllMatches {
  constructor(private matchRepository: MatchRepository) {}

  async execute(filters?: MatchFilters): Promise<Match[]> {
    return this.matchRepository.findAll(filters);
  }
}
