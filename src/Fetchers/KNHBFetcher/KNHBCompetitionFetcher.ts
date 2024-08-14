import { KNHBFetcher } from "./KNHBFetcher.js";
import { Competition } from "../../Objects/Competition.js";

export class KNHBCompetitionFetcher {
    /**
     * The KNHB fetcher class.
     * @protected
     */
    protected fetcher: KNHBFetcher;

    /**
     * Constructor for KNHBCompetitionFetcher.
     * @param fetcher
     */
    constructor(fetcher: KNHBFetcher) {
        this.fetcher = fetcher;
    }

    /**
     * Get the competitions.
     */
    public async fetch() {
        const competitions: Map<string, Competition> = new Map();
        const data = await fetch(this.fetcher.getBaseURL() + "/competitions");
        const json = await data.json();
        let index = 0;

        if (json.status !== 200) throw new Error("Failed to fetch KNHB competitions.");
        for (const competition of json.data) {
            const item = this.createCompetition(competition, index++);
            competitions.set(item.getID(), item);
        }

        return competitions;
    }

    /**
     * Create a competition object from an KNHB row.
     * @param row
     * @param index
     */
    public createCompetition(row: KNHBCompetition, index: number): Competition {
        const object = new Competition(this.fetcher, index);
        object.setID(row.id);
        object.setName(row.name);
        return object;
    }
}

interface KNHBCompetition {
    id: string,
    name: string
}