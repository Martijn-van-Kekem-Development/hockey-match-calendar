import {Match} from "./Objects/Match.js";
import * as fs from "fs/promises";
import {Fetcher} from "./Fetchers/Fetcher.js";

export class ICS {

    /**
     * The available countries.
     * @private
     */
    private static countries: Map<string, CountryData> = new Map();

    /**
     * Add a new fetcher.
     * @param country The country to add the fetcher to.
     * @param fetcher The fetcher to add.
     */
    public static addFetcher(country: string, fetcher: Fetcher) {
        // Create country if not exists.
        if (!this.countries.has(country))
            this.countries.set(country, {
                total: [],
                origins: {}
            });

        if (fetcher && !this.countries.get(country).origins[fetcher.getID()]) {
            this.countries.get(country).origins[fetcher.getID()] = {
                name: fetcher.getName(),
                id: fetcher.getID(),
                paths: []
            };
        }
    }

    /**
     * Write the ICS string to a file.
     * @param fetcher The fetcher
     * @param ics The ICS content.
     * @param title The ICS title.
     * @param fileName The file name without extension.
     * @param country The country to write for, or null if for all.
     * @param metadata Extra data to save.
     */
    public static async writeToFile(fetcher: Fetcher, ics: string, title: string, fileName: string, country: string | null, metadata: Metadata) {
        country = country ?? "all_countries";
        const outputFile = `docs/ics/${fileName}.ics`;
        const outputFolder = outputFile.split("/").slice(0, -1).join("/");
        await fs.mkdir(outputFolder, {recursive: true});
        await fs.writeFile(outputFile, ics, {flag: "w+"});

        this.addFetcher(country, fetcher);

        // Add path to correct country
        const pathArray = fetcher === null ?
            this.countries.get(country).total :
            this.countries.get(country).origins[fetcher.getID()].paths;

        pathArray.push({
            name: title,
            path: outputFile.split("/").slice(1).join("/"),
            ...metadata
        });
    }

    /**
     * Store the file paths in a JSON file.
     */
    public static async storeFilePaths() {
        const allCountries = this.countries.get("all_countries");
        this.countries.delete("all_countries");
        await fs.writeFile("docs/files.json", JSON.stringify({
            lastUpdate: (new Date()).getTime(),
            ...allCountries,
            countries: Object.fromEntries(this.countries)
        }));
    }

    /**
     * Convert a calendar to the ICS format.
     * @param title The calendar title.
     * @param path The calendar path.
     * @param matches The matches to include in this calendar.
     */
    public static calendarToICS(title: string, path: string, matches: Match[]): string {
        const content: string[] = [];

        content.push("BEGIN:VCALENDAR");
        content.push("VERSION:2.0");
        content.push(`PRODID:-//mvk-development//hockey-match-calendar//${path}//EN`);
        content.push(`URL:https://hockeycal.vankekem.com/ics/${path}.ics`)
        content.push(`NAME:${title} | Hockey Match Calendar`);
        content.push(`X-WR-CALNAME:${title} | Hockey Match Calendar`);
        content.push(`DESCRIPTION:Hockey match calendar generated by https://hockeycal.vankekem.com\nCopyright (C) 2024 - Martijn van Kekem Development`);
        content.push(`X-ALT-DESC;FMTTYPE=text/html:Hockey match calendar generated by <a href="https://hockeycal.vankekem.com">https://hockeycal.vankekem.com</a><br>Copyright &copy; 2024 - Martijn van Kekem Development`);
        content.push(`X-WR-CALDESC:Hockey match calendar generated by https://hockeycal.vankekem.com\nCopyright (C) 2024 - Martijn van Kekem Development`);
        content.push(`REFRESH-INTERVAL;VALUE=DURATION:PT1H`);
        content.push(`X-PUBLISHED-TTL:PT1H`);
        content.push(`METHOD:PUBLISH`);

        for (let match of matches) {
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

            parsed = [...parsed.slice(0, i), ...parts, " " + line, ...parsed.slice(i + 1)];
        }

        return parsed.join("\r\n");
    }
}

export interface CountryData {
    origins: Record<string, FetcherData>,
    total: Metadata[]
}

export interface FetcherData {
    id: string,
    name: string,
    paths: Metadata[]
}

export interface Metadata {
    name?: string,
    type?: "total" | "competition",
    country?: string,
    index?: number,
    path?: string,
    count?: number

}