import { describe, expect, test } from "vitest";
import { APIHelper } from "../../../src/Utils/APIHelper.js";

describe("APIHelper tests", () => {
    test("Delay", async () => {
        const startTime = (new Date()).getTime();
        await APIHelper.delay(500);
        const endTime = (new Date()).getTime();

        expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });
});