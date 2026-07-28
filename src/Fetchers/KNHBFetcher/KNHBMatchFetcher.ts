import { Match } from "../../Objects/Match";
import { Competition } from "../../Objects/Competition";
import { Abbreviations } from "../../Utils/Abbreviations";
import { DateHelper } from "../../Utils/DateHelper";
import { KNHBFetcher } from "./KNHBFetcher";

export class KNHBMatchFetcher {
    /**
     * The fetcher class.
     * @protected
     */
    protected fetcher: KNHBFetcher;

    /**
     * Constructor for KNHBMatchFetcher.
     * @param fetcher
     */
    constructor(fetcher: KNHBFetcher) {
        this.fetcher = fetcher;
    }

    /**
     * Get the matches in a given competition.
     * @param competition The competition to get the matches for.
     */
    public async fetch(competition: Competition) {
        const matches: Map<string, Match> = new Map();

        const response = await this.fetcher.apiFetch(
            `/competitions/national/${competition.getID()}`)
            .then(data => data?.json());

        let index = 1;
        for (const poule of response.data.poules) {
            for (const match of poule.matches) {
                const item = this.createMatch(competition, match, index++);
                if (item)
                    matches.set(item.getID(), item);
            }
        }

        return matches;
    }

    /**
     * Create a match object from an FIH row.
     * @param competition
     * @param row
     * @param index
     */
    public createMatch(competition: Competition, row: KNHBCompetitionMatch,
                       index: number): Match | null {
        const object = new Match();
        object.setCompetition(competition);
        object.setIndex(index);
        object.setVenue(row.location.facility.address);

        object.setHomeTeam(String(row.home.id), row.home.name);
        object.setAwayTeam(String(row.away.id), row.away.name);

        // Add match ID.
        const id = String(row.id);
        if (!id) return this.fetcher.log(
            "error", "Skipping match, failed to get ID", {
                "index": `${index}`,
                "competition": competition.getID()
            });
        object.setID(id);

        // Add gender
        const gender =
            Abbreviations.getGender(competition.getType(), this.fetcher);
        if (!gender) return this.fetcher.log(
            "error", "Skipping match, failed to get gender", {
                "index": `${index}`,
                "competition": competition.getID()
            });
        object.setGender(gender);

        // Add date and time
        const utcDate =
            DateHelper.StringToUTC(row.date);
        object.setMatchDate(utcDate, true);

        // Add completed state
        if (row.status === "final") {
            object.setCompleted(true);
            object.setScore(
                `${row.score.home} - ${row.score.away}`);
        }

        return object;
    }
}

interface KNHBCompetitionMatch {
    id: number
    location: KNHBMatchLocation
    home: KNHBMatchTeam
    away: KNHBMatchTeam
    date: string
    status: "scheduled" | "final"
    score: KNHBMatchResult
}

interface KNHBMatchLocation {
    facility: KNHBMatchFacility
}

interface KNHBMatchFacility {
    address: string;
    name: string
}

interface KNHBMatchTeam {
    id: number;
    name: string
}

interface KNHBMatchResult {
    home: number
    away: number
}