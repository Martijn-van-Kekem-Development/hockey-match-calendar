import { Club, Match } from "./Objects/Match.js";
import * as fs from "fs/promises";
import { Fetcher } from "./Fetchers/Fetcher.js";

export class ICS {
    /**
     * The fetcher paths.
     * @private
     */
    private static fetchers: Map<string, FetcherData> = new Map();

    /**
     * Add a new fetcher.
     * @param club The club to add the fetcher to.
     * @param fetcher The fetcher to add.
     */
    public static addFetcher(club: Club | null, fetcher: Fetcher) {
        // Create fetcher if not exists.
        if (!this.fetchers.has(fetcher.getID()))
            this.fetchers.set(fetcher.getID(), {
                clubs: {},
                paths: []
            });

        // Create club if not exists.
        const fetcherData = this.fetchers.get(fetcher.getID());
        if (club && typeof fetcherData.clubs[club.id] === "undefined")
            this.fetchers.get(fetcher.getID()).clubs[club.id] = {
                id: club.id,
                name: club.name,
                paths: []
            };
    }

    /**
     * Write the ICS string to a file.
     * @param fetcher The fetcher
     * @param matches The matches to write.
     * @param title The ICS title.
     * @param fileName The file name without extension.
     * @param club The club to write for, or null if for all.
     * @param metadata Extra data to save.
     */
    public static async writeToFile(fetcher: Fetcher, matches: Match[],
                                    title: string, fileName: string,
                                    club: Club | null, metadata: Metadata) {

        const outputFile = `docs/ics/${fetcher.getID()}/${fileName}.ics`;
        const outputFolder =
            outputFile.split("/").slice(0, -1).join("/");
        const icsString = ICS.calendarToICS(title, fileName, matches);

        await fs.mkdir(outputFolder, { recursive: true });
        await fs.writeFile(outputFile, icsString, { flag: "w+" });
        this.addFetcher(club, fetcher);

        // Add path to correct club
        const pathArray =
            club === null
            ? this.fetchers.get(fetcher.getID()).paths
            : this.fetchers.get(fetcher.getID()).clubs[club.id].paths;

        pathArray.push({
            name: title,
            path: outputFile.split("/").slice(1).join("/"),
            ...metadata
        });
    }

    /**
     * Store the file paths in a JSON file.
     * @param fetcher The fetcher to store the paths for.
     */
    public static async storeFilePaths(fetcher: Fetcher) {
        if (!this.fetchers.has(fetcher.getID())) {
            fetcher.log("warn", "No file paths to store.", {
                "fetcher": fetcher.getID()
            });
            return;
        }

        const pathJson = JSON.stringify({
            lastUpdate: (new Date()).getTime(),
            ...this.fetchers.get(fetcher.getID()),
        });

        await fs.writeFile(
            `docs/ics/${fetcher.getID()}/paths.json`, pathJson);
    }

    /**
     * Convert a calendar to the ICS format.
     * @param title The calendar title.
     * @param path The calendar path.
     * @param matches The matches to include in this calendar.
     */
    public static calendarToICS(title: string, path: string,
                                matches: Match[]): string {

        const content: string[] = [];

        content.push("BEGIN:VCALENDAR");
        content.push("VERSION:2.0");
        content.push("PRODID:-//mvk-development//" +
            `hockey-match-calendar//${path}//EN`);
        content.push(`URL:https://hockeycal.vankekem.com/ics/${path}.ics`);
        content.push(`NAME:${title} | Hockey Match Calendar`);
        content.push(`X-WR-CALNAME:${title} | Hockey Match Calendar`);
        content.push("DESCRIPTION:Hockey match calendar generated by https://hockeycal.vankekem.com\\nCopyright (C) 2024 - Martijn van Kekem Development");
        content.push("X-ALT-DESC;FMTTYPE=text/html:Hockey match calendar generated by <a href=\"https://hockeycal.vankekem.com\">https://hockeycal.vankekem.com</a><br>Copyright &copy; 2024 - Martijn van Kekem Development");
        content.push("X-WR-CALDESC:Hockey match calendar generated by https://hockeycal.vankekem.com\\nCopyright (C) 2024 - Martijn van Kekem Development");
        content.push("REFRESH-INTERVAL;VALUE=DURATION:PT1H");
        content.push("X-PUBLISHED-TTL:PT1H");
        content.push("METHOD:PUBLISH");

        for (const match of matches) {
            content.push(...ICS.matchToICS(match));
        }

        content.push("END:VCALENDAR");

        return this.formatLines(content);
    }

    /**
     * Get the ICS string for a given match.
     * @param match The match object to convert.
     */
    public static matchToICS(match: Match): string[] {
        const content: string[] = [];

        content.push("BEGIN:VEVENT");
        content.push(...Object.entries(match.getICSAttributes()).map(
            ([key, val]) => `${key}:${val}`));
        content.push("END:VEVENT");

        return content;
    }

    /**
     * Parse the content lines to an ICS-safe string.
     * @param content The content lines.
     */
    static formatLines(content: string[]): string {
        let parsed = [...content];

        for (let i = parsed.length - 1; i >= 0; i--) {
            if (parsed[i].length <= 75) continue;
            let line = parsed[i];

            const parts = [line.slice(0, 74)];
            line = line.slice(74);

            // Do for every line that is too long.
            while (line.length >= 75) {
                parts.push(" "  + line.slice(0, 73));
                line = line.slice(73);
            }

            parsed = [
                ...parsed.slice(0, i),
                ...parts, " " + line,
                ...parsed.slice(i + 1)
            ];
        }

        return parsed.join("\r\n");
    }
}

export interface FetcherData {
    paths: Metadata[],
    clubs: Record<string, FetcherClub>
}

export interface FetcherClub {
    id: string,
    name: string,
    paths: Metadata[]
}

export interface Metadata {
    name?: string,
    type?: "total" | "competition",
    index?: number,
    path?: string,
    count?: number

}