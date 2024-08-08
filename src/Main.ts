import {CompetitionFetcher} from "./FIH/CompetitionFetcher.js";
import {MatchFetcher} from "./FIH/MatchFetcher.js";
import {ICS} from "./ICS.js";
import {Competition} from "./Competition.js";
import * as fs from "node:fs/promises";

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
        await this.createTotalICS(Array.from(competitions.values()));
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