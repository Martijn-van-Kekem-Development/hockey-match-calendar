import { describe, expect, test } from "vitest";
import { Gender } from "../../../src/Objects/Gender.js";
import { ICSCreator } from "../../../src/Utils/ICSCreator.js";
import * as fs from "fs/promises";
import { TMSFetcher } from "../../../src/Fetchers/TMSFetcher/TMSFetcher.js";
import { Competition } from "../../../src/Objects/Competition.js";
import { Match } from "../../../src/Objects/Match.js";

describe("ICSCreator tests", () => {
    test("Valid title string for every gender", () => {
        const genders = Object.keys(Gender).filter(g => isNaN(-g));
        for (const gender of genders) {
            expect(() => ICSCreator.genderToString(Gender[gender], true))
                .not.toThrowError();
        }
    });

    test("Create official calendars", async () => {
        const fetcher = new TMSFetcher("https://test.com", {
            id: "test",
            name: "Test",
            abbreviation: "TEST",
            index: 0
        });

        const competition = new Competition(fetcher, 1);
        const match = new Match();
        match.addOfficial("Umpire", "John Smith", "ENG");
        competition.getMatches().push(match);

        await ICSCreator.createOfficialICS(fetcher, [competition]);

        // Verify file was created with correct path and content
        const fileContent = await fs.readFile(
            "docs/ics/test/officials/John Smith-ENG/all-matches.ics",
            "utf-8"
        );
        expect(fileContent).toContain("John Smith (ENG) - All Matches");
        expect(fileContent).toContain("Umpire: John Smith (ENG)");
    });
});