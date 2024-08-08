import {ICS} from "../src/ICS.js";
import {test, describe, expect} from "vitest";

describe('ICS class', () => {
    test("convertDate() -- Valid date < 10", () => {
        const date = new Date(2024, 0, 2, 4, 5);
        const output = ICS.convertDate(date);
        expect(output).toBe("20240102T040500Z");
    });

    test("convertDate() -- Valid date >= 10", () => {
        const date = new Date(2024, 9, 11, 12, 13);
        const output = ICS.convertDate(date);
        expect(output).toBe("20241011T121300Z");
    });

    test("formatLines()", () => {
        const lines = [
            "Very long description that is very long and longer than the max allowed characters. Very long description that is very long and longer than the max allowed characters",
            "Not so long"
        ];

        const output = ICS.formatLines(lines);
        expect(output).toStrictEqual(
            "Very long description that is very long and longer than the max allowed cha" +
            "\r\n racters. Very long description that is very long and longer than the max al" +
            "\r\n lowed characters\r\n" +
            "Not so long"
        );
    });
});
