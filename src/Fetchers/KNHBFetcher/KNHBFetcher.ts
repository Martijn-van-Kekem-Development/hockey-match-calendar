import { Competition } from "../../Objects/Competition.js";
import { Match, Official } from "../../Objects/Match.js";
import { Fetcher, FetcherOptions } from "../Fetcher.js";
import { KNHBCompetitionFetcher } from "./KNHBCompetitionFetcher.js";
import { KNHBMatchFetcher } from "./KNHBMatchFetcher.js";
import { ICSCreator } from "../../Utils/ICSCreator.js";
import { Gender } from "../../Objects/Gender.js";
import { KNHBClub, KNHBClubFetcher } from "./KNHBClubFetcher.js";

export class KNHBFetcher extends Fetcher {
    /**
     * The base URL for the KNHB fetcher.
     */
    public static readonly KNHB_BASE_URL = "https://publicaties.hockeyweerelt.nl/mc";

    /**
     * The id for the KNHB fetcher.
     */
    public static readonly KNHB_FETCHER_ID = "knhb";

    /**
     * The competition fetcher.
     * @private
     */
    private competitionFetcher: KNHBCompetitionFetcher;

    /**
     * The match fetcher.
     * @private
     */
    private matchFetcher: KNHBMatchFetcher;

    /**
     * The club fetcher.
     * @private
     */
    private clubFetcher: KNHBClubFetcher;

    /**
     * The available clubs.
     * @private
     */
    private clubs: Map<string, KNHBClub>;

    /**
     * Constructor for KNHBFetcher
     * @param baseURL The base URL.
     * @param options The options for this fetcher.
     */
    constructor(baseURL: string, options: FetcherOptions) {
        super(baseURL, options);

        this.competitionFetcher = new KNHBCompetitionFetcher(this);
        this.matchFetcher = new KNHBMatchFetcher(this);
        this.clubFetcher = new KNHBClubFetcher(this);
    }

    /**
     * @override
     */
    protected async fetch(): Promise<Competition[]> {
        this.clubs = await this.fetchClubs();

        this.log("info", "Fetching competitions.");
        const competitions = await this.fetchCompetitions();

        this.log("info", `Found ${competitions.size} competitions.`);
        this.log("info", "Fetching matches and creating competition files.");

        for (const competition of competitions.values()) {
            // Fetch match for every competition
            const result = await this.fetchMatches(competition);
            competition.getMatches().push(...result.values());
            await ICSCreator.createCompetitionICS(competition);
        }

        // Wait for all matches to fetch
        const competitionsArray = Array.from(competitions.values());

        // Create total calendar files.
        await Promise.all([
            ICSCreator.createTotalICS(this, competitionsArray, true),
            ICSCreator.createGenderTotalICS(this, competitionsArray,
                Gender.MEN, true),
            ICSCreator.createGenderTotalICS(this, competitionsArray,
                Gender.WOMEN, true),
        ]);

        this.log("info", "Finished.");
        return competitionsArray;
    }
    /**
     * @override
     */
    async fetchCompetitions(): Promise<Map<string, Competition>> {
        return await this.competitionFetcher.fetch();
    }

    /**
     * @override
     */
    async fetchMatches(competition: Competition): Promise<Map<string, Match>> {
        const upcomingMatches =
            await this.matchFetcher.fetch("upcoming", competition);
        const officialMatches =
            await this.matchFetcher.fetch("official", competition);

        return new Map([...upcomingMatches, ...officialMatches]);
    }

    /**
     * Fetch the available clubs, mapped by their name.
     */
    async fetchClubs(): Promise<Map<string, KNHBClub>> {
        return await this.clubFetcher.fetch();
    }

    /**
     * @override
     */
    descriptionToAppend(competition: Competition, match: Match,
                        html: boolean): string[] {

        const lines: string[] = [];
        const KNHBUrl: string = "https://www.knhb.nl/match-center#";

        // Add KNHB links
        if (html) {
            if (match.getID())
                lines.push(`<a href="${KNHBUrl}/matches/${
                    match.getID()}">View match details</a>`);
            if (competition.getID())
                lines.push(`<a href="${KNHBUrl}/competitions/${
                    competition.getID()}/program">View competition details</a>`);
        } else {
            if (match.getID())
                lines.push("Match link: " + `${KNHBUrl}/matches/${match.getID()}`);
            if (competition.getID())
                lines.push("Competition link: " + `${KNHBUrl}/competitions/${
                    competition.getID()}/program`);
        }

        return lines;
    }

    /**
     * Get the fetched clubs.
     */
    public getClubs() {
        return this.clubs;
    }

    /**
     * Fetch officials for a competition
     * @returns Empty map as KNHB does not support officials
     */
    public async fetchOfficials(): Promise<Map<string, Official[]>> {
        return new Map();
    }
}