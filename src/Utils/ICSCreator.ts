import {ICS, Metadata} from "../ICS.js";
import {Competition} from "../Objects/Competition.js";
import {Fetcher} from "../Fetchers/Fetcher.js";
import {Match} from "../Objects/Match.js";

export class ICSCreator {
    /**
     * Create one big ICS file of all matches.
     * @param fetcher The fetcher.
     * @param competitions All competitions to include.
     */
    public static async createTotalICS(fetcher: Fetcher, competitions: Competition[]) {
        const matches = competitions.map(e => e.getMatches()).flat();
        const fetcherID = fetcher === null ? "total" : fetcher.getID();
        const path = `${fetcherID}/all-matches`;
        const title = `All matches`;

        console.info(`[TMSFetcher] Writing ${matches.length} matches to ${path}.`);
        const meta: Metadata = {
            type: "total",
            index: -2,
            count: matches.length
        };
        await ICS.writeToFile(fetcher, ICS.calendarToICS(title, path, matches), title, path, null, meta);
        await ICSCreator.createCountryICS(fetcher, matches, path, title, meta);
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
        const fetcherID = fetcher === null ? "total" : fetcher.getID();
        const path = `${fetcherID}/${gender === "M" ? "mens" : "womens"}-matches`;
        const title = `${gender === "M" ? "Men's" : "Women's"} matches`;

        console.info(`[TMSFetcher] Writing ${matches.length} matches to ${path}.`);
        const meta: Metadata = {
            type: "total",
            index: -1,
            count: matches.length
        };
        await ICS.writeToFile(fetcher, ICS.calendarToICS(title, path, matches), title, path, null, meta);
        await ICSCreator.createCountryICS(fetcher, matches, path, title, meta);
    }

    /**
     * Create one big ICS file of all matches of a specific country.
     * @param fetcher The fetcher
     * @param matches All matches.
     * @param fileName The output file name.
     * @param title The calendar title.
     * @param metadata The metadata
     */
    public static async createCountryICS(fetcher: Fetcher, matches: Match[], fileName: string, title: string, metadata: Metadata) {
        const countryMap: Map<string, Match[]> = new Map();

        // Function to add a country.
        const addCountry = (country: string, match: Match) => {
            if (!countryMap.has(country)) countryMap.set(country, []);
            countryMap.get(country).push(match);
        }

        // Add each match to the correct countries
        for (let match of matches) {
            match.getIncludedCountries().forEach(val => addCountry(val, match));
        }

        let promises = [];
        for (let [countryName, countryMatches] of countryMap) {
            const path = `countries/${countryName}/${fileName}`;
            const fileTitle = `(${countryName}) ${title}`;

            console.info(`[TMSFetcher] Writing ${countryMatches.length} matches to ${path}.`);
            promises.push(ICS.writeToFile(fetcher, ICS.calendarToICS(fileTitle, path, countryMatches), fileTitle, path, countryName,{
                ...metadata,
                count: countryMatches.length
            }));
        }
        await Promise.all(promises);
    }

    /**
     * Create an ICS file for a single competition.
     * @param competition The competition.
     */
    public static async createCompetitionICS(competition: Competition) {
        const path = competition.getFetcher().getID() + "/per-competition/" + `${competition.getID()}-${competition.getLowercaseName()}`;
        const title = competition.getName();

        console.info(`[TMSFetcher] Writing ${competition.getMatches().length} matches to ${path}.`);
        const meta: Metadata = {
            type: "competition",
            index: competition.getIndex(),
            count: competition.getMatches().length
        };
        await ICS.writeToFile(competition.getFetcher(), ICS.calendarToICS(title, competition.getID(), competition.getMatches()), title, path, null, meta);
        await ICSCreator.createCountryICS(competition.getFetcher(), competition.getMatches(), path, title, meta);
    }
}