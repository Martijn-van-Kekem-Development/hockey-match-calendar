import {ICS} from "../ICS.js";
import {Competition} from "../Objects/Competition.js";

export class ICSCreator {
    /**
     * Create one big ICS file of all matches.
     * @param competitions All competitions to include.
     */
    public static async createTotalICS(competitions: Competition[]) {
        const matches = competitions.map(e => e.getMatches()).flat();
        const path = "all-matches";
        const title = "FIH - All matches";
        await ICS.writeToFile(ICS.calendarToICS(title, "fih-all", matches), title, path, {
            type: "total",
            count: matches.length
        });
    }

    /**
     * Create one big ICS file of all matches of a specific gender.
     * @param competitions All competitions to include.
     * @param gender The gender to create.
     */
    public static async createGenderTotalICS(competitions: Competition[], gender: "M" | "W") {
        let matches = competitions.map(e => e.getMatches()).flat();
        matches = matches.filter(m => m.getGender() === gender);
        const path = `${gender === "M" ? "mens" : "womens"}-matches`;
        const title = `FIH - ${gender === "M" ? "Men's" : "Women's"} matches`;
        await ICS.writeToFile(ICS.calendarToICS(title, path, matches), title, path, {
            type: "total",
            count: matches.length
        });
    }

    /**
     * Create an ICS file for a single competition.
     * @param competition The competition.
     */
    public static async createCompetitionICS(competition: Competition) {
        const path = "per-competition/" + competition.getLowercaseName();
        const title = competition.getName();
        await ICS.writeToFile(ICS.calendarToICS(title, competition.getID(), competition.getMatches()), title, path, {
            type: "competition",
            count: competition.getMatches().length
        });
    }
}