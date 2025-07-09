import { describe, expect, test, vitest } from "vitest";
import { APIHelper } from "../../../src/Utils/APIHelper.js";
import { AltiusFetcher } from "../../../src/Fetchers/AltiusFetcher/AltiusFetcher.js";

describe("APIHelper tests", () => {
    test("Delay", async () => {
        const startTime = (new Date()).getTime();
        await APIHelper.delay(500);
        const endTime = (new Date()).getTime();

        expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });

    describe("Fetch tests", () => {
        const fetcher =
            new AltiusFetcher(null, {
                id: "test",
                abbreviation: "TSTF",
                name: "Test Fetcher",
                index: 0
            });

        test("Test fatal error on invalid host.", async () => {
            const result =
                await APIHelper.fetch("http://randomurl404blabla.com", fetcher);

            expect(result).toBe(null);
        });

        test("Test retry on error response.", async () => {
            const spy = vitest.spyOn(fetcher, "log");
            const result = await APIHelper.fetch(
                "https://publicaties.hockeyweerelt.nl/mcbla", fetcher);

            expect(result).toBe(null);
            expect(spy).toBeCalledTimes(1);
        });
    });
});