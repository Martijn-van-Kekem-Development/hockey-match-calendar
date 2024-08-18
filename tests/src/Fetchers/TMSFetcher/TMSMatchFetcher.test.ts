import { test, describe, expect } from "vitest";
import { TMSMatchFetcher } from "../../../../src/Fetchers/TMSFetcher/TMSMatchFetcher.js";
import { Match } from "../../../../src/Objects/Match.js";

/**
 * Run the given tests on a match object.
 * @param test The test to run.
 * @param full Whether to return the full team names.
 */
function runParseTitleTest(test: { in: string, home?: string, away?: string, type?: string }, full: boolean = false) {
    const match = new Match();
    TMSMatchFetcher.parseTitle(match, test.in);
    if (test.home) expect(match.getHomeTeam(full)).toBe(test.home);
    if (test.away) expect(match.getAwayTeam(full)).toBe(test.away);
    if (test.type) expect(match.getType()).toBe(test.type);
}

describe('TMSMatchFetcher tests', () => {
    describe("parseTitle()", () => {
        test("Normalizing string", () => {
            runParseTitleTest({ in: "TéstCountry v LoremIpsum", home: "TestCountry" });
        });

        describe("Extracting data", () => {
            test("Only teams", () => {
                runParseTitleTest({ in: "Test1Country/ v Lor18emIpsum", home: "Test1Country/", away: "Lor18emIpsum" });
            });

            test("Teams including match type", () => {
                runParseTitleTest({
                    in: "TestCountry v LoremIpsum (With MT)",
                    home: "TestCountry",
                    away: "LoremIpsum",
                    type: "With MT"
                });
            });

            test("Invalid input", () => {
                expect(() => runParseTitleTest({ in: "Random string" })).toThrowError();
            });
        });

        describe("Parsing countries", () => {
            test("Full country name", () => {
                runParseTitleTest({ in: "Netherlands v Germany", home: "Netherlands", away: "Germany" });
                runParseTitleTest({ in: "Netherlands v Germany", home: "Netherlands", away: "Germany" }, true);
            });

            test("Abbreviated country name", () => {
                runParseTitleTest({ in: "NED v GER", home: "NED", away: "GER" });
                runParseTitleTest({ in: "NED v GER", home: "Netherlands", away: "Germany" }, true);
            });
        });
    });
});