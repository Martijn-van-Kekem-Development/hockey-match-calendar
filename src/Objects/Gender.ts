export enum Gender {
    MEN = "M",
    WOMEN = "W",
    MIXED = "X"
}

/**
 * Get the full-name of the given gender.
 * @param gender The gender enum.
 */
export function getFullGender(gender: Gender): string {
    if (gender === Gender.MEN) return "Men";
    if (gender === Gender.WOMEN) return "Women";
    if (gender === Gender.MIXED) return "Mixed";
    throw new Error("getFullGender(): invalid gender specified");
}