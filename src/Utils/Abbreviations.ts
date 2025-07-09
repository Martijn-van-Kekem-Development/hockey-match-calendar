import * as fs from "node:fs";
import { Fetcher } from "../Fetchers/Fetcher.js";
import { AltiusFetcher } from "../Fetchers/AltiusFetcher/AltiusFetcher.js";
import { KNHBFetcher } from "../Fetchers/KNHBFetcher/KNHBFetcher.js";
import { Gender } from "../Objects/Gender.js";
import { FIHFetcher } from "../Fetchers/FIHFetcher/FIHFetcher.js";

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
     * @param index The match index in this competition, or null if the index
     *              should be hidden.
     */
    public static getMatchType(type: string,
                               gender: Gender,
                               index: number | null): string {

        if (!this.MatchTypeAbbreviations) this.getMatchTypeAbbreviations();
        const indexStr = index === null ? "" : this.padStart(index);

        // Look for abbreviation.
        const entries = Object.entries(this.MatchTypeAbbreviations);
        for (let [regex, value] of entries) {
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
            return `${value} ${gender.toString()}${indexStr}`;
        }

        // No match found
        return `${gender}${indexStr}`;
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
        const entries = Object.entries(this.CompetitionAbbreviations);
        for (let [regex, value] of entries) {
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
    public static getGender(type: string, fetcher: Fetcher): Gender | false {
        let str = type.toLowerCase();

        if (fetcher instanceof AltiusFetcher || fetcher instanceof FIHFetcher) {
            str = str.replace(/[^a-z0-9]/g, "");
            if (str.includes("womens"))
                return Gender.WOMEN;
            if (str.includes("mens"))
                return Gender.MEN;
            if (str.includes("mixed") || str.includes("coed"))
                return Gender.MIXED;

        } else if (fetcher instanceof KNHBFetcher) {
            if (str.includes("(w)") ||
                str.includes("dames") ||
                str.includes("meisjes"))
                return Gender.WOMEN;

            if (str.includes("(m)") ||
                str.includes("heren") ||
                str.includes("jongens"))
                return Gender.MEN;

            // If not either, it's a mixed competition
            return Gender.MIXED;
        }

        return false;
    }

    /**
     * Get the match type abbreviations.
     */
    public static getMatchTypeAbbreviations() {
        const data = fs.readFileSync(
            "includes/match-type-abbreviations.json",
            { encoding: "utf-8" }
        );

        this.MatchTypeAbbreviations = JSON.parse(data);
    }

    /**
     * Get the competition abbreviations
     */
    public static getCompetitionAbbreviations() {
        const data = fs.readFileSync(
            "includes/competition-abbreviations.json",
            { encoding: "utf-8" }
        );

        this.CompetitionAbbreviations = JSON.parse(data);
    }
}