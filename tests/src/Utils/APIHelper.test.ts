import { describe, expect, test, vitest } from "vitest";
import { APIHelper } from "../../../src/Utils/APIHelper.js";
import { TMSFetcher } from "../../../src/Fetchers/TMSFetcher/TMSFetcher";

describe("APIHelper tests", () => {
    test("Delay", async () => {
        const startTime = (new Date()).getTime();
        await APIHelper.delay(500);
        const endTime = (new Date()).getTime();

        expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });

    describe("Fetch tests", () => {
        const fetcher =
            new TMSFetcher(null, {
                id: "test",
                abbreviation: "TSTF",
                name: "Test Fetcher",
                index: 0
            });

        test("Test fatal error on invalid host.", async () => {
            const func = async () =>
                await APIHelper.fetch("http://randomurl404blabla.com", fetcher);

            await expect(func).rejects.toThrow();
        });

        test("Test retry on error response.", async () => {
            const spy = vitest.spyOn(fetcher, "log");

            const func = async () => await APIHelper.fetch(
                "https://publicaties.hockeyweerelt.nl/mcbla", fetcher);

            await expect(func).rejects.toThrow();
            expect(spy).toBeCalledTimes(3);
        });
    });
});