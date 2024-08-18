import { test, describe, expect } from "vitest";
import { Competition } from "../../../src/Objects/Competition.js";

describe("Competition tests", () => {
    describe("getLowercaseName()", () => {
        const competition = new Competition(null, null);

        test("Regular string", () => {
            competition.setName("Random competition name");
            expect(competition.getLowercaseName())
                .toBe("random-competition-name");
        });

        test("With special characters", () => {
            competition.setName("Random 2024 -   Competition-name!");
            expect(competition.getLowercaseName())
                .toBe("random-2024-competition-name");
        });
    });
});