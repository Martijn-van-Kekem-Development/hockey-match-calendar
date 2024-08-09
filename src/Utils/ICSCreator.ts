import {ICS, Metadata} from "../ICS.js";
import {Competition} from "../Objects/Competition.js";
import {Fetcher} from "../Fetchers/Fetcher.js";
import {Club, Match} from "../Objects/Match.js";

export class ICSCreator {
    /**
     * Create one big ICS file of all matches.
     * @param fetcher The fetcher.
     * @param competitions All competitions to include.
     */
    public static async createTotalICS(fetcher: Fetcher, competitions: Competition[]) {
        const matches = competitions.map(e => e.getMatches()).flat();
        const path = `all-matches`;
        const title = `All ${fetcher.getName()} matches`;

        console.info(`[ICSCreator] Writing ${matches.length} matches to ${path}.`);
        const meta: Metadata = {
            type: "total",
            index: -2,
            count: matches.length
        };
        await ICS.writeToFile(fetcher, ICS.calendarToICS(title, path, matches), title, path, null, meta);
        await ICSCreator.createTeamICS(fetcher, matches, path, title, meta);
    }

    /**
     * Create one big ICS file of all matches of a specific gender.
     * @param fetcher The fetcher
     * @param competitions All competitions to include.
     * @param gender The gender to create.
     */
    public static async createGenderTotalICS(fetcher: Fetcher, competitions: Competition[], gender: "M" | "W") {
        let matches = competitions.map(e => e.getMatches()).flat();
        matches = matches.filter(m => m.getGender() === gender);
        const path = `${gender === "M" ? "mens" : "womens"}-matches`;
        const title = `All ${fetcher.getName()} ${gender === "M" ? "men's" : "women's"} matches`;

        console.info(`[ICSCreator] Writing ${matches.length} matches to ${path}.`);
        const meta: Metadata = {
            type: "total",
            index: -1,
            count: matches.length
        };
        await ICS.writeToFile(fetcher, ICS.calendarToICS(title, path, matches), title, path, null, meta);
        await ICSCreator.createTeamICS(fetcher, matches, path, title, meta);
    }

    /**
     * Create one big ICS file of all matches of a specific team.
     * @param fetcher The fetcher
     * @param matches All matches.
     * @param fileName The output file name.
     * @param title The calendar title.
     * @param metadata The metadata
     */
    public static async createTeamICS(fetcher: Fetcher, matches: Match[], fileName: string, title: string, metadata: Metadata) {
        const matchMap: Map<string, {matches: Match[], club: Club}> = new Map();

        // Function to add a country.
        const addTeam = (club: Club, match: Match) => {
            if (!matchMap.has(club.id)) matchMap.set(club.id, {matches: [], club});
            matchMap.get(club.id).matches.push(match);
        }

        // Add each match to the correct clubs
        for (let match of matches) {
            match.getIncludedClubs().forEach(val => addTeam(val, match));
        }

        let promises = [];
        for (let [clubID, clubData] of matchMap) {
            const path = `clubs/${clubID}/${fileName}`;
            const fileTitle = `(${clubData.club.name}) ${title}`;

            console.info(`[ICSCreator] Writing ${clubData.matches.length} matches to ${path}.`);
            const ics = ICS.calendarToICS(fileTitle, path, clubData.matches);
            promises.push(ICS.writeToFile(fetcher, ics, fileTitle, path, clubData.club,{
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
        const path = "per-competition/" + `${competition.getID().toLowerCase()}-${competition.getLowercaseName()}`;
        const title = competition.getName();

        console.info(`[ICSCreator] Writing ${competition.getMatches().length} matches to ${path}.`);
        const meta: Metadata = {
            type: "competition",
            index: competition.getIndex(),
            count: competition.getMatches().length
        };
        await ICS.writeToFile(competition.getFetcher(), ICS.calendarToICS(title, competition.getID(), competition.getMatches()), title, path, null, meta);
        await ICSCreator.createTeamICS(competition.getFetcher(), competition.getMatches(), path, title, meta);
    }
}