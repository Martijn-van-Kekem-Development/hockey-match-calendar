import * as fs from "node:fs";
import { Fetcher } from "../Fetchers/Fetcher.js";
import { TMSFetcher } from "../Fetchers/TMSFetcher/TMSFetcher.js";
import { KNHBFetcher } from "../Fetchers/KNHBFetcher/KNHBFetcher.js";
import { Gender } from "../Objects/Gender.js";

export class Abbreviations {
    /**
     * The match type abbreviations.
     * @private
     */
    private static MatchTypeAbbreviations: Record<string, string>;

    /**
     * The competition abbreviations.
     * @private
     */
    private static CompetitionAbbreviations: Record<string, string>;

    /**
     * Get the match type by the match type.
     * @param type The match type
     * @param gender The match gender
     * @param index The match index in this competition
     */
    public static getMatchType(type: string, gender: Gender, index: number): string {
        if (!this.MatchTypeAbbreviations) this.getMatchTypeAbbreviations();

        // Look for abbreviation.
        for (let [regex, value] of Object.entries(this.MatchTypeAbbreviations)) {
            const matches = RegExp(regex, "i").exec(type);
            if (!matches) continue;

            // No groups, return value
            if (matches.length > 1) {
                // Replace groups.
                for (let i = 1; i < matches.length; i++) {
                    value = value.replaceAll(`%${i}`, matches[i]);
                }
            }

            // Replace gender and index values.
            return `${value} ${gender.toString()}${this.padStart(index)}`;
        }

        // No match found
        return `${gender}${this.padStart(index)}`;
    }

    /**
     * Add leading zeros to a number.
     * @param input The input number.
     * @param padLength The padding length.
     */
    static padStart(input: number, padLength: number = 2) {
        let str = String(input);
        while (str.length < padLength) {
            str = "0" + input;
        }
        return str;
    }

    /**
     * Get the match type by the match name.
     * @param name The match name
     */
    public static getCompetition(name: string): string {
        if (!this.CompetitionAbbreviations) this.getCompetitionAbbreviations();

        // Look for abbreviation.
        for (let [regex, value] of Object.entries(this.CompetitionAbbreviations)) {
            const matches = name.match(RegExp(regex, "i"));
            if (matches) {
                for (let i = 1; i < matches.length; i++) {
                    value = value.replaceAll("%1", matches[i]);
                }
                return value;
            }
        }

        // No match found
        return name
            .replaceAll(/[^A-Za-z ]/g, "")
            .split(" ")
            .map(v => v.slice(0, 1))
            .join("").toUpperCase();
    }

    /**
     * Get the gender by match type.
     * @param type The match type.
     * @param fetcher The fetcher that requests the gender
     */
    public static getGender(type: string, fetcher: Fetcher): Gender {
        const str = type.toLowerCase();

        if (fetcher instanceof TMSFetcher) {
            if (str.includes("womens")) return Gender.WOMEN;
            if (str.includes("mens")) return Gender.MEN;
            if (str.includes("mixed") || str.includes("coed")) return Gender.MIXED;

        } else if (fetcher instanceof KNHBFetcher) {
            if (str.includes("(w)") || str.includes("dames") || str.includes("meisjes")) return Gender.WOMEN;
            if (str.includes("(m)") || str.includes("heren") || str.includes("jongens")) return Gender.MEN;
        }

        throw new Error("Couldn't fetch gender for " + type);
    }

    /**
     * Get the match type abbreviations.
     */
    public static getMatchTypeAbbreviations() {
        const data = fs.readFileSync("includes/match-type-abbreviations.json", { encoding: "utf-8" });
        this.MatchTypeAbbreviations = JSON.parse(data);
    }

    /**
     * Get the competition abbreviations
     */
    public static getCompetitionAbbreviations() {
        const data = fs.readFileSync("includes/competition-abbreviations.json", { encoding: "utf-8" });
        this.CompetitionAbbreviations = JSON.parse(data);
    }
}