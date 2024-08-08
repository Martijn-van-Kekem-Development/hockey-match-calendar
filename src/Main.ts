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
        await Promise.all([
            this.createTotalICS(allMatches),
            this.createGenderTotalICS(allMatches, "M"),
            this.createGenderTotalICS(allMatches, "W")
        ]);
        await ICS.storeFilePaths();
    }

    /**
     * Create one big ICS file of all matches.
     * @param competitions All competitions to include.
     * @private
     */
    private async createTotalICS(competitions: Competition[]) {
        const matches = competitions.map(e => e.getMatches()).flat();
        const path = "all-matches";
        const title = "FIH - All matches";
        await ICS.writeToFile(ICS.calendarToICS(title, "fih-all", matches), title, path, "total");
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
        const title = `FIH - ${gender === "M" ? "Men's" : "Women's"} matches`;
        await ICS.writeToFile(ICS.calendarToICS(title, path, matches), title, path, "total");
    }

    /**
     * Create an ICS file for a single competition.
     * @param competition The competition.
     * @private
     */
    private async createCompetitionICS(competition: Competition) {
        const path = "per-competition/" + competition.getLowercaseName();
        const title = competition.getName();
        await ICS.writeToFile(ICS.calendarToICS(title, competition.getID(), competition.getMatches()), title, path, "competition");
    }
}

(new Main()).run().then();