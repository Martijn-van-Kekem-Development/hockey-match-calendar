import { describe, expect, test } from "vitest";
import { ObjectHelper } from "../../../src/Utils/ObjectHelper.js";

describe("ObjectHelper tests", () => {
    describe("recordToString", () => {
        test("Two items", () => {
            const record: Record<string, string> = {
                "test": "123",
                "second": "456"
            };

            const result = ObjectHelper.recordToString(record);
            expect(result).toBe("> test: 123\n> second: 456");
        });

        test("Zero items", () => {
            const record: Record<string, string> = {};

            const result = ObjectHelper.recordToString(record);
            expect(result).toBe("");
        });
    });
});