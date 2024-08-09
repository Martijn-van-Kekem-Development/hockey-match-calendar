import {Fetcher} from "../Fetcher.js";
import {Competition} from "../../Objects/Competition.js";
import {Match} from "../../Objects/Match.js";
import {TMSCompetitionFetcher} from "./TMSCompetitionFetcher.js";
import {TMSMatchFetcher} from "./TMSMatchFetcher.js";
import {ICSCreator} from "../../Utils/ICSCreator.js";

export class TMSFetcher extends Fetcher {
    /**
     * The FIH TMS url.
     */
    public static readonly FIH_BASE_URL: string = "https://tms.fih.ch";

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
     * Constructor for TMSFetcher.
     * @param id The id of this fetcher.
     * @param name The name of this fetcher.
     * @param index The index of this fetcher.
     * @param baseURL The base URL of the TMS system.
     */
    constructor(id: string, name: string, index: number, baseURL: string) {
        super(id, name, index, baseURL);

        this.competitionFetcher = new TMSCompetitionFetcher(this);
        this.matchFetcher = new TMSMatchFetcher(this);
    }

    /**
     * Fetch the matches from TMS.
     */
    public async fetch() {
        console.info(`[TMSFetcher] Fetching competitions...`);
        const competitions = await this.fetchCompetitions();
        let promises = [];

        console.info(`[TMSFetcher] Found ${competitions.size} competitions.`);
        console.info(`[TMSFetcher] Fetching matches and creating competition files...`);
        for (let competition of competitions.values()) {
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

        // Create calendar files.
        await Promise.all([
            ICSCreator.createTotalICS(this, competitionsArray),
            ICSCreator.createGenderTotalICS(this, competitionsArray, "M"),
            ICSCreator.createGenderTotalICS(this, competitionsArray, "W"),
        ]);

        console.info(`[TMSFetcher] Finished.`);
        return competitionsArray;
    }

    /**
     * @override
     */
    async fetchCompetitions(): Promise<Map<string, Competition>> {
        return await this.competitionFetcher.fetch("all", 2024);
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
    descriptionToAppend(competition: Competition, match: Match, html: boolean): string[] {
        const lines: string[] = [];

        // Add TMS links
        if (html) {
            if (match.getID()) lines.push(`<a href="${this.getBaseURL()}/matches/${match.getID()}">View match details</a>`);
            if (competition.getID()) lines.push(`<a href="${this.getBaseURL()}/competitions/${competition.getID()}">View competition details</a>`);
        } else {
            if (match.getID()) lines.push("Match link: " + `${this.getBaseURL()}/matches/${match.getID()}`);
            if (competition.getID()) lines.push("Competition link: " + `${this.getBaseURL()}/competitions/${competition.getID()}`);
        }

        return lines;
    }
}