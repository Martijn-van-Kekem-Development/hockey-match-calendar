import { test, describe, expect, vi } from "vitest";
import { TMSOfficialFetcher } from "../../../../src/Fetchers/TMSFetcher/TMSOfficialFetcher.js";
import { Competition } from "../../../../src/Objects/Competition.js";
import { TMSFetcher } from "../../../../src/Fetchers/TMSFetcher/TMSFetcher.js";
import { APIHelper } from "../../../../src/Utils/APIHelper.js";

describe("TMSOfficialFetcher tests", () => {
    const fetcher = new TMSFetcher("https://test.com", {
        id: "test",
        abbreviation: "TEST",
        name: "Test Fetcher",
        index: 0
    });

    const competition = new Competition(fetcher, 0);
    const officialFetcher = new TMSOfficialFetcher(fetcher);

    test("Parsing officials data", async () => {
        const html = `
            <div class="tab-pane">
                <table>
                    <tr>
                        <th>#</th>
                        <th>Details</th>
                        <th>Umpires</th>
                        <th>Reserve/Video</th>
                        <th>Scoring/Timing</th>
                        <th>Technical Officer</th>
                    </tr>
                    <tr>
                        <td rowspan="2">07</td>
                        <td rowspan="2">
                        <a href="/matches/4205">ENG v AUS (75M A)</a>
                        <br>08:15:00</td>
                        <td>
                            <a href="/competitions/337/matchofficial/11029">
                                ISAACS Allan (RSA)
                            </a>
                        </td>
                        <td></td>
                        <td>
                            <a href="/competitions/337/matchofficial/15597">
                                AZZAKANI Yusra (RSA)
                            </a>
                        </td>
                        <td>
                            <a href="/competitions/337/matchofficial/15147">
                                KACHELHOFFER Andries (RSA)
                            </a>
                        </td>
                    </tr>
                </table>
            </div>`;

        vi.spyOn(APIHelper, "fetch").mockResolvedValue({
            text: () => Promise.resolve(html)
        } as Response);

        const officials = await officialFetcher.fetch(competition);
        const matchOfficials = officials.get("4205");

        expect(matchOfficials).toBeDefined();
        expect(matchOfficials).toContainEqual({
            role: "Umpire",
            name: "ISAACS Allan",
            country: "RSA"
        });
    });
});