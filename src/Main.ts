import {TMSFetcher} from "./Fetchers/TMSFetcher/TMSFetcher.js";
import {KNHBFetcher} from "./Fetchers/KNHBFetcher/KNHBFetcher.js";
import {Fetcher} from "./Fetchers/Fetcher.js";
import * as fs from "node:fs";

export class Main {
    /**
     * The available fetchers. The record key corresponds to the command-line argument required to run that fetcher.
     */
    public fetchers(): Record<string, Fetcher> {
        return {
            "fih": new TMSFetcher("fih", "FIH", 0, TMSFetcher.FIH_BASE_URL),
            "ehl": new TMSFetcher("ehl", "EHL", 1, TMSFetcher.EHL_BASE_URL),
            "knhb": new KNHBFetcher("knhb", "KNHB", 2, KNHBFetcher.KNHB_BASE_URL)
        };
    }

    /**
     * Main entry point for this application
     */
    public async run() {
        const argument = process.argv[2] ?? "";
        if (argument.length === 0) {
            // Invalid request.
            console.error("No command-line action provided. Exiting...");
            process.exit(1);
        }

        if (argument === "all") await this.fetchAll();
        else if (argument === "save") await this.saveFetchers();
        else await this.fetch();
    }

    /**
     * Save the fetchers to the documentation.
     * @private
     */
    private async saveFetchers() {
        const fetchers = this.fetchers();
        const output = {};
        for (let fetcher of Object.values(fetchers)) {
            output[fetcher.getID()] = {
                id: fetcher.getID(),
                name: fetcher.getName(),
                index: fetcher.getIndex()
            };
        }

        fs.mkdirSync(`docs/ics`, {recursive: true});
        fs.writeFileSync(`docs/ics/fetchers.json`, JSON.stringify(output));
    }

    /**
     * Fetch all fetchers.
     * @private
     */
    private async fetchAll() {
        const fetchers = this.fetchers();

        // Fetch all fetchers
        const promises = [];
        for (let fetcher of Object.values(fetchers))
            promises.push(fetcher.start());

        await Promise.all(promises);
    }

    /**
     * Start the fetching procedure.
     * @private
     */
    private async fetch() {
        const fetchers = this.fetchers();
        const fetchersToRun = Object.keys(fetchers).filter(i => process.argv.includes(i));

        if (fetchersToRun.length === 0) {
            console.error("No valid fetchers specified. Exiting...");
            process.exit(2);
        }

        const promises = [];
        for (let fetcherID of fetchersToRun) {
            promises.push(fetchers[fetcherID].start());
        }

        await Promise.all(promises);
    }
}

(new Main()).run().then();