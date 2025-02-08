import { Moment, tz } from "moment-timezone";
import moment from "moment";
import locationTimezone from "node-location-timezone";

export class DateHelper {
    /**
     * Convert a date in the given timezone to UTC.
     * @param date The date
     * @param timeZone The time zone.
     * @param venue The venue location
     */
    static TMStoUTC(date: string, timeZone: string, venue: string | null = null) {
        if (venue) {
            // Attempt to convert venue to timezone.
            const inputVenue = venue.split(",")[0].trim();
            const tz = locationTimezone.findTimezoneByCityName(inputVenue);
            if (tz) timeZone = tz;
        }

        return tz(date, "D MMM YYYY HH:mm", timeZone).clone().utc(false);
    }

    /**
     * Convert a date in the given timezone to UTC.
     * @param date The date
     */
    static StringToUTC(date: string) {
        return moment(date).utc(false);
    }

    /**
     * Convert a date in the given timezone to UTC.
     * @param date The date
     */
    static StringToLocal(date: string) {
        return moment(date).tz("Europe/Amsterdam", false);
    }

    /**
     * Convert a UTC date to ICS format.
     * @param date The date
     * @param includeTime Whether to include the time.
     */
    static toICS(date: Moment, includeTime: boolean = true) {
        const iso = date.toISOString(false);
        const returnString =
            (iso.split(".")[0] + "Z")
            .replaceAll(/[-:]/g, "");

        return includeTime ? returnString
            : returnString.split("T")[0];
    }
}