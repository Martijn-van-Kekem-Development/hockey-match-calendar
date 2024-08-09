export class KNHBAbbreviations {
    /**
     * Get the gender by match type.
     * @param type The match type.
     */
    public static getGender(type: string): "M" | "W" {
        const str = type.toLowerCase();
        if (str.includes("(w)") || str.includes("dames") || str.includes("meisjes")) return "W";
        if (str.includes("(m)") || str.includes("heren") || str.includes("jongens")) return "M";
        throw new Error("Couldn't fetch gender for " + type);
    }
}