import { ICS, Metadata } from "../ICS.js";
import { Competition } from "../Objects/Competition.js";
import { Fetcher } from "../Fetchers/Fetcher.js";
import { Club, Match } from "../Objects/Match.js";
import { Gender } from "../Objects/Gender.js";
import { Official } from "../Objects/Official.js";

export class ICSCreator {
    /**
     * Create one big ICS file of all matches.
     * @param fetcher The fetcher.
     * @param competitions All competitions to include.
     * @param clubsOnly Whether to only create the ICS files for the clubs.
     */
    public static async createTotalICS(fetcher: Fetcher,
                                       competitions: Competition[],
                                       clubsOnly: boolean = false) {

        const matches = competitions.map(e => e.getMatches()).flat();
        const path = "all-matches";
        const title = `All ${fetcher.getAbbr()} matches`;

        const meta: Metadata = {
            type: "total",
            index: -2,
            count: matches.length
        };

        if (!clubsOnly)
            await ICS.writeToFile(fetcher, matches, title, path, null, meta);

        await ICSCreator.createClubICS(fetcher, matches, path, title, meta);
    }

    /**
     * Create one big ICS file of all matches of a specific gender.
     * @param fetcher The fetcher
     * @param competitions All competitions to include.
     * @param gender The gender to create.
     * @param clubsOnly Whether to only create the ICS files for the clubs.
     */
    public static async createGenderTotalICS(fetcher: Fetcher,
                                             competitions: Competition[],
                                             gender: Gender,
                                             clubsOnly: boolean = false) {

        let matches = competitions.map(e => e.getMatches()).flat();
        matches = matches.filter(m => m.getGender() === gender);

        const path = `${this.genderToString(gender, true)}-matches`;
        const title = `All ${fetcher.getAbbr()} ${this.genderToString(
            gender, false)} matches`;

        const meta: Metadata = {
            type: "total",
            index: -1,
            count: matches.length
        };

        if (!clubsOnly)
            await ICS.writeToFile(fetcher, matches, title, path, null, meta);

        await ICSCreator.createClubICS(fetcher, matches, path, title, meta);
    }

    /**
     * Convert a gender to a title-string.
     * @param gender The gender.
     * @param pathFriendly Whether to return a path friendly string.
     * @protected
     */
    public static genderToString(gender: Gender, pathFriendly: boolean) {
        if (gender === Gender.MEN)
            return pathFriendly ? "mens" : "mens's";
        if (gender === Gender.WOMEN)
            return pathFriendly ? "womens" : "women's";
        if (gender === Gender.MIXED)
            return "mixed";
        throw new Error("genderToString(): invalid gender");
    }

    /**
     * Create one big ICS file of all matches of a specific team.
     * @param fetcher The fetcher
     * @param matches All matches.
     * @param fileName The output file name.
     * @param title The calendar title.
     * @param metadata The metadata
     */
    public static async createClubICS(fetcher: Fetcher, matches: Match[],
                                      fileName: string, title: string,
                                      metadata: Metadata) {

        // Skip for EH fetcher.
        if (fetcher.getID() === "eh") return;

        const matchMap: Map<string, {
            matches: Match[],
            club: Club
        }> = new Map();

        // Function to add a country.
        const addTeam = (club: Club, match: Match) => {
            if (!matchMap.has(club.id))
                matchMap.set(club.id, { matches: [], club });

            matchMap.get(club.id).matches.push(match);
        };

        // Add each match to the correct clubs
        for (const match of matches) {
            match.getIncludedClubs().forEach(val => addTeam(val, match));
        }

        const promises = [];
        for (const [clubID, clubData] of matchMap) {
            const path = `clubs/${clubID}/${fileName}`;
            const fileTitle = `(${clubData.club.name}) ${title}`;

            promises.push(ICS.writeToFile(fetcher, clubData.matches, fileTitle,
                path, clubData.club, {
                ...metadata,
                count: clubData.matches.length
            }));
        }
        await Promise.all(promises);
    }

    /**
     * Create an ICS file for a single competition.
     * @param competition The competition.
     */
    public static async createCompetitionICS(competition: Competition) {
        const competitionID = competition.getID().toLowerCase();
        const path = "per-competition/" + `${competitionID}`;
        const title = competition.getName();

        const meta: Metadata = {
            type: "competition",
            index: competition.getIndex(),
            count: competition.getMatches().length
        };

        await ICS.writeToFile(competition.getFetcher(),
            competition.getMatches(), title, path, null, meta);

        await ICSCreator.createClubICS(competition.getFetcher(),
            competition.getMatches(), path, title, meta);
    }

    /**
     * Create ICS files for each official's matches
     * @param fetcher The fetcher
     * @param competitions All competitions to include
     */
    public static async createOfficialICS(
        fetcher: Fetcher,
        competitions: Competition[]
    ) {
        const matches = competitions.map(e => e.getMatches()).flat();
        const officialsMap = new Map<string, {
            matches: Match[],
            official: Official
        }>();

        // Group matches by official
        for (const match of matches) {
            for (const official of match.getOfficials()) {
                const officialKey = `${official.name}${
                    official.country ? `-${official.country}` : ""
                }`
                    .replace(/\s+/g, "-")  // Replace spaces with hyphens
                    .normalize("NFD")       // Normalize unicode characters
                    .replace(/[\u0300-\u036f]/g, "")  // Remove diacritics
                    .replace(/[^a-zA-Z0-9-]/g, "")    // Remove any non-alphanumeric
                    .replace(/-+/g, "-")   // Replace multiple hyphens
                    .trim();

                if (!officialsMap.has(officialKey)) {
                    officialsMap.set(officialKey, {
                        matches: [],
                        official
                    });
                }

                officialsMap.get(officialKey).matches.push(match);
            }
        }

        // Create calendar file for each official
        const promises = [];
        for (const [officialKey, data] of officialsMap) {
            const path = `officials/${officialKey}/all-matches`;
            const title = `${data.official.name}${
                data.official.country ? ` (${data.official.country})` : ""
            } - All Matches`;

            promises.push(ICS.writeToFile(
                fetcher,
                data.matches,
                title,
                path,
                null,
                {
                    type: "official",
                    count: data.matches.length,
                    name: data.official.name,
                    country: data.official.country
                }
            ));
        }

        await Promise.all(promises);
    }
}