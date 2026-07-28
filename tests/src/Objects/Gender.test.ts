import { describe, expect, test } from "vitest";
import { Gender, getFullGender } from "../../../src/Objects/Gender.js";

describe("Gender tests", () => {
    test("getFullGender()", () => {
        const genders = Object.values(Gender);
        for (const gender of genders) {
            expect(() => getFullGender(gender)).not.toThrow();
        }
    });
});