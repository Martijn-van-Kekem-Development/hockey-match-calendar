import { Competition } from "../../Objects/Competition";
import { Match } from "../../Objects/Match";
import { Official } from "../../Objects/Official";
import { Fetcher, FetcherOptions } from "../Fetcher";
import { KNHBCompetitionFetcher } from "./KNHBCompetitionFetcher";
import { KNHBMatchFetcher } from "./KNHBMatchFetcher";
import { Gender } from "../../Objects/Gender";
import { ICSCreator } from "../../Utils/ICSCreator";
import crypto from "crypto";
import { APIHelper } from "../../Utils/APIHelper";

export class KNHBFetcher extends Fetcher {
    /**
     * The KNHB base url.
     */
    public static readonly KNHB_BASE_URL: string = "https://app.hockeyweerelt.nl";

    /**
     * The FIH fetcher id.
     */
    public static readonly KNHB_FETCHER_ID: string = "knhb";

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
     * The device UUID retrieved by the KNHB API.
     * @private
     */
    private deviceUUID?: string;

    /**
     * The API headers to provide
     * @private
     */
    private apiHeaders: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    };

    /**
     * Constructor for KNHBFetcher
     * @param baseURL The base URL.
     * @param options The options for this fetcher.
     */
    constructor(baseURL: string, options: FetcherOptions) {
        super(baseURL, options);

        this.competitionFetcher = new KNHBCompetitionFetcher(this);
        this.matchFetcher = new KNHBMatchFetcher(this);
    }

    protected async fetch(): Promise<Competition[]> {
        if (!(await this.registerDevice()))
            return [];

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
     * Register this device to the API.
     * @private
     */
    private async registerDevice() {
        this.deviceUUID = crypto.randomUUID();
        const headers = this.getAPIHeaders("/device/register");

        const result = await fetch(`${this.getBaseURL()}/device/register`, {
            headers,
            method: "post",
            body: JSON.stringify({
                "os": "Web",
                "uuid": this.deviceUUID
            })
        });

        if (result.status !== 201) {
            this.log("error", "Failed to register device. Exiting...");
            return false;
        }

        const body = await result.json();
        this.apiHeaders["X-HAPI-Authorization"] = body["token"];
        this.log("info", "Successfully registered device.");
        return true;
    }

    /**
     * Get the API headers to make a request.
     * @param path The path to fetch.
     */
    private getAPIHeaders(path: string) {
        const time = Math.floor(Date.now() / 1000);
        const cleanPath = path.replaceAll(/[^a-zA-Z0-9\-/]+/g, "");

        const reversedUUID = this.deviceUUID?.split("").reverse().join("");
        const payload = `${time}${cleanPath}${reversedUUID}`;
        const utf8 = Buffer.from(payload, "utf8").toString("utf8");
        const signature = crypto.createHash("sha1").update(utf8).digest("hex");

        return {
            ...this.apiHeaders,
            "X-HAPI-Signature": signature,
            "X-HAPI-Timestamp": `${time}`
        };
    }

    /**
     * API fetch wrapper to include the HAPI signature.
     * @param path The path to fetch.
     * @param onRedirect What to do on redirect.
     * @param tryCount The amount of tries that have past.
     * @param options Any additional fetch options.
     */
    public apiFetch(path: string,
                 onRedirect?: (data: Response) => string,
                 tryCount: number = 0,
                 options?: Record<string, string>) {

        return APIHelper.fetch(`${this.getBaseURL()}${path}`, this,
            onRedirect, tryCount, {
            ...options,
            headers: this.getAPIHeaders(path)
        });
    }

    /**
     * @override
     */
    async fetchCompetitions(): Promise<Map<string, Competition>> {
        return this.competitionFetcher.fetch();
    }

    /**
     * @override
     */
    async fetchMatches(competition: Competition): Promise<Map<string, Match>> {
        return this.matchFetcher.fetch(competition);
    }

    /**
     * @override
     */
    descriptionToAppend(): string[] {

        const lines: string[] = [];
        lines.push("This fetcher has been discontinued.");
        return lines;
    }

    /**
     * Fetch officials for a competition
     * @returns Empty map as KNHB does not support officials
     */
    public async fetchOfficials(): Promise<Map<string, Official[]>> {
        return new Map();
    }
}