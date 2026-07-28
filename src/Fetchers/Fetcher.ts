import { Competition } from "../Objects/Competition.js";
import { Match } from "../Objects/Match.js";
import { Official } from "../Objects/Official.js";
import { ICS } from "../ICS.js";
import { ObjectHelper } from "../Utils/ObjectHelper.js";
import { Gender } from "../Objects/Gender";
import { ICSCreator } from "../Utils/ICSCreator";

export abstract class Fetcher {
    /**
     * The base URL for this fetcher.
     * @protected
     */
    protected baseURL: string;

    /**
     * The id of this fetcher.
     * @protected
     */
    protected options: FetcherOptions;

    /**
     * The error level for this fetcher.
     * 0 = no error, 1 = warning, 2 = error.
     * @protected
     */
    protected errorLevel: number = 0;

    /**
     * Constructor for Fetcher
     * @param baseURL The base URL.
     * @param options The options for this fetcher.
     */
    protected constructor(baseURL: string, options: FetcherOptions) {
        this.options = options;
        this.baseURL = baseURL;
    }

    /**
     * Get the base URL for this fetcher.
     */
    public getBaseURL(): string {
        return this.baseURL;
    }

    /**
     * Get the abbreviation of this fetcher.
     */
    public getAbbr(): string {
        return this.options.abbreviation;
    }

    /**
     * Get the options of this fetcher.
     */
    public getOptions(): FetcherOptions {
        return this.options;
    }

    /**
     * Get the index of this fetcher.
     */
    public getIndex(): number {
        return this.options.index;
    }

    /**
     * Get the id of this fetcher.
     */
    public getID(): string {
        return this.options.id;
    }

    /**
     * Start the fetcher.
     */
    public async start(): Promise<Competition[]> {
        const result = await this.fetch();
        await ICS.storeFilePaths(this);
        return result;
    }

    /**
     * Get the error level for this fetcher.
     */
    protected getErrorLevel(): number {
        return this.errorLevel;
    }

    /**
     * Finish fetching.
     * @private
     */
    public finish(): number {
        const errorLevel = this.getErrorLevel();
        if (errorLevel == 0) {
            this.log("info", "Completed without errors.");
        } else if (errorLevel >= 1) {
            this.log("info", "Completed with errors.");
        }

        return errorLevel;
    }

    /**
     * Send a log message from this fetcher.
     * @param type The type of message to log.
     * @param message The message itself.
     * @param metadata The metadata to include in the log message.
     * @protected
     */
     public log(type: "error" | "info" | "warn",
               message: string,
               metadata: Record<string, string> = {}): null {

        // Print message to console
        let metaString = ObjectHelper.recordToString(metadata);
        metaString = metaString.length > 0 ? `\n${metaString}` : "";
        console[type](`[Fetcher - ${this.getAbbr()}] (${type})`,
            message, metaString);

        // Update error level
        this.errorLevel = Math.max(this.errorLevel, {
            "info": 0,
            "warn": 0,
            "error": 1,
        }[type]);

        return null;
    }

    /**
     * Fetch the matches for this fetcher.
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
     * Fetch the competitions and map them by their ID.
     */
    protected abstract fetchCompetitions(): Promise<Map<string, Competition>>;

    /**
     * Fetch the matches by a competition.
     * @param competition The competition.
     */
    protected abstract fetchMatches(competition: Competition):
        Promise<Map<string, Match>>;

    /**
     * Specifies what description to append to each match
     * event when this fetcher is used.
     * @param competition The competition object.
     * @param match The match object.
     * @param html Whether to add HTML.
     */
    public abstract descriptionToAppend(competition: Competition, match: Match,
                                        html: boolean): string[];

    /**
     * Fetch officials for a competition
     * @param competition The competition to fetch officials for
     */
    public abstract fetchOfficials(
        competition: Competition
    ): Promise<Map<string, Official[]>>;
}

export interface FetcherOptions {
    id: string,
    abbreviation: string,
    index: number,
    name: string,
    discontinued?: boolean,
    reason?: string
}