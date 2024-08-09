import {describe, expect, test} from "vitest";
import {Countries} from "../../src/Utils/Countries.js";

describe("Countries tests", () => {
    test("Get by ISO - Netherlands", () => {
        const output = Countries.getCountryByISO("NLD");
        expect(output.full).toBe("Netherlands");
    });

    test("Get by IOC - Netherlands", () => {
        const output = Countries.getCountryByIOC("NED");
        expect(output.full).toBe("Netherlands");
    });
})