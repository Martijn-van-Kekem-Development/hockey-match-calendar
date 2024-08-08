import {countryToAlpha3} from "country-to-iso/src/country-to-code.js";
import * as fs from "node:fs";

export class Countries {
    /**
     * The ISO IOC mapping dict.
     * @private
     */
    private static ISODict: Record<string, string>;

    /**
     * Get the abbreviation of a given country.
     * @param name The country name.
     */
    public static getAbbr(name: string) {
        return this.ISOToIOC(countryToAlpha3(name));
    }

    /**
     * Get the ISO dict.
     * @private
     */
    private static getISODict() {
        const data = fs.readFileSync("includes/iso-ioc.json", {encoding: "utf-8"});
        this.ISODict = JSON.parse(data);
    }

    /**
     * Convert ISO abbreviation to the IOC abbreviation.
     * @param iso The ISO value.
     * @constructor
     */
    public static ISOToIOC(iso: string | null): string | null {
        if (!this.ISODict) this.getISODict();

        if (!iso) return iso;
        return this.ISODict[iso.toUpperCase()] ?? iso;
    }
}