import { Match } from "../../Objects/Match.js";
import { HTMLElement, parse } from "node-html-parser";
import { Competition } from "../../Objects/Competition.js";
import { Abbreviations } from "../../Utils/Abbreviations.js";
import { DateHelper } from "../../Utils/DateHelper.js";
import { AltiusFetcher } from "./AltiusFetcher.js";
import { APIHelper } from "../../Utils/APIHelper";
import { Official } from "../../Objects/Official.js";

export class AltiusMatchFetcher {
    /**
     * The Altius fetcher class.
     * @protected
     */
    protected fetcher: AltiusFetcher;

    /**
     * Constructor for AltiusCompetitionFetcher.
     * @param fetcher
     */
    constructor(fetcher: AltiusFetcher) {
        this.fetcher = fetcher;
    }

    /**
     * Get the matches in a given competition.
     * @param competition The competition to get the matches for.
     */
    public async fetch(competition: Competition) {
        const matches: Map<string, Match> = new Map();

        // Get data from Altius.
        const data =
            await APIHelper.fetch(`${this.fetcher.getBaseURL()}/competitions/${
                competition.getID()}/matches`,
                this.fetcher);
        const html = parse(await data.text());
        const rows = html.querySelectorAll(".tab-content table tbody tr");

        // Check no results
        if (rows.length === 1 && rows[0].innerText.trim() === "No results")
            return matches;

        // Create match from every row.
        for (const row of rows) {
            const item = this.createMatch(competition, row);
            matches.set(item.getID(), item);
        }

        // Fetch officials data
        const officials = await this.fetchOfficials(competition);

        // Add officials to matches
        for (const [matchId, match] of matches) {
            const matchOfficials = officials.get(matchId);
            if (matchOfficials) {
                matchOfficials.forEach(official => {
                    match.addOfficial(
                        official.role,
                        official.name,
                        official.country
                    );
                });
            }
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
        if (!link)
            throw new Error(`Can't fetch title from ${competition.getID()}`);
        AltiusMatchFetcher.parseTitle(object, link.textContent.trim());

        // Add match ID.
        const id =
            link.getAttribute("href").split("/").slice(-1)[0] ?? null;
        if (!id)
            throw new Error("Failed to get ID for match.");
        else object.setID(id);

        // Add match index
        const indexEl = row.querySelector("td:nth-child(1)");
        const indexVal = indexEl.textContent.replaceAll(/[^0-9]/g, "");
        object.setIndex(Number(indexVal));

        // Add gender
        const gender =
            Abbreviations.getGender(competition.getType(), this.fetcher);
        object.setGender(gender);

        // Add date and time
        const dateString =
            row.querySelector("td:nth-child(2) span[data-timezone]");
        const venueString =
            row.querySelector("td:nth-child(6)").textContent;
        const timeZone = dateString.getAttribute("data-timezone");
        const utcDate =
            DateHelper.AltiusToUTC(dateString.textContent, timeZone, venueString);
        object.setMatchDate(utcDate, true);

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
    public static parseTitle(object: Match, title: string) {
        const string = title
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        let result = string.match(
            /^(?:([A-Za-z0-9\/&'() -]+) )?v ([A-Za-z0-9\/&'() -]+)? \((.+)\)$/);

        if (!result) {
            result = string.match(
                /^(?:([A-Za-z0-9/&'() -]+) )?v ([A-Za-z0-9/&'() -]+)?$/);

            if (!result) {
                throw new Error("Couldn't extract data from match title: " + title);
            }
        }

        const home = result[1]?.trim() || "TBC";
        const away = result[2]?.trim() || "TBC";
        const matchType = result[3] ?? "";

        object.setHomeTeam(home.toLowerCase(), home);
        object.setAwayTeam(away.toLowerCase(), away);
        object.setType(matchType);
    }

    /**
     * Fetch officials data for a competition
     * @param competition The competition to fetch officials for
     */
    public async fetchOfficials(
        competition: Competition
    ): Promise<Map<string, Official[]>> {
        return this.fetcher.fetchOfficials(competition);
    }
}