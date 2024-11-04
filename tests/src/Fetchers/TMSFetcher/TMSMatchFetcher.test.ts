import { test, describe, expect, vi } from "vitest";
import { TMSMatchFetcher } from "../../../../src/Fetchers/TMSFetcher/TMSMatchFetcher.js";
import { TMSFetcher } from "../../../../src/Fetchers/TMSFetcher/TMSFetcher.js";
import { Match } from "../../../../src/Objects/Match.js";
import { Competition } from "../../../../src/Objects/Competition.js";
import { Gender } from "../../../../src/Objects/Gender.js";
import { APIHelper } from "../../../../src/Utils/APIHelper.js";

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
    const fetcher = new TMSFetcher("https://test.com", {
        id: "test",
        abbreviation: "TEST",
        name: "Test Fetcher",
        index: 0
    });

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
                "Umpire: John Smith (ENG)");
            expect(description).toContain(
                "Umpire: Jane Doe (SCO)");
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

        test("Officials parsing", async () => {
            const html = `
                <div class="tab-pane">
                    <table>
                        <tr>
                            <th>#</th>
                            <th>Details</th>
                            <th>Umpires</th>
                            <th>Reserve/Video</th>
                            <th>Scoring/Timing</th>
                            <th>Technical Officer</th>
                        </tr>
                        <tr>
                            <td rowspan="2">07</td>
                            <td rowspan="2">
                            <a href="/matches/4205">ENG v AUS (75M A)</a>
                            <br>08:15:00</td>
                            <td>
                                <a href="/competitions/337/matchofficial/11029">
                                    ISAACS Allan (RSA)
                                </a>
                            </td>
                            <td></td>
                            <td>
                                <a href="/competitions/337/matchofficial/15597">
                                    AZZAKANI Yusra (RSA)
                                </a>
                            </td>
                            <td>
                                <a href="/competitions/337/matchofficial/15147">
                                    KACHELHOFFER Andries (RSA)
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <a href="/competitions/337/matchofficial/6971">
                                    WILLIAMS Neal (AUS)
                                </a>
                            </td>
                            <td></td>
                            <td>
                                <a href="/competitions/337/matchofficial/2131">
                                    FOURIE Charlene (RSA)
                                </a>
                            </td>
                            <td></td>
                        </tr>
                    </table>
                </div>`;

            vi.spyOn(APIHelper, "fetch").mockResolvedValue({
                text: () => Promise.resolve(html)
            } as Response);

            const officials = await fetcher.fetchOfficials(competition);
            const matchOfficials = officials.get("4205");

            expect(matchOfficials).toHaveLength(5);
            expect(matchOfficials).toContainEqual({
                role: "Umpire",
                name: "ISAACS Allan",
                country: "RSA"
            });
            expect(matchOfficials).toContainEqual({
                role: "Umpire",
                name: "WILLIAMS Neal",
                country: "AUS"
            });
            expect(matchOfficials).toContainEqual({
                role: "Scoring/Timing",
                name: "AZZAKANI Yusra",
                country: "RSA"
            });
            expect(matchOfficials).toContainEqual({
                role: "Scoring/Timing",
                name: "FOURIE Charlene",
                country: "RSA"
            });
            expect(matchOfficials).toContainEqual({
                role: "Technical Officer",
                name: "KACHELHOFFER Andries",
                country: "RSA"
            });
        });
    });
});