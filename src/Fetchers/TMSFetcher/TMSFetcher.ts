import { Fetcher, FetcherOptions } from "../Fetcher.js";
import { Competition } from "../../Objects/Competition.js";
import { Match } from "../../Objects/Match.js";
import { TMSCompetitionFetcher } from "./TMSCompetitionFetcher.js";
import { TMSMatchFetcher } from "./TMSMatchFetcher.js";
import { ICSCreator } from "../../Utils/ICSCreator.js";
import { Gender } from "../../Objects/Gender.js";

export class TMSFetcher extends Fetcher {
    /**
     * The FIH TMS url.
     */
    public static readonly FIH_BASE_URL: string = "https://tms.fih.ch";

    /**
     * The EHL TMS url
     */
    public static readonly EHL_BASE_URL: string = "https://eurohockey.altiusrt.com";

    /**
     * The World Masters Hockey TMS url.
    */
    public static readonly WMH_BASE_URL: string = "https://masters.altiusrt.com";

    /**
     * The England Hockey TMS url.
    */
    public static readonly EH_BASE_URL: string = "https://englandhockey.altiusrt.com";

    /**
     * The FIH fetcher id.
     */
    public static readonly FIH_FETCHER_ID: string = "fih";

    /**
     * The EHL fetcher id.
     */
    public static readonly EHL_FETCHER_ID: string = "ehl";

    /**
     * The World Masters Hockey fetcher id.
     */
    public static readonly WMH_FETCHER_ID: string = "wmh";

    /**
     * The England Hockey fetcher id.
     */
    public static readonly EH_FETCHER_ID: string = "eh";

    /**
     * The competition fetcher.
     * @private
     */
    private competitionFetcher: TMSCompetitionFetcher;

    /**
     * The match fetcher.
     * @private
     */
    private matchFetcher: TMSMatchFetcher;

    /**
     * Constructor for TMSFetcher
     * @param baseURL The base URL.
     * @param options The options for this fetcher.
     */
    constructor(baseURL: string, options: FetcherOptions) {
        super(baseURL, options);

        this.competitionFetcher = new TMSCompetitionFetcher(this);
        this.matchFetcher = new TMSMatchFetcher(this);
    }

    /**
     * Fetch the matches from TMS.
     */
    protected async fetch() {
        try {
            this.log("info", "Fetching competitions.");
            const competitions = await this.fetchCompetitions();
            const promises = [];

            this.log("info", `Found ${competitions.size} competitions.`);
            this.log("info", "Fetching matches and creating competition files.");

            for (const competition of competitions.values()) {
                // Fetch matches for every competition and create ICS file
                const promise = (async () => {
                    try {
                        const matches = await this.fetchMatches(competition);
                        competition.getMatches().push(...matches.values());
                        await ICSCreator.createCompetitionICS(competition);
                    } catch (error) {
                        this.log("error", `Failed to fetch matches for competition ${
                            competition.getID()}: ${error.message}`);
                    }
                })();
                promises.push(promise);
            }

            // Wait for all matches to fetch and ICS files to be created
            await Promise.all(promises);
            const competitionsArray = Array.from(competitions.values());

            // Create total calendar files
            await Promise.all([
                ICSCreator.createTotalICS(this, competitionsArray),
                ICSCreator.createGenderTotalICS(this, competitionsArray,
                    Gender.MEN),
                ICSCreator.createGenderTotalICS(this, competitionsArray,
                    Gender.WOMEN),
                ICSCreator.createGenderTotalICS(this, competitionsArray,
                    Gender.MIXED),
            ]);

            this.log("info", "Finished.");
            return competitionsArray;
        } catch (error) {
            this.log("error", `Fatal error in fetch: ${error.message}`);
            return [];
        }
    }

    /**
     * @override
     */
    async fetchCompetitions(): Promise<Map<string, Competition>> {
        const options = { index: 0 };
        const upcoming =
            await this.competitionFetcher.fetch("upcoming", options);
        const inProgress =
            await this.competitionFetcher.fetch("in-progress", options);
        const previous =
            await this.competitionFetcher.fetch("previous", options);

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

        // Add officials if present
        const officials = match.getOfficials();
        if (officials.length > 0) {
            lines.push("");
            lines.push("Match Officials:");

            // Group officials by role
            const byRole = officials.reduce((acc, curr) => {
                if (!acc[curr.role]) acc[curr.role] = [];
                acc[curr.role].push(curr.country
                    ? `${curr.name} (${curr.country})` : curr.name);
                return acc;
            }, {} as Record<string, string[]>);

            // Add each role and officials
            for (const [role, names] of Object.entries(byRole)) {
                lines.push(`${role}: ${names.join(", ")}`);
            }
            lines.push("");
        }

        // Add TMS links
        if (html) {
            if (match.getID())
                lines.push(`<a href="${this.getBaseURL()}/matches/${
                    match.getID()}">View match details</a>`);
            if (competition.getID())
                lines.push(`<a href="${this.getBaseURL()}/competitions/${
                    competition.getID()}">View competition details</a>`);
        } else {
            if (match.getID())
                lines.push("Match link: " +
                    `${this.getBaseURL()}/matches/${match.getID()}`);
            if (competition.getID())
                lines.push("Competition link: " +
                    `${this.getBaseURL()}/competitions/${competition.getID()}`);
        }

        return lines;
    }
}