import { Competition } from "../../Objects/Competition.js";
import { Club, Match } from "../../Objects/Match.js";
import { KNHBFetcher } from "./KNHBFetcher.js";
import { DateHelper } from "../../Utils/DateHelper.js";
import { APIHelper } from "../../Utils/APIHelper.js";
import { Abbreviations } from "../../Utils/Abbreviations.js";

export class KNHBMatchFetcher {
    /**
     * The KNHB fetcher class.
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
     * @param type The type of matches to fetch.
     * @param competition The competition to get the matches for.
     */
    public async fetch(type: "upcoming" | "official", competition: Competition) {
        const matches: Map<string, Match> = new Map();
        let index = 1;
        let page = 1;

        while (true) {
            const json = await this.makeRequest(type, page, competition);

            for (const match of json.data) {
                const item =
                    this.createMatch(competition, match, index++);
                matches.set(item.getID(), item);
            }

            if (json.links.next) page++;
            else break;
        }

        return matches;
    }

    /**
     * Make a request to the web server.
     * @param type The type of matches to fetch.
     * @param page The page number to fetch.
     * @param competition The competition to fetch the matches for.
     * @private
     */
    private async makeRequest(type: "upcoming" | "official", page: number,
                              competition: Competition) {

        const data = await APIHelper.fetch(this.fetcher.getBaseURL() +
            `/competitions/${competition.getID()}/matches/${type}?page=${page}`,
            this.fetcher);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let result: any;
        try {
            result = await data.json();
        } catch {
            this.fetcher.log("error", "Failed to parse JSON.");
            this.fetcher.log("error", await data.text());
            throw new Error();
        }

        if (type === "official" && result.data) {
            result.data = result.data.sort(
                (a: { datetime: string }, b: { datetime: string }) =>
                    // Sort in ascending order by datetime.
                    (new Date(a.datetime).getTime()) -
                    (new Date(b.datetime).getTime()
                ));
        }
        return result;
    }

    /**
     * Create a match object from an KNHB row.
     * @param competition
     * @param match
     * @param index
     */
    public createMatch(competition: Competition, match: KNHBMatch,
                       index: number): Match {

        const object = new Match();
        object.setCompetition(competition);
        object.setID(match.id);
        object.setIndex(index);
        object.setIncludeIndex(false);
        object.setVenue(match.location.description);

        // Add date
        const utcDate = DateHelper.KNHBtoUTC(match.datetime);
        const localDate = DateHelper.KNHBtoLocal(match.datetime);
        if (localDate.hours() === 0 && localDate.minutes() === 0)
            // Time unknown.
            object.setMatchDate(utcDate, false);
        else
            object.setMatchDate(utcDate, true);

        // Add teams
        const clubs = this.fetcher.getClubs();
        const homeClub: Club = match.home_team.club_name === null ? null : {
            id: clubs.get(match.home_team.club_name).id.toLowerCase(),
            name: match.home_team.club_name
        };
        const awayClub: Club = match.away_team.club_name === null ? null : {
            id: clubs.get(match.away_team.club_name).id.toLowerCase(),
            name: match.away_team.club_name
        };
        object.setHomeTeam(match.home_team.id, match.home_team.name, homeClub);
        object.setAwayTeam(match.away_team.id, match.away_team.name, awayClub);

        // Add gender
        const gender = Abbreviations.getGender(competition.getName(), this.fetcher);
        object.setGender(gender);

        // Add completed state
        if (match.status === "Official") {
            object.setCompleted(true);
            if (match.home_score && match.away_score) {
                let scoreString = `${match.home_score} - ${match.away_score}`;
                if (match.home_shootout && match.away_shootout) {
                    scoreString +=
                        ` (${match.home_shootout} - ${match.away_shootout} SO)`;
                }

                object.setScore(scoreString);
            }
        }

        return object;
    }
}

interface KNHBMatch {
    id: string,
    location: KNHBLocation,
    home_score?: number,
    home_shootout?: number,
    home_team: KNHBTeam,
    away_score?: number,
    away_shootout?: number,
    away_team: KNHBTeam,
    datetime: string,
    status: "Official" | "Upcoming"
}

interface KNHBLocation {
    city?: string,
    street?: string,
    house_number: string,
    description?: string
}

interface KNHBTeam {
    club_name: string,
    id: string,
    name: string,
}