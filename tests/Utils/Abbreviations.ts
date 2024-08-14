import { describe, expect, test } from "vitest";
import { Abbreviations } from "../../src/Utils/Abbreviations.js";
import * as fs from "node:fs";
import { KNHBFetcher } from "../../src/Fetchers/KNHBFetcher/KNHBFetcher.js";
import { TMSFetcher } from "../../src/Fetchers/TMSFetcher/TMSFetcher.js";

describe("FIHAbbreviations tests", () => {
    test("getMatchType()", () => {
        const items = fs.readFileSync("tests/includes/match-type-abbreviations.json", { encoding: "utf-8" });
        const json = JSON.parse(items);

        for (const test of json as Record<string, string>[]) {
            const output = Abbreviations.getMatchType(test.in, "M", 1);
            expect(output).toBe(test.out);
        }
    });

    test("getCompetition()", () => {
        const items = fs.readFileSync("tests/includes/competition-abbreviations.json", { encoding: "utf-8" });
        const json = JSON.parse(items);

        for (const test of json as Record<string, string>[]) {
            const output = Abbreviations.getCompetition(test.in);
            expect(output).toBe(test.out);
        }
    });

    test("padStart -- Lower than 10", () => {
        const output = Abbreviations.padStart(9);
        expect(output).toBe("09");
    });

    test("padStart -- Greater than 10", () => {
        const output = Abbreviations.padStart(15);
        expect(output).toBe("15");
    });

    test("getGender", () => {
        const fetcher1 = new KNHBFetcher("1", "2", 3, "");
        const fetcher2 = new TMSFetcher("1", "2", 3, "");
        const mensTest = {
            knhb: ["jongens", "heren", "(m)"],
            tms: ["mens"]
        };
        const womensTest = {
            knhb: ["meisjes", "dames", "(w)"],
            tms: ["womens"]
        };

        for (const item in mensTest.knhb) {
            expect(Abbreviations.getGender(item, fetcher1)).toBe("M");
            expect(Abbreviations.getGender(item, fetcher2)).toThrowError();
        }

        for (const item in mensTest.tms) {
            expect(Abbreviations.getGender(item, fetcher2)).toBe("M");
            expect(Abbreviations.getGender(item, fetcher1)).toThrowError();
        }

        for (const item in womensTest.knhb) {
            expect(Abbreviations.getGender(item, fetcher1)).toBe("W");
            expect(Abbreviations.getGender(item, fetcher2)).toThrowError();
        }

        for (const item in womensTest.knhb) {
            expect(Abbreviations.getGender(item, fetcher2)).toBe("W");
            expect(Abbreviations.getGender(item, fetcher1)).toThrowError();
        }
    });
});