import { describe, expect, test } from "vitest";
import { Gender } from "../../../src/Objects/Gender.js";
import { ICSCreator } from "../../../src/Utils/ICSCreator.js";

describe("ICSCreator tests", () => {
    test("Valid title string for every gender", () => {
        const genders = Object.values(Gender);
        for (const gender of genders) {
            expect(() => ICSCreator.genderToString(gender, true))
                .not.toThrow();
        }
    });
});