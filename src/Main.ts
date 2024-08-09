import {TMSFetcher} from "./Fetchers/TMSFetcher/TMSFetcher.js";
import {ICSCreator} from "./Utils/ICSCreator.js";
import {ICS} from "./ICS.js";
import {KNHBFetcher} from "./Fetchers/KNHBFetcher/KNHBFetcher.js";

export class Main {
    /**
     * Main entry point for this application
     */
    public async run() {
        const competitions = await Promise.all([
            new TMSFetcher("fih", "FIH", 0, TMSFetcher.FIH_BASE_URL).fetch(),
            new KNHBFetcher("knhb", "KNHB", 1, KNHBFetcher.KNHB_BASE_URL).fetch()
        ]);

        // Create total files over all fetches.
        const totalCompetitions = competitions.flat(2);
        await Promise.all([
            ICSCreator.createTotalICS(null, totalCompetitions),
            ICSCreator.createGenderTotalICS(null, totalCompetitions, "M"),
            ICSCreator.createGenderTotalICS(null, totalCompetitions, "W"),
        ]);

        // Store file paths in JSON.
        await ICS.storeFilePaths();
    }
}

(new Main()).run().then();