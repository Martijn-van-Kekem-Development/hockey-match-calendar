import {describe, expect, test} from "vitest";
import {Countries} from "../../src/Utils/Countries.js";

describe("Countries tests", () => {
    test("Get abbreviation - Netherlands", () => {
        const output = Countries.getAbbr("Netherlands");
        expect(output).toBe("NED");
    });

    test("Get abbreviation - Germany", () => {
        const output = Countries.getAbbr("Germany");
        expect(output).toBe("GER");
    });

    test("ISO to IOC - Netherlands", () => {
        const output = Countries.ISOToIOC("NED");
        expect(output).toBe("NED");
    });

    test("ISO to IOC - Germany", () => {
        const output = Countries.ISOToIOC("DEU");
        expect(output).toBe("GER");
    });
})