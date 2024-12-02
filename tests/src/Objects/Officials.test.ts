import { describe, expect, test } from "vitest";
import { Match } from "../../../src/Objects/Match.js";
import { Competition } from "../../../src/Objects/Competition.js";
import { TMSFetcher } from "../../../src/Fetchers/TMSFetcher/TMSFetcher.js";
import { Gender } from "../../../src/Objects/Gender.js";

describe("Officials functionality tests", () => {
    const fetcher = new TMSFetcher("https://test.com", {
        id: "test",
        abbreviation: "TEST",
        name: "Test Fetcher",
        index: 0
    });

    describe("Match official management", () => {
        const match = new Match();
        match.setHomeTeam("home", "Home Team");
        match.setAwayTeam("away", "Away Team");
        match.setGender(Gender.MEN);

        test("Add and retrieve officials", () => {
            match.addOfficial("Umpire", "John Smith", "ENG");
            match.addOfficial("Technical Officer", "Jane Doe", "NED");

            const officials = match.getOfficials();
            expect(officials).toHaveLength(2);
            expect(officials).toContainEqual({
                role: "Umpire",
                name: "John Smith",
                country: "ENG"
            });
            expect(officials).toContainEqual({
                role: "Technical Officer",
                name: "Jane Doe",
                country: "NED"
            });
        });

        test("Officials appear in match description", () => {
            const competition = new Competition(fetcher, 0);
            match.setCompetition(competition);

            const description = match.getMatchDescription(false);
            expect(description).toContain("Umpire: John Smith (ENG)");
            expect(description).toContain("Technical Officer: Jane Doe (NED)");
        });
    });

});