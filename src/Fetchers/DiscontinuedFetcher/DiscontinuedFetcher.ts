import { Competition } from "../../Objects/Competition.js";
import { Match } from "../../Objects/Match.js";
import { Official } from "../../Objects/Official.js";
import { Fetcher, FetcherOptions } from "../Fetcher.js";
import { ICS } from "../../ICS";

export class DiscontinuedFetcher extends Fetcher {
    /**
     * The id for the KNHB fetcher.
     */
    public static readonly KNHB_FETCHER_ID = "knhb";

    /**
     * Constructor for KNHBFetcher
     * @param options The options for this fetcher.
     * @param reason The reason the fetcher was discontinued
     */
    constructor(options: FetcherOptions, reason: string) {
        super("", {
            ...options,
            discontinued: true,
            reason
        });
    }

    /**
     * @override
     */
    protected async fetch(): Promise<Competition[]> {
        ICS.addFetcher(null, this);
        return [];
    }

    /**
     * @override
     */
    async fetchCompetitions(): Promise<Map<string, Competition>> {
        return new Map();
    }

    /**
     * @override
     */
    async fetchMatches(): Promise<Map<string, Match>> {
        return new Map();
    }

    /**
     * @override
     */
    descriptionToAppend(): string[] {

        const lines: string[] = [];
        lines.push("This fetcher has been discontinued.");
        return lines;
    }

    /**
     * Fetch officials for a competition
     * @returns Empty map as KNHB does not support officials
     */
    public async fetchOfficials(): Promise<Map<string, Official[]>> {
        return new Map();
    }
}