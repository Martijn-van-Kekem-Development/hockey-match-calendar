import {TMSFetcher} from "./Fetchers/TMSFetcher/TMSFetcher.js";
import {ICSCreator} from "./Utils/ICSCreator.js";
import {ICS} from "./ICS.js";

export class Main {
    /**
     * Main entry point for this application
     */
    public async run() {
        const fetcher = new TMSFetcher("fih", TMSFetcher.FIH_BASE_URL);
        const fihCompetitions = await fetcher.fetch();

        // Create total files over all fetches.
        await Promise.all([
            ICSCreator.createTotalICS(null, fihCompetitions),
            ICSCreator.createGenderTotalICS(null, fihCompetitions, "M"),
            ICSCreator.createGenderTotalICS(null, fihCompetitions, "W"),
        ]);

        // Store file paths in JSON.
        console.info(`[TMSFetcher] Storing ICS paths in files.json.`);
        await ICS.storeFilePaths();
    }
}

(new Main()).run().then();