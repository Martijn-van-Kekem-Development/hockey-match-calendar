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
     * @param options The extra fetch options to supply
     */
    public static async fetch(url: string,
                              fetcher: Fetcher,
                              onRedirect?: (data: Response) => string,
                              tryCount: number = 0,
                              options?: RequestInit): Promise<Response | null> {

        let data: Response;

        try {
            data = await fetch(url, {
                ...options,
                redirect: onRedirect ? "manual" : "follow",
            });
        } catch (e) {
            const error = e as Error;
            return fetcher.log("error", "Fatal fetch error", {
                "url": url,
                "error": error.toString()
            });
        }

        if (onRedirect && data.status >= 300 && data.status < 310) {
            // Redirected
            const newURL = onRedirect(data);
            return this.fetch(newURL, fetcher, onRedirect, tryCount, options);
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

            fetcher.log("warn", "Request failed", {
                "status": `${data.status}`,
                "url": `${data.url}`,
                "retrying in": `${delay} seconds`
            });

            await APIHelper.delay(delay * 1000);
            return await APIHelper.fetch(url, fetcher, onRedirect, tryCount + 1, options);
        } else if (tryCount < 3) {
            return await APIHelper.fetch(url, fetcher, onRedirect, tryCount + 1, options);
        } else {
            // Give up
            return fetcher.log("error", "Request failed after 3 tries. Aborting", {
                "code": `${data.status}`,
                "url": `${data.url}`,
                "body": (await data.text()).slice(0, 40)
            });
        }
    }
}