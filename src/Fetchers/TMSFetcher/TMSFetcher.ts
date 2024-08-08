import {Fetcher} from "../Fetcher.js";
import {Competition} from "../../Objects/Competition.js";
import {Match} from "../../Objects/Match.js";
import {TMSCompetitionFetcher} from "./TMSCompetitionFetcher.js";
import {TMSMatchFetcher} from "./TMSMatchFetcher.js";
import {ICS} from "../../ICS.js";
import {ICSCreator} from "../../Utils/ICSCreator.js";

export class TMSFetcher extends Fetcher {
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
     */
    constructor() {
        super();

        this.competitionFetcher = new TMSCompetitionFetcher(this);
        this.matchFetcher = new TMSMatchFetcher(this);
    }

    /**
     * Fetch the matches from TMS.
     */
    public async fetch() {
        const competitions = await this.fetchCompetitions();
        let promises = [];
        for (let competition of competitions.values()) {
            const matchPromise = this.fetchMatches(competition);
            matchPromise.then(result => {
                competition.getMatches().push(...result.values());
                return ICSCreator.createCompetitionICS(competition);
            });
            promises.push(matchPromise);
        }

        // Wait for all matches to fetch
        await Promise.all(promises);
        const allMatches = Array.from(competitions.values());

        // Create calendar files.
        await Promise.all([
            ICSCreator.createTotalICS(allMatches),
            ICSCreator.createGenderTotalICS(allMatches, "M"),
            ICSCreator.createGenderTotalICS(allMatches, "W")
        ]);

        // Store file paths in JSON.
        await ICS.storeFilePaths();
    }

    /**
     * @override
     */
    async fetchCompetitions(): Promise<Map<string, Competition>> {
        return await this.competitionFetcher.fetch("all", "1678");
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
            if (competition.getID()) lines.push("Event link: " + `${this.getBaseURL()}/competitions/${competition.getID()}`);
        }

        return lines;
    }

    /**
     * @override
     */
    getBaseURL(): string {
        return "https://tms.fih.ch";
    }

}