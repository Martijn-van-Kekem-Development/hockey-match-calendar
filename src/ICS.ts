import {Match} from "./Match.js";
import * as fs from "fs/promises";

export class ICS {
    /**
     * Write the ICS string to a file.
     * @param ics The ICS content.
     * @param fileName The file name without extension.
     */
    public static async writeToFile(ics: string, fileName: string) {
        await fs.writeFile(`out/${fileName}.ics`, ics, {flag: "w+"});
    }

    /**
     * Convert a calendar to the ICS format.
     * @param title The calendar title.
     * @param id The calendar ID.
     * @param matches The matches to include in this calendar.
     */
    public static calendarToICS(title: string, id: string, matches: Match[]): string {
        const content: string[] = [];

        content.push("BEGIN:VCALENDAR");
        content.push("VERSION:2.0");
        content.push(`PRODID:-//mvk-development//fih-event-calendar//${id}//EN`);
        content.push(`NAME:${title}`);
        content.push(`X-WR-CALNAME:${title}`);
        content.push(`REFRESH-INTERVAL;VALUE=DURATION:PT12H`);
        content.push(`X-PUBLISHED-TTL:PT12H`);

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

            const parts = [line.slice(0, 75)];
            line = line.slice(75);

            // Do for every line that is too long.
            while (line.length > 75) {
                parts.push(" "  + line.slice(0, 75));
                line = line.slice(75);
            }

            parsed = [
                ...parsed.slice(0, i),
                ...parts,
                " " + line,
                ...parsed.slice(i + 1)
            ];
        }

        return parsed.join("\r\n");
    }
}