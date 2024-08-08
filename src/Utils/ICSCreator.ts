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
        const fetcherID = fetcher === null ? "total" : fetcher.getID();
        const path = `${fetcherID}/all-matches`;
        const title = `All matches`;

        console.info(`[TMSFetcher] Writing ${matches.length} matches to ${path}.`);
        await ICS.writeToFile(fetcher, ICS.calendarToICS(title, path, matches), title, path, {
            type: "total",
            index: -2,
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
        const fetcherID = fetcher === null ? "total" : fetcher.getID();
        const path = `${fetcherID}/${gender === "M" ? "mens" : "womens"}-matches`;
        const title = `${gender === "M" ? "Men's" : "Women's"} matches`;

        console.info(`[TMSFetcher] Writing ${matches.length} matches to ${path}.`);
        await ICS.writeToFile(fetcher, ICS.calendarToICS(title, path, matches), title, path, {
            type: "total",
            index: -1,
            count: matches.length
        });
    }

    /**
     * Create an ICS file for a single competition.
     * @param competition The competition.
     */
    public static async createCompetitionICS(competition: Competition) {
        const path = competition.getFetcher().getID() + "/per-competition/" + competition.getLowercaseName();
        const title = competition.getName();

        console.info(`[TMSFetcher] Writing ${competition.getMatches().length} matches to ${path}.`);
        await ICS.writeToFile(competition.getFetcher(), ICS.calendarToICS(title, competition.getID(), competition.getMatches()), title, path, {
            type: "competition",
            index: competition.getIndex(),
            count: competition.getMatches().length
        });
    }
}