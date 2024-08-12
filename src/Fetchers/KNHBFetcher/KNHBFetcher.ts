import { Competition } from "../../Objects/Competition.js";
import { Match } from "../../Objects/Match.js";
import {Fetcher} from "../Fetcher.js";
import {KNHBCompetitionFetcher} from "./KNHBCompetitionFetcher.js";
import {KNHBMatchFetcher} from "./KNHBMatchFetcher.js";
import {ICSCreator} from "../../Utils/ICSCreator.js";

export class KNHBFetcher extends Fetcher {
    /**
     * The base URL for the KNHB fetcher.
     */
    public static readonly KNHB_BASE_URL = "https://publicaties.hockeyweerelt.nl/mc";

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
     * Constructor for KNHBFetcher.
     * @param id The id of this fetcher.
     * @param name The name of this fetcher.
     * @param index The index of this fetcher.
     * @param baseURL The base URL of the TMS system.
     */
    constructor(id: string, name: string, index: number, baseURL: string) {
        super(id, name, index, baseURL);

        this.competitionFetcher = new KNHBCompetitionFetcher(this);
        this.matchFetcher = new KNHBMatchFetcher(this);
    }

    /**
     * @override
     */
    protected async fetch(): Promise<Competition[]> {
        console.info(`[KNHBFetcher] Fetching competitions...`);
        const competitions = await this.fetchCompetitions();
        let promises = [];

        console.info(`[KNHBFetcher] Found ${competitions.size} competitions.`);
        console.info(`[KNHBFetcher] Fetching matches and creating competition files...`);
        for (let competition of competitions.values()) {
            // Fetch match for every competition
            const result = await this.fetchMatches(competition);
            competition.getMatches().push(...result.values());
            await ICSCreator.createCompetitionICS(competition);
        }

        // Wait for all matches to fetch
        await Promise.all(promises);
        const competitionsArray = Array.from(competitions.values());

        // Create total calendar files.
        await Promise.all([
            ICSCreator.createTotalICS(this, competitionsArray, true),
            ICSCreator.createGenderTotalICS(this, competitionsArray, "M", true),
            ICSCreator.createGenderTotalICS(this, competitionsArray, "W", true),
        ]);

        console.info(`[KNHBFetcher] Finished.`);
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
        const upcomingMatches = await this.matchFetcher.fetch("upcoming", competition);
        const officialMatches = await this.matchFetcher.fetch("official", competition);
        return new Map([...upcomingMatches, ...officialMatches]);
    }

    /**
     * @override
     */
    descriptionToAppend(competition: Competition, match: Match, html: boolean): string[] {
        const lines: string[] = [];
        const KNHBUrl = "https://www.knhb.nl/match-center#";

        // Add KNHB links
        if (html) {
            if (match.getID()) lines.push(`<a href="${KNHBUrl}/matches/${match.getID()}">View match details</a>`);
            if (competition.getID()) lines.push(`<a href="${KNHBUrl}/competitions/${competition.getID()}/program">View competition details</a>`);
        } else {
            if (match.getID()) lines.push("Match link: " + `${KNHBUrl}/matches/${match.getID()}`);
            if (competition.getID()) lines.push("Competition link: " + `${KNHBUrl}/competitions/${competition.getID()}/program`);
        }

        return lines;
    }
}