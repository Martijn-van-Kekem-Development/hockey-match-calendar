import { Match } from "../../Objects/Match.js";
import { HTMLElement, parse } from "node-html-parser";
import { Competition } from "../../Objects/Competition.js";
import { Abbreviations } from "../../Utils/Abbreviations.js";
import { DateHelper } from "../../Utils/DateHelper.js";
import { APIHelper } from "../../Utils/APIHelper";
import { FIHFetcher } from "./FIHFetcher.js";
import { Gender } from "../../Objects/Gender.js";

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
        const data = await APIHelper.fetch(`${this.fetcher.getBaseURL()}/${
                this.getMatchesPath(competition)}`, this.fetcher, data => {
            // On redirect, append schedules path if not the case.
            const url = new URL(data.url);
            const newPath = data.headers.get("location");
            if (!newPath.endsWith("schedule-fixtures-results"))
                url.pathname = `${newPath}/schedule-fixtures-results`;
            else
                url.pathname = newPath;

            return url.toString();
        });

        const html = parse(await data.text());

        // Get match JSON.
        const json = this.extractJSONFromHTML(html);
        if (!json) return matches;

        // Create match from every row.
        for (const row of json.matches) {
            const item = this.createMatch(competition, row, index++);
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
        if (!id) throw new Error("Failed to get ID for match.");
        else object.setID(id);

        // Add gender
        const gender =
            Abbreviations.getGender(competition.getType(), this.fetcher);
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

        this.fetcher.log("error", "Couldn't get matches for competition. Skipping.");
        return null;
    }

    /**
     * Get the URL to fetch the matches from.
     * @param competition The competition to fetch for.
     * @private
     */
    private getMatchesPath(competition: Competition) {
        const title = competition.getName().toLowerCase()
            .replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");

        const gender =
            Abbreviations.getGender(competition.getType(), this.fetcher);

        let genderString = "other";
        if (gender == Gender.MEN) genderString = "men";
        else if (gender == Gender.WOMEN) genderString = "women";

        return `events/others/${genderString}/${
            title}-${competition.getID()}/schedule-fixtures-results`;
    }
}

interface FIHCompetitionMatch {
    start_date: string;
    gender: string;
    game_id: string;
    event_state: string;
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