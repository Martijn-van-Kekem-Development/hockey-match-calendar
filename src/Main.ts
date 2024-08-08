import {TMSFetcher} from "./Fetchers/TMSFetcher/TMSFetcher.js";

export class Main {
    /**
     * Main entry point for this application
     */
    public async run() {
        const fetcher = new TMSFetcher();
        await fetcher.fetch();
    }
}

(new Main()).run().then();