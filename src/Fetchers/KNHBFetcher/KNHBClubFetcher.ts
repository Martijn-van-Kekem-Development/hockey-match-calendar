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
     * Simplify a string for comparison.
     * @param input The input string.
     */
    public static simplifyString(input: string | null): string {
        if (!input) return "";

        return input
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
    }
}

export interface KNHBClub {
    abbreviation: string,
    id: string,
    name: string
}