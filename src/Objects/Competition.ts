import {Match} from "./Match.js";
import {FIHAbbreviations} from "../Utils/FIHAbbreviations.js";
import {Fetcher} from "../Fetchers/Fetcher.js";

export class Competition {
    /**
     * The fetcher that received this competition.
     * @private
     */
    private fetcher: Fetcher;

    /**
     * The name of this event.
     * @private
     */
    private name: string;

    /**
     * The TMS id for this match event.
     * @private
     */
    private id: string;

    /**
     * The competition type.
     * @private
     */
    private type: string;

    /**
     * The location for this competition.
     * @private
     */
    private location: string;

    /**
     * The matches belonging to this competition.
     * @private
     */
    private matches: Match[] = [];

    /**
     * Constructor for Competition.
     * @param fetcher The fetcher that fetched this competition.
     */
    constructor(fetcher: Fetcher) {
        this.fetcher = fetcher;
    }

    /**
     * Set the name for this match event.
     * @param name The name.
     */
    public setName(name: string) {
        this.name = name;
    }

    /**
     * Set the location for this event.
     * @param location The location
     */
    public setLocation(location: string) {
        this.location = location;
    }

    /**
     * Set the ID for this event.
     * @param id The id.
     */
    public setID(id: string) {
        this.id = id;
    }

    /**
     * Set the type for this event.
     * @param type The type.
     */
    public setType(type: string) {
        this.type = type;
    }

    /**
     * Get the type of competition.
     */
    public getType(): string {
        return this.type;
    }

    /**
     * Get a lower-case name for this competition.
     */
    public getLowercaseName(): string {
        return this.name.toLowerCase()
            .replaceAll(" ", "-")
            .replaceAll(/[^A-Za-z0-9\-]/g, "");
    }

    /**
     * Get the competition abbreviation.
     */
    public getAbbr(): string {
        return FIHAbbreviations.getCompetition(this.name);
    }

    /**
     * Get the location for this competition.
     */
    public getLocation(): string {
        return this.location;
    }

    /**
     * Get the name of this event.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Get the id of this event.
     */
    public getID(): string {
        return this.id;
    }

    /**
     * Get the matches in this competition.
     */
    public getMatches(): Match[] {
        return this.matches;
    }

    /**
     * Get the competition fetcher.
     */
    public getFetcher(): Fetcher {
        return this.fetcher;
    }
}