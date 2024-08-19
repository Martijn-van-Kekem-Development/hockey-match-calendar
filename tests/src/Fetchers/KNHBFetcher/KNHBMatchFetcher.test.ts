import { test, describe, expect } from "vitest";
import { KNHBMatchFetcher } from "../../../../src/Fetchers/KNHBFetcher/KNHBMatchFetcher.js";

describe("KNHBMatchFetcher tests", () => {
    describe("getClubId()", () => {
        test("Regular string", () => {
            expect(KNHBMatchFetcher.getClubId("Random name"))
                .toBe("random-name");
        });

        test("With special characters", () => {
            expect(KNHBMatchFetcher.getClubId(
                "Random! name 2024 - With characters"))
                .toBe("random-name-with-characters");

            expect(KNHBMatchFetcher.getClubId(
                "KNHB-like competition: the real one."))
                .toBe("knhb-like-competition-the-real-one");
        });
    });
});