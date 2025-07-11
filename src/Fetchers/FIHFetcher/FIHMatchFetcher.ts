import { Match } from "../../Objects/Match.js";
import { HTMLElement, parse } from "node-html-parser";
import { Competition } from "../../Objects/Competition.js";
import { Abbreviations } from "../../Utils/Abbreviations.js";
import { DateHelper } from "../../Utils/DateHelper.js";
import { APIHelper } from "../../Utils/APIHelper";
import { FIHFetcher } from "./FIHFetcher.js";
import { FIHCompetitionFetcher } from "./FIHCompetitionFetcher.js";

export class FIHMatchFetcher {
    /**
     * The FIH fetcher class.
     * @protected
     */
    protected fetcher: FIHFetcher;

    /**
     * Constructor for FIHMatchFetcher.
     * @param fetcher
     */
    constructor(fetcher: FIHFetcher) {
        this.fetcher = fetcher;
    }

    /**
     * Get the matches in a given competition.
     * @param competition The competition to get the matches for.
     */
    public async fetch(competition: Competition) {
        const matches: Map<string, Match> = new Map();
        let index = 1;

        // Get data from FIH.
        const data = await APIHelper.fetch(`${FIHCompetitionFetcher
            .getCompetitionPath(competition)}/schedule-fixtures-results`,
            this.fetcher, data => {

            // On redirect, append schedules path if not the case.
            const url = new URL(data.url);
            const newPath = data.headers.get("location");
            if (!newPath.endsWith("schedule-fixtures-results"))
                url.pathname = `${newPath}/schedule-fixtures-results`;
            else
                url.pathname = newPath;

            return url.toString();
        });

        if (!data) {
            this.fetcher.log("error", "Fetching matches failed.", {
                "competition": competition.getID()
            });

            return matches;
        }

        const html = parse(await data.text());

        // Get match JSON.
        const json = this.extractJSONFromHTML(html);
        if (!json) {
            this.fetcher.log("error", "Couldn't get matches for competition.", {
                "competition": competition.getID(),
            });
            return matches;
        }

        // Create match from every row.
        for (const row of json.matches) {
            const item = this.createMatch(competition, row, index++);
            if (item)
                matches.set(item.getID(), item);
        }

        return matches;
    }

    /**
     * Create a match object from an FIH row.
     * @param competition
     * @param row
     * @param index
     */
    public createMatch(competition: Competition, row: FIHCompetitionMatch,
                       index: number): Match {
        const object = new Match();
        object.setCompetition(competition);
        object.setType(row.event_stage ?? "");
        object.setIndex(index);
        object.setVenue(row.venue_name);
        object.setMetadata("sr_game_id", row.sr_game_id);

        const homeTeam = row.participants[0] ?? {
            id: "tbd",
            short_name: "TBD"
        };
        object.setHomeTeam(homeTeam.id, homeTeam.short_name);

        const awayTeam = row.participants[1] ?? {
            id: "tbd",
            short_name: "TBD"
        };
        object.setAwayTeam(awayTeam.id, awayTeam.short_name);

        // Add match ID.
        const id = row.game_id;
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
            DateHelper.StringToUTC(row.start_date);
        object.setMatchDate(utcDate, true);

        // Add completed state
        if (row.event_state === "R") {
            object.setCompleted(true);
            object.setScore(
                `${row.participants[0].value} - ${row.participants[1].value}`);
        }

        return object;
    }

    /**
     * Extract JSON from HTML
     * @param html
     * @private
     */
    private extractJSONFromHTML(html: HTMLElement) {
        const scriptTags = html.querySelectorAll("script[data-n-head=\"ssr\"]");
        for (const tag of scriptTags) {
            const tagContent = tag.textContent.trim();
            const matches =
            [...tagContent.matchAll(/window.fixtureWidgetData = '(.*)'/gs)];

            if (!matches || matches.length === 0 || matches[0].length === 0) {
                continue;
            }

            const text = matches[0][1].replace(/\\/g, "");
            return JSON.parse(text);
        }

        return null;
    }

    /**
     * Get the URL of a given match.
     * @param competition The competition.
     * @param match The match.
     * @private
     */
    public static getMatchPath(competition: Competition, match: Match) {
        const baseUrl = FIHCompetitionFetcher.getCompetitionPath(competition);

        const matchCenterID = match.getMetadata("sr_game_id") ?? "";
        const title = `${match.getHomeTeam(true)}-vs-${
            match.getAwayTeam(true)}-${match.getID()}`.toLowerCase()
            .replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");

        return `${baseUrl}/live-scores/${title}?matchcenter=${matchCenterID}`;
    }
}

interface FIHCompetitionMatch {
    start_date: string;
    gender: string;
    game_id: string;
    event_state: string;
    sr_game_id: string;
    event_stage: string;
    venue_name: string;
    participants: FIHMatchParticipant[]
}

interface FIHMatchParticipant {
    name: string;
    short_name: string;
    value: string; // Score
    id: string;
}