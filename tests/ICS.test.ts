import {ICS} from "../src/ICS.js";
import {test, describe, expect} from "vitest";

describe('ICS class', () => {
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
