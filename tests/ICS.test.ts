import {ICS} from "../src/ICS.js";
import {test, describe, expect} from "vitest";

describe('ICS class', () => {
    test("formatLines()", () => {
        const lines = [
            "Very long description that is very long and longer than the max allowed characters. Very long description that is very long and longer than the max allowed characters",
            "Not so long"
        ];

        const output = ICS.formatLines(lines);
        const outputLines = output.split("\r\n");
        expect(outputLines.length).toBe(4);
        expect(outputLines[1].startsWith(" ")).toBe(true);
        expect(outputLines[2].startsWith(" ")).toBe(true);
        expect(outputLines[3].startsWith(" ")).toBe(false);

        for (let line of outputLines) {
            expect(line.length).toBeLessThanOrEqual(75);
        }
    });
});
