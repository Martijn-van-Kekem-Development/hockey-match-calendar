import {ICS} from "../ICS.js";
import {Competition} from "../Objects/Competition.js";
import {Fetcher} from "../Fetchers/Fetcher.js";

export class ICSCreator {
    /**
     * Create one big ICS file of all matches.
     * @param fetcher The fetcher.
     * @param competitions All competitions to include.
     */
    public static async createTotalICS(fetcher: Fetcher, competitions: Competition[]) {
        const matches = competitions.map(e => e.getMatches()).flat();
        const fetcherName = fetcher === null ? "total" : fetcher.getName();
        const path = `${fetcherName}/all-matches`;
        const title = `${fetcherName.toUpperCase()} - All matches`;

        console.info(`[TMSFetcher] Writing ${matches.length} matches to ${path}.`);
        await ICS.writeToFile(fetcher, ICS.calendarToICS(title, path, matches), title, path, {
            type: "total",
            count: matches.length
        });
    }

    /**
     * Create one big ICS file of all matches of a specific gender.
     * @param fetcher The fetcher
     * @param competitions All competitions to include.
     * @param gender The gender to create.
     */
    public static async createGenderTotalICS(fetcher: Fetcher, competitions: Competition[], gender: "M" | "W") {
        let matches = competitions.map(e => e.getMatches()).flat();
        matches = matches.filter(m => m.getGender() === gender);
        const fetcherName = fetcher === null ? "total" : fetcher.getName();
        const path = `${fetcherName}/${gender === "M" ? "mens" : "womens"}-matches`;
        const title = `${fetcherName.toUpperCase()} - ${gender === "M" ? "Men's" : "Women's"} matches`;

        console.info(`[TMSFetcher] Writing ${matches.length} matches to ${path}.`);
        await ICS.writeToFile(fetcher, ICS.calendarToICS(title, path, matches), title, path, {
            type: "total",
            count: matches.length
        });
    }

    /**
     * Create an ICS file for a single competition.
     * @param competition The competition.
     */
    public static async createCompetitionICS(competition: Competition) {
        const path = competition.getFetcher().getName() + "/per-competition/" + competition.getLowercaseName();
        const title = competition.getName();

        console.info(`[TMSFetcher] Writing ${competition.getMatches().length} matches to ${path}.`);
        await ICS.writeToFile(competition.getFetcher(), ICS.calendarToICS(title, competition.getID(), competition.getMatches()), title, path, {
            type: "competition",
            index: competition.getIndex(),
            count: competition.getMatches().length
        });
    }
}