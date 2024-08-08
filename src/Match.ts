import {Competition} from "./Competition.js";
import {Countries} from "./Utils/Countries.js";
import {FIH} from "./FIH/FIH.js";
import {FIHAbbreviations} from "./Utils/FIHAbbreviations.js";
import {DateHelper} from "./Utils/DateHelper.js";
import {Moment} from "moment-timezone";

export class Match {
    /**
     * The competition name that this match belongs to.
     * @private
     */
    private competition: Competition = null;

    /**
     * The index of this match in the competition.
     * @private
     */
    private matchIndex: number = 0;

    /**
     * The final score of this match if it's completed.
     * @private
     */
    private finalScore: string;

    /**
     * The type of match.
     * @private
     */
    private type: string;

    /**
     * The home team for this match.
     * @private
     */
    private homeTeam: string;

    /**
     * The away team for this match.
     * @private
     */
    private awayTeam: string;

    /**
     * The date and time this match takes place
     * @private
     */
    private date: Moment;

    /**
     * The match location.
     * @private
     */
    private venue: string;

    /**
     * The gender category for this match.
     * @private
     */
    private gender: "M" | "W";

    /**
     * Whether this match has completed.
     * @private
     */
    private isCompleted: boolean = false;

    /**
     * The match id, or null if no match ID exists.
     * @private
     */
    private id: string | null = null;

    /**
     * Set the home team for this match.
     * @param team The home team.
     */
    public setHomeTeam(team: string) {
        this.homeTeam = team;
    }

    /**
     * Set the away team for this match.
     * @param team The away team.
     */
    public setAwayTeam(team: string) {
        this.awayTeam = team;
    }

    /**
     * Set the date for this match.
     * @param date The date.
     */
    public setMatchDate(date: Moment) {
        this.date = date;
    }

    /**
     * Set the venue for this match.
     * @param venue The venue
     */
    public setVenue(venue: string) {
        this.venue = venue;
    }

    /**
     * Set the match ID.
     * @param id The match ID, or null to reset.
     */
    public setID(id: string | null) {
        this.id = id;
    }

    /**
     * Set the index for this match.
     * @param index The index.
     */
    public setIndex(index: number) {
        this.matchIndex = index;
    }

    /**
     * Set the match gender.
     * @param gender The gender.
     */
    public setGender(gender: "M" | "W") {
        this.gender = gender;
    }

    /**
     * Set whether this match is completed.
     * @param completed
     */
    public setCompleted(completed: boolean) {
        this.isCompleted = completed;
    }

    /**
     * Set the final score for this match.
     * @param score
     */
    public setScore(score: string) {
        this.finalScore = score;
    }

    /**
     * Set the match competition.
     * @param event The match competition.
     */
    public setCompetition(event: Competition) {
        this.competition = event;
    }

    /**
     * Set the type for this match.
     * @param type
     */
    public setType(type: string) {
        this.type = type;
    }

    /**
     * Get the home team.
     */
    public getHomeTeam(): string {
        return Countries.getAbbr(this.homeTeam) ?? this.homeTeam;
    }

    /**
     * Get the away team.
     */
    public getAwayTeam(): string {
        return Countries.getAbbr(this.awayTeam) ?? this.awayTeam;
    }

    /**
     * Get the ICS attributes.
     */
    public getICSAttributes(): Record<string, string> {
        const endDate = this.getMatchDate().clone().add(2, "hours");
        return {
            UID: this.getMatchID(),
            DTSTAMP: DateHelper.toICS(this.getMatchDate()),
            DTSTART: DateHelper.toICS(this.getMatchDate()),
            DTEND: DateHelper.toICS(endDate),
            SUMMARY: this.getMatchTitle(),
            LOCATION: this.getLocation(),
            DESCRIPTION: this.getMatchDescription()
        }
    }

    /**
     * Get the location for this match.
     */
    public getLocation(): string {
        if (!this.competition) return this.venue;
        return `${this.venue} | ${this.competition.getLocation() ?? "Unknown location"}`;
    }

    /**
     * Get the match abbreviation.
     */
    public getAbbr(): string {
        return FIHAbbreviations.getMatchType(this.type, this.getGender(), this.matchIndex);
    }

    /**
     * Get the gender.
     */
    public getGender(): "M" | "W" {
        return this.gender;
    }

    /**
     * Get the ID for this match.
     */
    public getID(): string {
        return this.id;
    }

    /**
     * Get the TMS link for this match competition.
     */
    public getTMSLink(): string {
        return `${FIH.BASE_URL}/matches/${this.getID()}`;
    }

    /**
     * Get the match date.
     */
    public getMatchDate(): Moment {
        return this.date;
    }

    /**
     * Get the match description.
     */
    public getMatchDescription(): string {
        const lines: string[] = [];

        // Add match data.
        lines.push(`${this.homeTeam} - ${this.awayTeam}`);
        if (this.isCompleted) lines.push(`Final score: ${this.finalScore}`);
        lines.push(`Gender: ${this.gender === "M" ? "Men" : "Women"}`);
        if (this.competition) lines.push(`Event: ${this.competition.getName()}`);
        lines.push("");

        // Add TMS links
        if (this.getID()) lines.push("Match link: " + this.getTMSLink());
        if (this.competition.getID()) lines.push("Event link: " + this.competition.getTMSLink());

        return lines.join("\\n");
    }

    /**
     * Get the title for this match.
     */
    public getMatchTitle(): string {
        const icon = this.isCompleted ? "✅" : "🏑";
        const competitionAbbr = this.competition === null ? "" : ` ${this.competition.getAbbr()}`;

        return `${icon}${competitionAbbr} ${this.getAbbr()} | ${this.getHomeTeam()} - ${this.getAwayTeam()}`;
    }

    /**
     * Get the match ID.
     */
    public getMatchID(): string {
        return this.id ?? (`${this.date.unix()}-${this.homeTeam}-${this.awayTeam}`).toLowerCase().replaceAll(/[^a-z0-9\-]/g, "");
    }
}