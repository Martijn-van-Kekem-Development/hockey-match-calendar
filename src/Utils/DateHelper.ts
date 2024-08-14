import { Moment, tz } from "moment-timezone";
import moment from "moment";

export class DateHelper {
    /**
     * Convert a date in the given timezone to UTC.
     * @param date The date
     * @param timeZone The time zone.
     */
    static TMStoUTC(date: string, timeZone: string) {
        return tz(date, "D MMM YYYY HH:mm", timeZone).clone().utc(false);
    }

    /**
     * Convert a date in the given timezone to UTC.
     * @param date The date
     */
    static KNHBtoUTC(date: string) {
        return moment(date).utc(false);
    }

    /**
     * Convert a UTC date to ICS format.
     * @param date The date
     */
    static toICS(date: Moment) {
        return (date.toISOString(false)
            .split(".")[0] + "Z")
            .replaceAll(/[-:]/g, "");
    }
}