import { KNHBFetcher } from "./KNHBFetcher.js";
import { APIHelper } from "../../Utils/APIHelper";

export class KNHBClubFetcher {
    /**
     * The KNHB fetcher class.
     * @protected
     */
    protected fetcher: KNHBFetcher;

    /**
     * Constructor for KNHBClubFetcher.
     * @param fetcher
     */
    constructor(fetcher: KNHBFetcher) {
        this.fetcher = fetcher;
    }

    /**
     * Get the teams.
     */
    public async fetch() {
        const clubs: Map<string, KNHBClub> = new Map();
        const data = await APIHelper.fetch(
            this.fetcher.getBaseURL() + "/clubs", this.fetcher);

        if (data.status !== 200) throw new Error("Failed to fetch KNHB clubs.");

        const json = await data.json();

        for (const club of json.data) {
            clubs.set(KNHBClubFetcher.simplifyString(club.name), club);
        }

        return clubs;
    }

    /**
     * Simplify the input string, used to match club names.
     * @param input The club name.
     * @protected
     */
    public static simplifyString(input: string) {
        return input
            .toLowerCase()
            .replaceAll(/[^a-z]/g, "");
    }
}

export interface KNHBClub {
    abbreviation: string,
    id: string,
    name: string
}