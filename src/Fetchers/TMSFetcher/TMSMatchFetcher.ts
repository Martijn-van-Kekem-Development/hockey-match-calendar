import { Match, Official } from "../../Objects/Match.js";
import { HTMLElement, parse } from "node-html-parser";
import { Competition } from "../../Objects/Competition.js";
import { Abbreviations } from "../../Utils/Abbreviations.js";
import { DateHelper } from "../../Utils/DateHelper.js";
import { TMSFetcher } from "./TMSFetcher.js";
import { APIHelper } from "../../Utils/APIHelper";

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
        TMSMatchFetcher.parseTitle(object, link.textContent.trim());

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
        const timeZone = dateString.getAttribute("data-timezone");
        const utcDate =
            DateHelper.TMStoUTC(dateString.textContent, timeZone);
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
        const result = title
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .match(
                /^(?:([A-Za-z0-9/& -]+) )?v (?:([A-Za-z0-9/& -]+))?(?: \((.+)\))?$/);

            if (!result) {
                throw new Error("Couldn't extract data from match title: " + title);
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
        const officialsMap = new Map<string, Official[]>();
        const url = `${this.fetcher.getBaseURL()}/competitions/${competition.getID()}/officials`;
        const data = await APIHelper.fetch(url, this.fetcher);
        const html = parse(await data.text());

        const datePanes = html.querySelectorAll(".tab-pane");
        if (!datePanes || datePanes.length === 0) return officialsMap;

        for (const pane of datePanes) {
            const table = pane.querySelector("table");
            if (!table) continue;

            const headers = table.querySelectorAll("tr:first-child th");
            const roleIndices = new Map<string, number>();
            headers.forEach((header, index) => {
                const role = header.textContent.trim();
                if (role) roleIndices.set(role, index);
            });

            const rows = table.querySelectorAll("tr:not(:first-child)");
            let currentMatchId: string | null = null;
            let officials: Official[] = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const cells = row.querySelectorAll("td");

                // Check for new match
                const matchCell = row.querySelector("td[rowspan=\"2\"] a[href]");
                if (matchCell) {
                    if (currentMatchId && officials.length > 0) {
                        officialsMap.set(currentMatchId, [...officials]);
                    }
                    currentMatchId = matchCell.getAttribute("href").split("/").pop();
                    officials = [];
                }

                if (!currentMatchId) continue;

                // Process officials in this row
                const roleColumns = new Map([
                    ["Umpires", "Umpire"],
                    ["Reserve/Video", "Reserve/Video"],
                    ["Scoring/Timing", "Scoring/Timing"],
                    ["Technical Officer", "Technical Officer"]
                ]);

                for (const [columnHeader, officialRole] of roleColumns) {
                    const index = roleIndices.get(columnHeader);
                    if (index === undefined) continue;

                    // Account for rowspan offset in second row
                    const cellIndex = matchCell ? index : index - 2;
                    const cell = cells[cellIndex];
                    if (!cell) continue;

                    const officialLink = cell.querySelector("a");
                    if (!officialLink?.textContent?.trim()) continue;

                    const content = officialLink.textContent.trim();
                    const countryMatch = content.match(/\(([A-Z]{3})\)$/);
                    officials.push({
                        role: officialRole,
                        name: countryMatch
                            ? content.substring(0, content.lastIndexOf("(")).trim()
                            : content,
                        country: countryMatch ? countryMatch[1] : undefined
                    });
                }
            }

            // Save the last match's officials
            if (currentMatchId && officials.length > 0) {
                officialsMap.set(currentMatchId, [...officials]);
            }
        }

        return officialsMap;
    }
}