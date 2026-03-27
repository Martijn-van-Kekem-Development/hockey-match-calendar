import { describe, expect, test } from "vitest";
import { Abbreviations } from "../../../src/Utils/Abbreviations.js";
import * as fs from "node:fs";
import { AltiusFetcher } from "../../../src/Fetchers/AltiusFetcher/AltiusFetcher.js";
import { Gender } from "../../../src/Objects/Gender.js";

describe("Abbreviations tests", () => {
    test("getMatchType()", () => {
        const items = fs.readFileSync(
            "tests/includes/match-type-abbreviations.json",
            { encoding: "utf-8" }
        );
        const json = JSON.parse(items);

        for (const test of json as Record<string, string>[]) {
            const output = Abbreviations.getMatchType(test.in, Gender.MEN, 1);
            expect(output).toBe(test.out);
        }
    });

    test("getCompetition()", () => {
        const items = fs.readFileSync(
            "tests/includes/competition-abbreviations.json",
            { encoding: "utf-8" }
        );

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
        const options = {
            id: "test",
            abbreviation: "TSTF",
            name: "Test Fetcher",
            index: 0
        };
        const fetcher2 = new AltiusFetcher(null, options);
        const mensTest = {
            tms: ["mens"]
        };
        const mixedTest = {
            tms: ["mixed", "coed"]
        };
        const womensTest = {
            tms: ["womens"]
        };

        for (const item of mensTest.tms) {
            expect(Abbreviations.getGender(item, fetcher2)).toBe(Gender.MEN);
        }

        for (const item of womensTest.tms) {
            expect(Abbreviations.getGender(item, fetcher2)).toBe(Gender.WOMEN);
        }

        for (const item of mixedTest.tms) {
            expect(Abbreviations.getGender(item, fetcher2)).toBe(Gender.MIXED);
        }
    });
});