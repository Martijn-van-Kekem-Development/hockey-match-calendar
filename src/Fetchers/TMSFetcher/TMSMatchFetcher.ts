import {Match} from "../../Objects/Match.js";
import {HTMLElement, parse} from "node-html-parser";
import {Competition} from "../../Objects/Competition.js";
import {Abbreviations} from "../../Utils/Abbreviations.js";
import {DateHelper} from "../../Utils/DateHelper.js";
import {TMSFetcher} from "./TMSFetcher.js";

export class TMSMatchFetcher {
    /**
     * The TMS fetcher class.
     * @protected
     */
    protected fetcher: TMSFetcher;

    /**
     * Constructor for TMSCompetitionFetcher.
     * @param fetcher
     */
    constructor(fetcher: TMSFetcher) {
        this.fetcher = fetcher;
    }

    /**
     * Get the matches in a given competition.
     * @param competition The competition to get the matches for.
     */
    public async fetch(competition: Competition) {
        const matches: Map<string, Match> = new Map();

        // Get data from TMS.
        const data = await fetch(`${this.fetcher.getBaseURL()}/competitions/${competition.getID()}/matches`);
        const html = parse(await data.text());
        const rows = html.querySelectorAll(".tab-content table tbody tr");

        // Check no results
        if (rows.length === 1 && rows[0].innerText.trim() === "No results") return matches;

        // Create match from every row.
        for (const row of rows) {
            const item = this.createMatch(competition, row);
            matches.set(item.getID(), item);
        }

        return matches;
    }

    /**
     * Create a match object from an FIH row.
     * @param competition
     * @param row
     */
    public createMatch(competition: Competition, row: HTMLElement): Match {
        const object = new Match();
        object.setCompetition(competition);

        const link = row.querySelector("td:nth-child(3) a[href]");
        if (!link) throw new Error(`Can't fetch title from ${competition.getID()}`);
        this.parseTitle(object, link.textContent.trim());

        // Add match ID.
        const id = link.getAttribute("href").split("/").slice(-1)[0] ?? null;
        if (!id) throw new Error("Failed to get ID for match.");
        else object.setID(id);

        // Add match index
        const index = row.querySelector("td:nth-child(1)");
        object.setIndex(Number(index.textContent.trim()));

        // Add gender
        const gender = Abbreviations.getGender(competition.getType(), this.fetcher);
        object.setGender(gender);

        // Add date and time
        const dateString = row.querySelector("td:nth-child(2) span[data-timezone]");
        object.setMatchDate(DateHelper.TMStoUTC(dateString.textContent, dateString.getAttribute("data-timezone")));

        // Add completed state
        const status = row.querySelector("td:nth-child(5)");
        if (status.textContent.toLowerCase().trim() === "official") {
            object.setCompleted(true);
            const score = row.querySelector("td:nth-child(4)");
            object.setScore(score.textContent.trim());
        }

        // Add venue
        const venue = row.querySelector("td:nth-child(6)");
        object.setVenue(venue.textContent.trim());

        return object;
    }

    /**
     * Parse the title.
     * @param object The match object.
     * @param title The title to parse
     */
    parseTitle(object: Match, title: string) {
        const result = title
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .match(/([A-Za-z0-9/ -]+) v ([A-Za-z0-9/ -]+)(?: \((.+)\))?$/);

        if (!result) throw new Error("Couldn't extract data from match title: " + title);

        const [, home, away, matchType] = result;
        object.setHomeTeam(home.toLowerCase(), home);
        object.setAwayTeam(away.toLowerCase(), away);
        object.setType(matchType ?? "");
    }
}