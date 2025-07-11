import { test, describe, expect } from "vitest";
import { AltiusMatchFetcher } from "../../../../src/Fetchers/AltiusFetcher/AltiusMatchFetcher.js";
import { Match } from "../../../../src/Objects/Match.js";

interface parseTitleTest {
    in: string,
    home?: string,
    away?: string,
    type?: string
}

/**
 * Run the given tests on a match object.
 * @param test The test to run.
 * @param full Whether to return the full team names.
 */
function runParseTitleTest(test: parseTitleTest, full: boolean = false) {
    const match = new Match();
    const result = AltiusMatchFetcher.parseTitle(match, test.in);
    if (test.home) expect(match.getHomeTeam(full)).toBe(test.home);
    if (test.away) expect(match.getAwayTeam(full)).toBe(test.away);
    if (test.type) expect(match.getType()).toBe(test.type);
    return result;
}

describe("TMSMatchFetcher tests", () => {

    describe("parseTitle()", () => {
        test("Normalizing string", () => {
            runParseTitleTest({
                in: "TéstCountry v LoremIpsum",
                home: "TestCountry"
            });
        });

        describe("Extracting data", () => {
            test("Only teams", () => {
                runParseTitleTest({
                    in: "Test1Country/ v Lor18emIpsum",
                    home: "Test1Country/",
                    away: "Lor18emIpsum"
                });
            });

            test("Teams including match type", () => {
                runParseTitleTest({
                    in: "TestCountry v LoremIpsum (With MT)",
                    home: "TestCountry",
                    away: "LoremIpsum",
                    type: "With MT"
                });
            });

            test("Teams including accents", () => {
                runParseTitleTest({
                    in: "B'ham v LoremIpsum (With MT)",
                    home: "B'ham",
                    away: "LoremIpsum",
                    type: "With MT"
                });
            });

            test("Teams with bad formatting", () => {
                runParseTitleTest({
                    in: "BS v WGS(2) (Pool A)",
                    home: "BS",
                    away: "WGS(2)",
                    type: "Pool A"
                });
            });

            test("No teams", () => {
                runParseTitleTest({
                    in: "v  (Final)",
                    home: "TBC",
                    away: "TBC",
                    type: "Final"
                });
            });

            test("Invalid input", () => {
                expect(runParseTitleTest({ in: "Random string" })).toBe(false);
            });
        });
    });
});