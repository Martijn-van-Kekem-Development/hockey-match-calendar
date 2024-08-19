import * as fs from "node:fs";

export class Countries {
    /**
     * The ISO IOC mapping dict.
     * @private
     */
    private static ISODict: Record<string, Country>;

    /**
     * The IOC ISO mapping dict.
     * @private
     */
    private static IOCDict: Record<string, Country>;

    /**
     * Get the country data by a given IOC.
     * @param ioc The IOC.
     */
    public static getCountryByIOC(ioc: string): Country {
        if (!this.IOCDict) this.getIOCDict();

        return this.IOCDict[ioc] ?? null;
    }

    /**
     * Get the country data by a given ISO.
     * @param iso The ISO.
     */
    public static getCountryByISO(iso: string): Country {
        if (!this.ISODict) this.getISODict();

        return this.ISODict[iso] ?? null;
    }

    /**
     * Get the ISO dict.
     * @private
     */
    private static getISODict() {
        const data = fs.readFileSync(
            "includes/countries-by-iso.json",
            { encoding: "utf-8" }
        );
        this.ISODict = JSON.parse(data);
    }

    /**
     * Get the ISO dict.
     * @private
     */
    private static getIOCDict() {
        const data = fs.readFileSync(
            "includes/countries-by-ioc.json",
            { encoding: "utf-8" }
        );
        this.IOCDict = JSON.parse(data);
    }
}

export interface Country {
    ioc: string,
    a2: string,
    a3: string,
    full: string
}