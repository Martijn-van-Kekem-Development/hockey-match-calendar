import {CompetitionFetcher} from "./FIH/CompetitionFetcher.js";
import {MatchFetcher} from "./FIH/MatchFetcher.js";
import {ICS} from "./ICS.js";
import {Competition} from "./Competition.js";

export class Main {
    /**
     * Main entry point for this application
     */
    public async run() {
        const competitions = await CompetitionFetcher.fetch("all", "1678");
        let promises = [];
        for (let competition of competitions.values()) {
            const matchPromise = MatchFetcher.fetch(competition);
            matchPromise.then(result => {
                competition.getMatches().push(...result.values());
                return this.createCompetitionICS(competition);
            });
            promises.push(matchPromise);
        }

        await Promise.all(promises);
        const allMatches = Array.from(competitions.values());
        await this.createTotalICS(allMatches);
        await this.createGenderTotalICS(allMatches, "M");
        await this.createGenderTotalICS(allMatches, "W");
    }

    /**
     * Create one big ICS file of all matches.
     * @param competitions All competitions to include.
     * @private
     */
    private async createTotalICS(competitions: Competition[]) {
        const matches = competitions.map(e => e.getMatches()).flat();
        const path = "all-matches";
        await ICS.writeToFile(ICS.calendarToICS("FIH - All matches", "fih-all", matches), path);
    }

    /**
     * Create one big ICS file of all matches of a specific gender.
     * @param competitions All competitions to include.
     * @param gender The gender to create.
     * @private
     */
    private async createGenderTotalICS(competitions: Competition[], gender: "M" | "W") {
        let matches = competitions.map(e => e.getMatches()).flat();
        matches = matches.filter(m => m.getGender() === gender);
        const path = `${gender === "M" ? "mens" : "womens"}-matches`;
        await ICS.writeToFile(ICS.calendarToICS(
            `FIH - ${gender === "M" ? "Men's" : "Women's"} matches`, path, matches), path);
    }

    /**
     * Create an ICS file for a single competition.
     * @param competition The competition.
     * @private
     */
    private async createCompetitionICS(competition: Competition) {
        const path = "per-competition/" + competition.getLowercaseName();
        await ICS.writeToFile(ICS.calendarToICS(competition.getName(), competition.getID(), competition.getMatches()), path);
    }
}

(new Main()).run().then();