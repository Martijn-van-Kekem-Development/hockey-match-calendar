export class ObjectHelper {
    /**
     * Convert a record to a string
     * @param input The input record to convert
     */
    public static recordToString(input: Record<string, string>): string {
        const inputArray = Object.entries(input);
        const strings = inputArray.map(([key, value]) =>
            `> ${key}: ${value}`);

        return strings.join("\n");
    }
}