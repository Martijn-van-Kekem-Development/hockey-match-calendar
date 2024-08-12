import {Competition} from "../Objects/Competition.js";
import {Match} from "../Objects/Match.js";
import {ICS} from "../ICS.js";

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
    protected id: string;

    /**
     * The name of this fetcher.
     * @protected
     */
    protected name: string;

    /**
     * The index of this fetcher.
     * @protected
     */
    protected index: number = 0;

    /**
     * The base URL for this fetcher.
     * @param id The id of this fetcher.
     * @param name The name of this fetcher.
     * @param index The index of this fetcher.
     * @param baseURL The base URL.
     */
    protected constructor(id: string, name: string, index: number, baseURL: string) {
        this.id = id;
        this.name = name;
        this.index = index;
        this.baseURL = baseURL;
    }

    /**
     * Get the base URL for this fetcher.
     */
    public getBaseURL(): string {
        return this.baseURL;
    }

    /**
     * Get the name of this fetcher.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Get the index of this fetcher.
     */
    public getIndex(): number {
        return this.index;
    }

    /**
     * Get the id of this fetcher.
     */
    public getID(): string {
        return this.id;
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
     * Run this fetcher.
     */
    protected abstract fetch(): Promise<Competition[]>;

    /**
     * Fetch the competitions and map them by their ID.
     */
    protected abstract fetchCompetitions(): Promise<Map<string, Competition>>;

    /**
     * Fetch the matches by a competition.
     * @param competition The competition.
     */
    protected abstract fetchMatches(competition: Competition): Promise<Map<string, Match>>;

    /**
     * Specifies what description to append to each match event when this fetcher is used.
     * @param competition The competition object.
     * @param match The match object.
     * @param html Whether to add HTML.
     */
    public abstract descriptionToAppend(competition: Competition, match: Match, html: boolean): string[];
}