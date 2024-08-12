import {describe, expect, test} from "vitest";
import {FIHAbbreviations} from "../../src/Utils/FIHAbbreviations.js";
import * as fs from "node:fs";

describe("FIHAbbreviations tests", () => {
    test("getMatchType()", () => {
        const items = fs.readFileSync("tests/includes/match-type-abbreviations.json", {encoding: "utf-8"});
        const json = JSON.parse(items);

        for (let test of json as Record<string,string>[]) {
            const output = FIHAbbreviations.getMatchType(test.in, "M", 1);
            expect(output).toBe(test.out);
        }
    });

    test("getCompetition()", () => {
        const items = fs.readFileSync("tests/includes/competition-abbreviations.json", {encoding: "utf-8"});
        const json = JSON.parse(items);

        for (let test of json as Record<string,string>[]) {
            const output = FIHAbbreviations.getCompetition(test.in);
            expect(output).toBe(test.out);
        }
    });

    test("padStart -- Lower than 10", () => {
        const output = FIHAbbreviations.padStart(9);
        expect(output).toBe("09");
    });

    test("padStart -- Greater than 10", () => {
        const output = FIHAbbreviations.padStart(15);
        expect(output).toBe("15");
    });

    test("getGender", () => {
        const output = FIHAbbreviations.getGender("asdfwomensasdf");
        expect(output).toBe("W");

        const output2 = FIHAbbreviations.getGender("asdfmensasdf");
        expect(output2).toBe("M");

        expect(() => FIHAbbreviations.getGender("123")).toThrowError();
    });
});