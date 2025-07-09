import { Fetcher } from "../Fetchers/Fetcher";

export class APIHelper {
    /**
     * Promise-based delay.
     * @param ms Delay in milliseconds
     */
    public static delay = (ms: number) =>
        new Promise(res => setTimeout(res, ms));

    /**
     * Make a fetch request
     * @param url The url to fetch.
     * @param fetcher The fetcher making this network request.
     * @param onRedirect What to do on redirect.
     * @param tryCount The amount of tries that have passed.
     */
    public static async fetch(url: string,
                              fetcher: Fetcher,
                              onRedirect: (data: Response) => string = null,
                              tryCount: number = 0) {

        let data = null;
        try {
            data = await fetch(url, { redirect: onRedirect ? "manual" : "follow" });
        } catch {
            fetcher.log("error", `Fatal fetch error (URL: ${url})`);
            throw new Error();
        }

        if (onRedirect && data.status >= 300 && data.status < 310) {
            // Redirected
            const newURL = onRedirect(data);
            return this.fetch(newURL, fetcher, onRedirect, tryCount);
        }

        if (data.status === 200) return data;

        // Request failed
        if (data.status === 429) {
            // Hit rate limit
            const resetTimestamp = data.headers.get("x-ratelimit-reset");
            let delay = 1;
            if (resetTimestamp) {
                // Calculate next attempt delay based on returned header.
                const now = (new Date()).getTime();
                const diff = Math.ceil(Number(resetTimestamp) - (now / 1000));
                if (diff > 0) delay = diff;
            }

            fetcher.log("warn", `Request failed (${data.status}, URL: ${
                data.url}), retrying in ${delay} second(s).`);

            await APIHelper.delay(delay * 1000);
            return await APIHelper.fetch(url, fetcher, onRedirect, tryCount + 1);
        } else if (tryCount < 3) {
            return await APIHelper.fetch(url, fetcher, onRedirect, tryCount + 1);
        } else {
            // Give up
            fetcher.log("error", "Request failed after 3 tries. Aborting", {
                "code": `${data.status}`,
                "body": await data.text()
            });
            throw new Error();
        }
    }
}