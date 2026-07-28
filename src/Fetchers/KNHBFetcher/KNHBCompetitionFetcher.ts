import { Competition } from "../../Objects/Competition";
import { KNHBFetcher } from "./KNHBFetcher";

export class KNHBCompetitionFetcher {
    /**
     * The fetcher class.
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

        const response = await this.fetcher.apiFetch("/competitions/national",
                data => data.json());

        for (const competition of response.data) {
            const item = this.createCompetition(competition);
            if (item)
                competitions.set(item.getID(), item);
        }

        return competitions;
    }

    /**
     * Create a competition object from an FIH row.
     * @param row
     */
    public createCompetition(row: KNHBCompetition): Competition | null {
        const object = new Competition(this.fetcher, row.sort);

        // Add competition ID.
        const id = row.id;
        if (!id) return this.fetcher.log(
            "error", "Skipping competition, failed to get ID");
        object.setID(id.toString());

        // Add competition name.
        const name = row.name;
        if (!name) return this.fetcher.log(
            "error", "Skipping competition, failed to get name", {
                "id": `${id}`,
            });
        object.setName(name.trim());
        object.setType(name.trim());

        return object;
    }
}

interface KNHBCompetition {
    id: number;
    poule_id: number;
    name: string;
    sort: number;
}