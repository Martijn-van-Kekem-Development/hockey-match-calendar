import { KNHBFetcher } from "./KNHBFetcher.js";

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
        const data = await fetch(this.fetcher.getBaseURL() + "/clubs");
        const json = await data.json();

        if (json.status !== 200)
            throw new Error("Failed to fetch KNHB clubs.");

        for (const club of json.data) {
            clubs.set(club.name, club);
        }

        return clubs;
    }
}

export interface KNHBClub {
    abbreviation: string,
    id: string,
    name: string
}