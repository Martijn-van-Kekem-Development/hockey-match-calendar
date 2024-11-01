import { describe, expect, test } from "vitest";
import { Match } from "../../../src/Objects/Match.js";
import moment from "moment";
import { Gender } from "../../../src/Objects/Gender.js";
import { Competition } from "../../../src/Objects/Competition.js";

describe("Match tests", () => {
    describe("Get- and set team names", () => {
        const match = new Match();

        test("Regular name", () => {
            match.setHomeTeam("id", "Netherlands");
            expect(match.getHomeTeam()).toBe("Netherlands");

            match.setAwayTeam("id2", "Belgium");
            expect(match.getAwayTeam()).toBe("Belgium");
        });

        test("Country abbreviation", () => {
            match.setHomeTeam("id", "NED");
            expect(match.getHomeTeam()).toBe("NED");
            expect(match.getHomeTeam(true)).toBe("Netherlands");

            match.setAwayTeam("id2", "BEL");
            expect(match.getAwayTeam()).toBe("BEL");
            expect(match.getAwayTeam(true)).toBe("Belgium");
        });
    });

    describe("getIncludedClubs()", () => {
        const match = new Match();

        test("Club explicitly set", () => {
            const homeClub = {
                name: "Club name",
                id: "club-id"
            };

            const awayClub = {
                name: "Another club",
                id: "club-id-2"
            };

            match.setHomeTeam("team-id", "Test", homeClub);
            match.setAwayTeam("team-id-2", "Another test", awayClub);

            const result = match.getIncludedClubs();
            expect(result.includes(homeClub)).toBeTruthy();
            expect(result.includes(awayClub)).toBeTruthy();
        });

        test("Parsed from country", () => {
            match.setHomeTeam("team-id", "NED");
            match.setAwayTeam("team-id-2", "BEL");

            const result = match.getIncludedClubs();
            expect(result[0]).toStrictEqual({
                id: "NED",
                name: "Netherlands"
            });
            expect(result[1]).toStrictEqual({
                id: "BEL",
                name: "Belgium"
            });
        });
    });

    test("getICSAttributes()", () => {
        const match = new Match();
        const date = moment("2024-08-18T19:30:45.767Z");
        match.setMatchDate(date, true);
        match.setHomeTeam("home", "Home");
        match.setAwayTeam("away", "Away");
        match.setGender(Gender.MEN);

        const attributes = match.getICSAttributes();
        expect(attributes.DTSTAMP).toBe("20240818T193045Z");
        expect(attributes.DTSTART).toBe("20240818T193045Z");
        expect(attributes.DTEND).toBe("20240818T213045Z");
    });

    describe("getLocation()", () => {
        describe("Without competition", () => {
            const match = new Match();

            test("Without venue", () => {
                match.setVenue(null);
                expect(match.getLocation()).toBe("");
            });

            test("With venue", () => {
                match.setVenue("Venue");
                expect(match.getLocation()).toBe("Venue");
            });

        });

        describe("With competition", () => {
            const match = new Match();
            const competition = new Competition(null, null);
            match.setCompetition(competition);

            test("No location, without venue", () => {
                competition.setLocation(null);
                match.setVenue(null);
                expect(match.getLocation()).toBe("");
            });

            test("No location, with venue", () => {
                competition.setLocation(null);
                match.setVenue("Venue");
                expect(match.getLocation()).toBe("Venue");
            });

            test("With location, no venue", () => {
                competition.setLocation("Location");
                match.setVenue(null);
                expect(match.getLocation()).toBe("Location");
            });

            test("With location, with venue", () => {
                competition.setLocation("Location");
                match.setVenue("Venue");
                expect(match.getLocation()).toBe("Venue | Location");
            });
        });
    });

    describe("getMatchTitle()", () => {
        describe("Correct icon", () => {
            const match = new Match();
            match.setHomeTeam("home", "Home");
            match.setAwayTeam("away", "Away");

            test("Completed", () => {
                match.setCompleted(true);
                expect(match.getMatchTitle().startsWith("✅")).toBeTruthy();
            });

            test("Not completed", () => {
                match.setCompleted(false);
                expect(match.getMatchTitle().startsWith("🏑")).toBeTruthy();
            });
        });

        describe("Check index occurrence", () => {
            const competition = new Competition(null, 0);
            competition.setName("Random Test Competition");
            const match = new Match();
            match.setHomeTeam("home", "Home");
            match.setAwayTeam("away", "Away");
            match.setCompetition(competition);
            match.setGender(Gender.MEN);
            match.setIndex(12);

            test("With index", () => {
                match.setIncludeIndex(true);
                expect(match.getMatchTitle()).toBe("🏑 RTC M12 | Home - Away");
            });

            test("Without index", () => {
                match.setIncludeIndex(false);
                expect(match.getMatchTitle()).toBe("🏑 RTC M | Home - Away");
            });
        });
    });

    describe("Officials handling", () => {
        const match = new Match();
        match.setHomeTeam("home", "Home");
        match.setAwayTeam("away", "Away");
        match.setGender(Gender.MEN);

        test("Adding officials", () => {
            match.addOfficial("Umpire", "John Smith", "ENG");
            match.addOfficial("Umpire", "Jane Doe", "SCO");
            match.addOfficial("Technical Officer", "Bob Wilson", "WAL");

            const officials = match.getOfficials();
            expect(officials).toHaveLength(3);
            expect(officials[0]).toEqual({
                role: "Umpire",
                name: "John Smith",
                country: "ENG"
            });
        });

        test("Officials in match description", () => {
            const description = match.getMatchDescription(false);
            const lines = description.split("\\n");

            expect(lines).toContain("Match Officials:");
            expect(lines).toContain("Umpire: John Smith (ENG), Jane Doe (SCO)");
            expect(lines).toContain("Technical Officer: Bob Wilson (WAL)");
        });

        test("Officials without country code", () => {
            match.addOfficial("Reserve Umpire", "Local Umpire");

            const description = match.getMatchDescription(false);
            const lines = description.split("\\n");

            expect(lines).toContain("Reserve Umpire: Local Umpire");
        });
    });
});