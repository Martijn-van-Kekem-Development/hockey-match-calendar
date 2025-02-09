import { Fetcher, FetcherOptions } from "../Fetcher.js";
import { Competition } from "../../Objects/Competition.js";
import { Match } from "../../Objects/Match.js";
import { AltiusCompetitionFetcher } from "./AltiusCompetitionFetcher.js";
import { AltiusMatchFetcher } from "./AltiusMatchFetcher.js";
import { ICSCreator } from "../../Utils/ICSCreator.js";
import { Gender } from "../../Objects/Gender.js";
import { AltiusOfficialFetcher } from "./AltiusOfficialFetcher.js";
import { Official } from "../../Objects/Official.js";

export class AltiusFetcher extends Fetcher {
    /**
     * The EHL Altius url
     */
    public static readonly EHL_BASE_URL: string = "https://eurohockey.altiusrt.com";

    /**
     * The World Masters Hockey Altius url.
    */
    public static readonly WMH_BASE_URL: string = "https://masters.altiusrt.com";

    /**
     * The England Hockey Altius url.
    */
    public static readonly EH_BASE_URL: string = "https://englandhockey.altiusrt.com";

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
    private competitionFetcher: AltiusCompetitionFetcher;

    /**
     * The match fetcher.
     * @private
     */
    private matchFetcher: AltiusMatchFetcher;

    /**
     * The official fetcher.
     * @private
     */
    private officialFetcher: AltiusOfficialFetcher;

    /**
     * Constructor for AltiusFetcher
     * @param baseURL The base URL.
     * @param options The options for this fetcher.
     */
    constructor(baseURL: string, options: FetcherOptions) {
        super(baseURL, options);

        this.competitionFetcher = new AltiusCompetitionFetcher(this);
        this.matchFetcher = new AltiusMatchFetcher(this);
        this.officialFetcher = new AltiusOfficialFetcher(this);
    }

      /**
     * Fetch the matches from Altius.
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
                Gender.WOMEN),
            ICSCreator.createGenderTotalICS(this, competitionsArray,
                Gender.MIXED),
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

            // Define role order based on table columns with O(1) lookup
            const roleOrder: Record<string, number> = {
                "Umpire": 0,
                "Reserve/Video": 1,
                "Scoring/Timing": 2,
                "Technical Officer": 3
            };

            // Sort officials by predefined role order
            const sortedOfficials = [...officials].sort((a, b) => {
                const indexA = roleOrder[a.role] ?? Number.MAX_SAFE_INTEGER;
                const indexB = roleOrder[b.role] ?? Number.MAX_SAFE_INTEGER;
                return indexA - indexB;
            });

            // Add each official on their own line
            for (const official of sortedOfficials) {
                const officialStr = official.country
                    ? `${official.name} (${official.country})`
                    : official.name;
                lines.push(`${official.role}: ${officialStr}`);
            }
            lines.push("");
        }

        // Add Altius links
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

    /**
     * Fetch officials for a competition
     * @param competition The competition to fetch officials for
     */
    public async fetchOfficials(
        competition: Competition
    ): Promise<Map<string, Official[]>> {
        return this.officialFetcher.fetch(competition);
    }
}