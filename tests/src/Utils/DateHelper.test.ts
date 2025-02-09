import { describe, expect, test } from "vitest";
import { DateHelper } from "../../../src/Utils/DateHelper.js";

describe("DateHelper tests", () => {
    describe("Convert Altius date", () => {
        test("From Vancouver to UTC", () => {
            const output = DateHelper.AltiusToUTC(
                "8 Aug 2024 18:08", "America/Vancouver");
            expect(output.toISOString()).toBe("2024-08-09T01:08:00.000Z");
        });

        test("From Amsterdam location to UTC", () => {
            const output = DateHelper.AltiusToUTC(
                "8 Aug 2024 18:08", "America/Vancouver", "Amsterdam, Netherlands");
            expect(output.toISOString()).toBe("2024-08-08T16:08:00.000Z");
        });

        test("From location (timezone fallback) to UTC", () => {
            const output = DateHelper.AltiusToUTC(
                "8 Aug 2024 18:08", "America/Vancouver", "UnknownLocation");
            expect(output.toISOString()).toBe("2024-08-09T01:08:00.000Z");
        });
    });

    test("From UTC to ICS", () => {
        const output = DateHelper.toICS(DateHelper.AltiusToUTC(
            "8 Aug 2024 18:08", "America/Vancouver"));
        expect(output).toBe("20240809T010800Z");
    });

    describe("In- or exclude time", () => {
        test("With time", () => {
            const output = DateHelper.toICS(DateHelper.AltiusToUTC(
                "8 Aug 2024 18:08", "America/Vancouver"), true);
            expect(output).toBe("20240809T010800Z");
        });

        test("Without time", () => {
            const output = DateHelper.toICS(DateHelper.AltiusToUTC(
                "8 Aug 2024 18:08", "America/Vancouver"), false);
            expect(output).toBe("20240809");
        });
    });

    describe("Convert KNHB date", () => {
        test("To UTC", () => {
            const output =
                DateHelper.StringToUTC("2024-09-15T12:45:00.000000Z");
            expect(output.toISOString()).toBe("2024-09-15T12:45:00.000Z");
            expect(output.hours()).toBe(12);
            expect(output.minutes()).toBe(45);
        });

        test("To local", () => {
            const output =
                DateHelper.StringToLocal("2024-09-15T12:45:00.000000Z");
            expect(output.format()).toBe("2024-09-15T14:45:00+02:00");
            expect(output.hours()).toBe(14);
            expect(output.minutes()).toBe(45);
        });
    });
});