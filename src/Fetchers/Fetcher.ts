import {Competition} from "../Objects/Competition.js";
import {Match} from "../Objects/Match.js";

export abstract class Fetcher {
    /**
     * Get the base URL for this fetcher.
     */
    public abstract getBaseURL(): string;

    /**
     * Fetch the competitions and map them by their ID.
     */
    public abstract fetchCompetitions(): Promise<Map<string, Competition>>;

    /**
     * Fetch the matches by a competition.
     * @param competition The competition.
     */
    public abstract fetchMatches(competition: Competition): Promise<Map<string, Match>>;

    /**
     * Specifies what description to append to each match event when this fetcher is used.
     * @param competition The competition object.
     * @param match The match object.
     * @param html Whether to add HTML.
     */
    public abstract descriptionToAppend(competition: Competition, match: Match, html: boolean): string[];
}