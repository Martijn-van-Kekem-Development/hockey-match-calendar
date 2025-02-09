import { Fetcher, FetcherOptions } from "../Fetcher.js";
import { Competition } from "../../Objects/Competition.js";
import { Match } from "../../Objects/Match.js";
import { ICSCreator } from "../../Utils/ICSCreator.js";
import { Gender } from "../../Objects/Gender.js";
import { Official } from "../../Objects/Official.js";
import { FIHCompetitionFetcher } from "./FIHCompetitionFetcher.js";
import { FIHMatchFetcher } from "./FIHMatchFetcher.js";

export class FIHFetcher extends Fetcher {
    /**
     * The FIH base url.
     */
    public static readonly FIH_BASE_URL: string = "https://www.fih.hockey";

    /**
     * The FIH fetcher id.
     */
    public static readonly FIH_FETCHER_ID: string = "fih";

    /**
     * The competition fetcher.
     * @private
     */
    private competitionFetcher: FIHCompetitionFetcher;

    /**
     * The match fetcher.
     * @private
     */
    private matchFetcher: FIHMatchFetcher;

    /**
     * Constructor for FIHFetcher
     * @param baseURL The base URL.
     * @param options The options for this fetcher.
     */
    constructor(baseURL: string, options: FetcherOptions) {
        super(baseURL, options);

        this.competitionFetcher = new FIHCompetitionFetcher(this);
        this.matchFetcher = new FIHMatchFetcher(this);
    }

    /**
     * Fetch the matches from FIH.
     */
      protected async fetch() {
        this.log("info", "Fetching competitions.");
        const competitions = await this.fetchCompetitions();
        const promises = [];

        this.log("info", `Found ${competitions.size} competitions.`);
        this.log("info", "Fetching matches and creating competition files.");

        for (const competition of competitions.values()) {
            // Fetch match for every competition
            const matchPromise = this.fetchMatches(competition);
            matchPromise.then(result => {
                competition.getMatches().push(...result.values());
                return ICSCreator.createCompetitionICS(competition);
            });

            promises.push(matchPromise);
        }

        // Wait for all matches to fetch
        await Promise.all(promises);
        const competitionsArray = Array.from(competitions.values());

        // Create total calendar files.
        await Promise.all([
            ICSCreator.createTotalICS(this, competitionsArray),
            ICSCreator.createGenderTotalICS(this, competitionsArray,
                Gender.MEN),
            ICSCreator.createGenderTotalICS(this, competitionsArray,
                Gender.WOMEN)
        ]);

        this.log("info", "Finished.");
        return competitionsArray;
    }

    /**
     * @override
     */
    async fetchCompetitions(): Promise<Map<string, Competition>> {
        const options = { index: 0 };
        const upcoming =
            await this.competitionFetcher.fetch("U", options);
        const inProgress =
            await this.competitionFetcher.fetch("L", options);
        const previous =
            await this.competitionFetcher.fetch("R", options);

        return new Map([...upcoming, ...inProgress, ...previous]);
    }

    /**
     * @override
     */
    async fetchMatches(competition: Competition): Promise<Map<string, Match>> {
        return await this.matchFetcher.fetch(competition);
    }

    /**
     * @override
     */
    descriptionToAppend(competition: Competition, match: Match,
                        html: boolean): string[] {
        const lines: string[] = [];
        lines.push("Stage: " + match.getType());
        lines.push();

        // Add links
        const url = FIHCompetitionFetcher.getCompetitionPath(competition);
        const matchUrl = FIHMatchFetcher.getMatchPath(competition, match);
        if (html) {
            lines.push(`<a href="${matchUrl}">View match details</a>`);
            lines.push(`<a href="${url}">View competition details</a>`);
        } else {
            lines.push(`Match link: ${matchUrl}`);
            lines.push(`Competition link: ${url}`);
        }

        return lines;
    }

    /**
     * Fetch officials for a competition
     * @returns Empty map as FIH does not support officials
     */
    public async fetchOfficials(): Promise<Map<string, Official[]>> {
        return new Map();
    }
}