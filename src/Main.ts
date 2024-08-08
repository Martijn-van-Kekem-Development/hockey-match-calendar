import {TMSFetcher} from "./Fetchers/TMSFetcher/TMSFetcher.js";
import {ICSCreator} from "./Utils/ICSCreator.js";
import {ICS} from "./ICS.js";

export class Main {
    /**
     * Main entry point for this application
     */
    public async run() {
        const fihCompetitions = await new TMSFetcher("fih", "FIH", TMSFetcher.FIH_BASE_URL).fetch();

        // Create total files over all fetches.
        const totalCompetitions = [...fihCompetitions];
        await Promise.all([
            ICSCreator.createTotalICS(null, totalCompetitions),
            ICSCreator.createGenderTotalICS(null, totalCompetitions, "M"),
            ICSCreator.createGenderTotalICS(null, totalCompetitions, "W"),
        ]);

        // Store file paths in JSON.
        console.info(`[TMSFetcher] Storing ICS paths in files.json.`);
        await ICS.storeFilePaths();
    }
}

(new Main()).run().then();