import { describe, expect, test } from "vitest";
import { Gender, getFullGender } from "../../src/Objects/Gender.js";

describe("Gender tests", () => {
    test("getFullGender()", () => {
        const genders = Object.keys(Gender).filter(g => isNaN(-g));
        for (const gender of genders) {
            expect(() => getFullGender(Gender[gender])).not.toThrowError();
        }
    });
});