import { Competition } from "../../Objects/Competition.js";
import { APIHelper } from "../../Utils/APIHelper";
import { FIHFetcher } from "./FIHFetcher.js";
import { Abbreviations } from "../../Utils/Abbreviations.js";
import { Gender } from "../../Objects/Gender.js";

export class FIHCompetitionFetcher {
    /**
     * The FIH fetcher class.
     * @protected
     */
    protected fetcher: FIHFetcher;

    /**
     * Constructor for FIHCompetitionFetcher.
     * @param fetcher
     */
    constructor(fetcher: FIHFetcher) {
        this.fetcher = fetcher;
    }

    /**
     * Get the competitions.
     * @param type The type of competitions to get.
     * @param options The index to start the first match at
     */
    public async fetch(type: "L" | "U" | "R",
                       options: { index: number }) {

        let page = 1;
        const competitions: Map<string, Competition> = new Map();

        while (true) {
            // Get data from FIH.
            const baseURL = this.fetcher.getBaseURL();
            const requestOptions = new URLSearchParams({
                status: type,
                year_from: (new Date().getFullYear() - 1).toString(),
                page_number: `${page}`,
                pagesize: "100"
            }).toString();

            const data = await APIHelper.fetch(`${
                baseURL}/data-api/static/sr/series?${requestOptions}`, this.fetcher);

            const json = await data.json();

            // Check no results
            if (json.data.value.length === 0)
                break;

            // Create competition from every row.
            for (const row of json.data.value) {
                const item = this.createCompetition(row, options.index++);
                competitions.set(item.getID(), item);
            }

            // Continue with next page.
            page++;
        }

        return competitions;
    }

    /**
     * Create a competition object from an FIH row.
     * @param row
     * @param index
     */
    public createCompetition(row: FIHCompetition, index: number): Competition {
        const object = new Competition(this.fetcher, index);

        // Add competition ID.
        const id = row.series_id;
        if (!id) throw new Error("Failed to get ID for competition.");
        else object.setID(id.toString());

        // Add competition name.
        const name = row.series;
        if (!name) throw new Error("Failed to get name for competition.");
        else object.setName(name.trim());

        // Add competition location
        if (row.venues && row.venues.length > 0) {
            const location = row.venues[0];
            object.setLocation(location.venue_name.trim());
        }

        // Add competition type
        const type = row.discipline;
        object.setType(type.trim());

        return object;
    }

    /**
     * Get the URL to fetch the matches from.
     * @param competition The competition to fetch for.
     * @private
     */
    public static getCompetitionPath(competition: Competition) {
        const title = competition.getName().toLowerCase()
            .replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");

        const gender =
            Abbreviations.getGender(competition.getType(), competition.getFetcher());

        let genderString = "other";
        if (gender == Gender.MEN) genderString = "men";
        else if (gender == Gender.WOMEN) genderString = "women";

        return `${FIHFetcher.FIH_BASE_URL}/events/others/${genderString}/${
            title}-${competition.getID()}`;
    }
}

interface FIHCompetition {
    series_id: number;
    series: string;
    discipline: string;
    venues: FIHCompetitionVenue[];
}

interface FIHCompetitionVenue {
    venue_name: string;
}