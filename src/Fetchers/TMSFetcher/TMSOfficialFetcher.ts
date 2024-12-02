import { Official } from "../../Objects/Official.js";
import { Competition } from "../../Objects/Competition.js";
import { HTMLElement, parse } from "node-html-parser";
import { APIHelper } from "../../Utils/APIHelper.js";
import { TMSFetcher } from "./TMSFetcher.js";

export class TMSOfficialFetcher {
    /**
     * The TMS fetcher class.
     * @protected
     */
    protected fetcher: TMSFetcher;

    /**
     * Constructor for TMSOfficialFetcher.
     * @param fetcher The TMS fetcher instance
     */
    constructor(fetcher: TMSFetcher) {
        this.fetcher = fetcher;
    }

    /**
     * Fetch officials data for a competition
     * @param competition The competition to fetch officials for
     */
    public async fetch(competition: Competition): Promise<Map<string, Official[]>> {
        const baseUrl = this.fetcher.getBaseURL();
        const competitionId = competition.getID();
        const url = `${baseUrl}/competitions/${competitionId}/officials`;

        const data = await APIHelper.fetch(url, this.fetcher);
        const html = parse(await data.text());

        return this.parseOfficialsHTML(html);
    }

    /**
     * Parse officials data from HTML
     * @param html The HTML document to parse
     */
    private parseOfficialsHTML(html: HTMLElement): Map<string, Official[]> {
        const officialsMap = new Map<string, Official[]>();
        const datePanes = html.querySelectorAll(".tab-pane");

        if (!datePanes || datePanes.length === 0) return officialsMap;

        for (const pane of datePanes) {
            this.parseOfficialPane(pane, officialsMap);
        }

        return officialsMap;
    }

    /**
     * Parse a single officials pane
     * @param pane The pane element to parse
     * @param officialsMap The map to store results in
     */
    private parseOfficialPane(
        pane: HTMLElement,
        officialsMap: Map<string, Official[]>
    ): void {
        const table = pane.querySelector("table");
        if (!table) return;

        const headers = table.querySelectorAll("tr:first-child th");
        const roleIndices = this.getRoleIndices(headers);
        const rows = table.querySelectorAll("tr:not(:first-child)");

        let currentMatchId: string | null = null;
        let officials: Official[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const matchCell = row.querySelector("td[rowspan=\"2\"] a[href]");

            if (matchCell) {
                if (currentMatchId && officials.length > 0) {
                    officialsMap.set(currentMatchId, [...officials]);
                }
                currentMatchId = matchCell.getAttribute("href").split("/").pop();
                officials = [];
            }

            if (!currentMatchId) continue;

            const newOfficials = this.parseOfficialRow(row, matchCell, roleIndices);
            officials.push(...newOfficials);
        }

        if (currentMatchId && officials.length > 0) {
            officialsMap.set(currentMatchId, [...officials]);
        }
    }

    /**
     * Get role indices from table headers
     * @param headers The header elements
     */
    private getRoleIndices(headers: HTMLElement[]): Map<string, number> {
        const roleIndices = new Map<string, number>();
        headers.forEach((header, index) => {
            const role = header.textContent.trim();
            if (role) roleIndices.set(role, index);
        });
        return roleIndices;
    }

    /**
     * Parse officials from a table row
     * @param row The row element
     * @param matchCell The match cell element if present
     * @param roleIndices Map of role names to column indices
     */
    private parseOfficialRow(
        row: HTMLElement,
        matchCell: HTMLElement | null,
        roleIndices: Map<string, number>
    ): Official[] {
        const officials: Official[] = [];
        const cells = row.querySelectorAll("td");

        const roleColumns = new Map([
            ["Umpires", "Umpire"],
            ["Reserve/Video", "Reserve/Video"],
            ["Scoring/Timing", "Scoring/Timing"],
            ["Technical Officer", "Technical Officer"]
        ]);

        for (const [columnHeader, officialRole] of roleColumns) {
            const index = roleIndices.get(columnHeader);
            if (index === undefined) continue;

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

        return officials;
    }
}