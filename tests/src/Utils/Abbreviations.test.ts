import { describe, expect, test } from "vitest";
import { Abbreviations } from "../../../src/Utils/Abbreviations.js";
import * as fs from "node:fs";
import { KNHBFetcher } from "../../../src/Fetchers/KNHBFetcher/KNHBFetcher.js";
import { TMSFetcher } from "../../../src/Fetchers/TMSFetcher/TMSFetcher.js";
import { Gender } from "../../../src/Objects/Gender.js";

describe("Abbreviations tests", () => {
    test("getMatchType()", () => {
        const items = fs.readFileSync("tests/includes/match-type-abbreviations.json", { encoding: "utf-8" });
        const json = JSON.parse(items);

        for (const test of json as Record<string, string>[]) {
            const output = Abbreviations.getMatchType(test.in, Gender.MEN, 1);
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

        for (const item of mensTest.knhb) {
            expect(Abbreviations.getGender(item, fetcher1)).toBe(Gender.MEN);
            expect(() => Abbreviations.getGender(item, fetcher2)).toThrowError();
        }

        for (const item of mensTest.tms) {
            expect(Abbreviations.getGender(item, fetcher2)).toBe(Gender.MEN);
            expect(() => Abbreviations.getGender(item, fetcher1)).toThrowError();
        }

        for (const item of womensTest.knhb) {
            expect(Abbreviations.getGender(item, fetcher1)).toBe(Gender.WOMEN);
            expect(() => Abbreviations.getGender(item, fetcher2)).toThrowError();
        }

        for (const item of womensTest.tms) {
            expect(Abbreviations.getGender(item, fetcher2)).toBe(Gender.WOMEN);
            expect(() => Abbreviations.getGender(item, fetcher1)).toThrowError();
        }
    });
});