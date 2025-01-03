import { ICS } from "../../src/ICS.js";
import { test, describe, expect } from "vitest";
import { icsCalendarToObject } from "ts-ics";
import { TMSFetcher } from "../../src/Fetchers/TMSFetcher/TMSFetcher.js";

describe("ICS class", () => {
    test("formatLines()", () => {
        const lines = [
            "Very long description that is very long " +
            "and longer than the max allowed characters. " +
            "Very long description that is very long and " +
            "longer than the max allowed characters",

            "Not so long"
        ];

        const output = ICS.formatLines(lines);
        const outputLines = output.split("\r\n");
        expect(outputLines.length).toBe(4);
        expect(outputLines[1].startsWith(" ")).toBe(true);
        expect(outputLines[2].startsWith(" ")).toBe(true);
        expect(outputLines[3].startsWith(" ")).toBe(false);

        for (const line of outputLines) {
            expect(line.length).toBeLessThanOrEqual(75);
        }
    });

    test("Calendar details", async () => {
        const calendar = icsCalendarToObject(ICS.calendarToICS(
            "1", "2", []));

        expect(calendar.prodId)
            .toBe("-//mvk-development//hockey-match-calendar//2//EN");
    });

    test("Paths structure", async () => {
        const fetcher = new TMSFetcher("https://test.com", {
            id: "test",
            abbreviation: "TEST",
            name: "Test Fetcher",
            index: 0
        });
        ICS.addFetcher(null, fetcher);
        const fetcherData = ICS.getFetcherData(fetcher.getID());

        expect(fetcherData).toHaveProperty("competitions");
        expect(fetcherData).toHaveProperty("officials");
        expect(fetcherData).toHaveProperty("clubs");
        expect(Array.isArray(fetcherData.competitions)).toBe(true);
        expect(Array.isArray(fetcherData.officials)).toBe(true);
        expect(typeof fetcherData.clubs).toBe("object");
    });
});
