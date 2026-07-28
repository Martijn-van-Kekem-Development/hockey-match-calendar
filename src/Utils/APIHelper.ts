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
     * @param parseData What to do with the data.
     * @param onRedirect What to do on redirect.
     * @param tryCount The amount of tries that have passed.
     * @param options The extra fetch options to supply
     */

    public static async fetch(url: string,
                              fetcher: Fetcher,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              parseData: (data: Response) => Promise<any>,
                              onRedirect?: (data: Response) => string,
                              tryCount: number = 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              options?: RequestInit): Promise<any | null> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any;
        let response: Response;

        try {
            const resData = await fetch(url, {
                ...options,
                redirect: onRedirect ? "manual" : "follow",
            });

            /**
             * Response body must be consumed to avoid socket error.
             * https://github.com/nodejs/undici/issues/583#issuecomment-855384858
             */
            response = resData.clone();
            data = await parseData(response);
        } catch (e) {
            const error = e as Error;
            return fetcher.log("error", "Fatal fetch error", {
                "url": url,
                "error": error.toString()
            });
        }

        if (onRedirect && response.status >= 300 && response.status < 310) {
            // Redirected
            const newURL = onRedirect(response);
            return APIHelper.fetch(newURL, fetcher, parseData, onRedirect,
                tryCount, options);
        }

        if (response.status === 200) return data;

        // Request failed
        if (response.status === 429) {
            // Hit rate limit
            const resetTimestamp = response.headers.get("x-ratelimit-reset");
            let delay = 1;
            if (resetTimestamp) {
                // Calculate next attempt delay based on returned header.
                const now = (new Date()).getTime();
                const diff = Math.ceil(Number(resetTimestamp) - (now / 1000));
                if (diff > 0) delay = diff;
            }

            fetcher.log("warn", "Request failed", {
                "status": `${response.status}`,
                "url": `${response.url}`,
                "retrying in": `${delay} seconds`
            });

            await APIHelper.delay(delay * 1000);
            return await APIHelper.fetch(url, fetcher, parseData, onRedirect,
                tryCount + 1, options);
        } else if (tryCount < 3) {
            return await APIHelper.fetch(url, fetcher, parseData, onRedirect,
                tryCount + 1, options);
        } else {
            // Give up
            return fetcher.log("error", "Request failed after 3 tries. Aborting", {
                "code": `${response.status}`,
                "url": `${response.url}`,
                "body": String(data).slice(0, 40)
            });
        }
    }
}