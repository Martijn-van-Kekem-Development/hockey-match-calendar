import { describe, expect, test } from "vitest";
import * as fs from "node:fs";
import { Competition } from "../../../src/Objects/Competition";

describe("Competition tests", () => {
    describe("setName()", () => {
        const items = fs.readFileSync(
            "tests/includes/competition-abbreviations.json",
            { encoding: "utf-8" }
        );

        const json = JSON.parse(items) as Record<string, string>[];

        test.each(json)("setName($in) -> $out", input => {
            // @ts-expect-error null value in non-null input.
            const competition = new Competition(null, null);
            competition.setName(input.in);
            expect(competition.getName()).toBe(input.in);
            if (input.out === null) {
                expect(competition.hasCustomAbbreviation()).toBe(false);
                expect(competition.getAbbr()).toBe(input.fallback);
            } else {
                expect(competition.getAbbr()).toBe(input.out);
            }
        });
    });
});