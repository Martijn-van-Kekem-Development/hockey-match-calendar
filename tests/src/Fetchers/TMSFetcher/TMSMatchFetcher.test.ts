import { test, describe, expect } from "vitest";
import { TMSMatchFetcher } from "../../../../src/Fetchers/TMSFetcher/TMSMatchFetcher.js";
import { TMSFetcher } from "../../../../src/Fetchers/TMSFetcher/TMSFetcher.js";
import { Match } from "../../../../src/Objects/Match.js";
import { Competition } from "../../../../src/Objects/Competition.js";
import { Gender } from "../../../../src/Objects/Gender.js";

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
    TMSMatchFetcher.parseTitle(match, test.in);
    if (test.home) expect(match.getHomeTeam(full)).toBe(test.home);
    if (test.away) expect(match.getAwayTeam(full)).toBe(test.away);
    if (test.type) expect(match.getType()).toBe(test.type);
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

            test("Invalid input", () => {
                expect(() => runParseTitleTest({ in: "Random string" }))
                    .toThrowError();
            });
        });
    });

    describe("Officials handling", () => {
        const fetcher = new TMSFetcher("https://test.com", {
            id: "test",
            abbreviation: "TEST",
            name: "Test Fetcher",
            index: 0
        });
        const match = new Match();
        const competition = new Competition(fetcher, 0);
        match.setHomeTeam("home", "Home");
        match.setAwayTeam("away", "Away");
        match.setGender(Gender.MEN);
        match.setID("test-match-123");

        test("Officials in description", () => {
            match.addOfficial("Umpire", "John Smith", "ENG");
            match.addOfficial("Umpire", "Jane Doe", "SCO");
            match.addOfficial("Technical Officer", "Bob Wilson", "WAL");

            const description = fetcher.descriptionToAppend(
                competition, match, false);
            expect(description).toContain(
                "Match Officials:");
            expect(description).toContain(
                "Umpire: John Smith (ENG), Jane Doe (SCO)");
            expect(description).toContain(
                "Technical Officer: Bob Wilson (WAL)");
        });

        test("Officials without country code", () => {
            match.addOfficial("Reserve Umpire", "Local Umpire");

            const description = fetcher.descriptionToAppend(
                competition, match, false);
            expect(description).toContain(
                "Reserve Umpire: Local Umpire");
        });

        test("HTML formatting", () => {
            const description = fetcher.descriptionToAppend(
                competition, match, true);
            expect(description.some(
                line => line.includes("<br>"))).toBeFalsy();
            expect(description.some(
                line => line.includes("<a href=\"https://test.com/matches/"))).toBeTruthy();
        });
    });
});