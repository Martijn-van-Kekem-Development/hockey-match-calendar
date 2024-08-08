import {describe, expect, test} from "vitest";
import {DateHelper} from "../../src/Utils/DateHelper.js";

describe("DateHelper tests", () => {
    test("From Vancouver to UTC", () => {
        const output = DateHelper.toUTC("8 Aug 2024 18:08", "America/Vancouver");
        expect(output).toBe("2024-08-09T01:08:00Z");
    });
})