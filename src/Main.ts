import { AltiusFetcher } from "./Fetchers/AltiusFetcher/AltiusFetcher.js";
import { KNHBFetcher } from "./Fetchers/KNHBFetcher/KNHBFetcher.js";
import { Fetcher } from "./Fetchers/Fetcher.js";
import * as fs from "node:fs";
import { FIHFetcher } from "./Fetchers/FIHFetcher/FIHFetcher.js";

export class Main {
    /**
     * The available fetchers. The record key corresponds to the
     * command-line argument required to run that fetcher.
     */
    public fetchers(): Record<string, Fetcher> {
        const fetchers = {};

        // FIH
        fetchers[FIHFetcher.FIH_FETCHER_ID] =
            new FIHFetcher(FIHFetcher.FIH_BASE_URL, {
                id: FIHFetcher.FIH_FETCHER_ID,
                abbreviation: "FIH",
                name: "International Hockey Federation",
                index: 0
            });

        // EHL
        fetchers[AltiusFetcher.EHL_FETCHER_ID] =
            new AltiusFetcher(AltiusFetcher.EHL_BASE_URL, {
                id: AltiusFetcher.EHL_FETCHER_ID,
                abbreviation: "EHL",
                name: "Euro Hockey League",
                index: 1
            });

        // KNHB
        fetchers[KNHBFetcher.KNHB_FETCHER_ID] =
            new KNHBFetcher(KNHBFetcher.KNHB_BASE_URL, {
                id: KNHBFetcher.KNHB_FETCHER_ID,
                abbreviation: "KNHB",
                name: "Dutch Hockey Association",
                index: 2
            });

        // WMH
        fetchers[AltiusFetcher.WMH_FETCHER_ID] =
            new AltiusFetcher(AltiusFetcher.WMH_BASE_URL, {
                id: AltiusFetcher.WMH_FETCHER_ID,
                abbreviation: "WMH",
                name: "World Masters Hockey",
                index: 3
            });

        // EH
        fetchers[AltiusFetcher.EH_FETCHER_ID] =
            new AltiusFetcher(AltiusFetcher.EH_BASE_URL, {
                id: AltiusFetcher.EH_FETCHER_ID,
                abbreviation: "EH",
                name: "England Hockey",
                index: 4
            });

        return fetchers;
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
        for (const fetcher of Object.values(fetchers)) {
            output[fetcher.getID()] = fetcher.getOptions();
        }

        fs.mkdirSync("docs/ics", { recursive: true });
        fs.writeFileSync("docs/ics/fetchers.json", JSON.stringify(output));
    }

    /**
     * Fetch all fetchers.
     * @private
     */
    private async fetchAll() {
        const fetchers = this.fetchers();

        // Fetch all fetchers
        const promises = [];
        for (const fetcher of Object.values(fetchers))
            promises.push(fetcher.start());

        await Promise.all(promises);
    }

    /**
     * Start the fetching procedure.
     * @private
     */
    private async fetch() {
        const fetchers = this.fetchers();
        const fetchersToRun = Object.keys(fetchers)
            .filter(i => process.argv.includes(i));

        if (fetchersToRun.length === 0) {
            console.error("No valid fetchers specified. Exiting...");
            process.exit(2);
        }

        const promises = [];
        for (const fetcherID of fetchersToRun) {
            promises.push(fetchers[fetcherID].start());
        }

        await Promise.all(promises);

        // All fetchers have finished
        let errorLevel = 0;
        for (const fetcherID of fetchersToRun) {
            const fetcherLevel = fetchers[fetcherID].finish();
            errorLevel = Math.max(errorLevel, fetcherLevel);
        }
        process.exit(errorLevel);
    }
}

(new Main()).run().then();