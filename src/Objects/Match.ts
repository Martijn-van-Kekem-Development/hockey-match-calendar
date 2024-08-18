import { Competition } from "./Competition.js";
import { Countries, Country } from "../Utils/Countries.js";
import { Abbreviations } from "../Utils/Abbreviations.js";
import { DateHelper } from "../Utils/DateHelper.js";
import { Moment } from "moment-timezone";
import { Gender, getFullGender } from "./Gender.js";

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
    private homeTeam: Team;

    /**
     * The away team for this match.
     * @private
     */
    private awayTeam: Team;

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
    private gender: Gender;

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
     * @param id The home team ID.
     * @param team The home team.
     * @param club The club this team is playing for.
     */
    public setHomeTeam(id: string, team: string, club: Club = null) {
        this.homeTeam = {
            id,
            name: team,
            club,
            country: Countries.getCountryByIOC(team) ?? Countries.getCountryByISO(team) ?? null
        };
    }

    /**
     * Set the away team for this match.
     * @param id The away team id.
     * @param team The away team.
     * @param club The club this team is playing for.
     */
    public setAwayTeam(id: string, team: string, club: Club = null) {
        this.awayTeam = {
            id,
            name: team,
            club,
            country: Countries.getCountryByIOC(team) ?? Countries.getCountryByISO(team) ?? null
        };
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
    public setGender(gender: Gender) {
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
     * Get the type for this match.
     */
    public getType() {
        return this.type;
    }

    /**
     * Get the clubs that are included in this match.
     */
    public getIncludedClubs(): Club[] {
        const clubs: Club[] = [];

        if (this.homeTeam.country && this.homeTeam.country.ioc.length === 3)
            clubs.push({
                id: this.homeTeam.country.ioc,
                name: this.homeTeam.country.full
            });
        else if (this.homeTeam.club)
            clubs.push(this.homeTeam.club);

        if (this.awayTeam.country && this.awayTeam.country.ioc.length === 3)
            clubs.push({
                id: this.awayTeam.country.ioc,
                name: this.awayTeam.country.full
            });
        else if (this.awayTeam.club)
            clubs.push(this.awayTeam.club);

        return clubs;
    }

    /**
     * Get the home team.
     */
    public getHomeTeam(full: boolean = false): string {
        if (!full)
            return this.homeTeam.country === null
                ? this.homeTeam.name : (this.homeTeam.country.ioc ?? this.homeTeam.name);
        else
            return (this.homeTeam.country === null || this.homeTeam.country.full.length === 0)
                ? this.getHomeTeam() : this.homeTeam.country.full;
    }

    /**
     * Get the away team.
     */
    public getAwayTeam(full: boolean = false): string {
        if (!full)
            return this.awayTeam.country === null
                ? this.awayTeam.name : (this.awayTeam.country.ioc ?? this.awayTeam.name);
        else
            return (this.awayTeam.country === null || this.awayTeam.country.full.length === 0)
                ? this.getAwayTeam() : this.awayTeam.country.full;
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
            TRANSP: "TRANSPARENT",
            DESCRIPTION: this.getMatchDescription(false),
            "X-ALT-DESC;FMTTYPE=text/html": this.getMatchDescription(true)
        };
    }

    /**
     * Get the location for this match.
     */
    public getLocation(): string {
        if (!this.competition) return this.venue;
        const venue = this.venue ?? "";
        const location = this.competition.getLocation() ?? "";

        if (venue.length === 0 && location.length === 0) return "";
        else if (venue.length > 0 && location.length === 0) return venue;
        else if (venue.length === 0 && location.length > 0) return location;
        else return `${venue} | ${location}`;
    }

    /**
     * Get the match abbreviation.
     */
    public getAbbr(): string {
        return Abbreviations.getMatchType(this.type, this.getGender(), this.matchIndex);
    }

    /**
     * Get the gender.
     */
    public getGender(): Gender {
        return this.gender;
    }

    /**
     * Get the ID for this match.
     */
    public getID(): string {
        return this.id;
    }

    /**
     * Get the match date.
     */
    public getMatchDate(): Moment {
        return this.date;
    }

    /**
     * Get the match description.
     * @param html Whether to return HTML.
     */
    public getMatchDescription(html: boolean): string {
        const lines: string[] = [];

        // Add match data.
        lines.push(`${this.getHomeTeam(true)} - ${this.getAwayTeam(true)}`);
        if (this.isCompleted) lines.push(`Final score: ${this.finalScore}`);
        lines.push(`Gender: ${getFullGender(this.gender)}`);
        if (this.competition) lines.push(`Event: ${this.competition.getName()}`);
        lines.push("");

        // Append fetcher description
        if (this.competition && this.competition.getFetcher())
            lines.push(...this.competition.getFetcher().descriptionToAppend(this.competition,  this, html));

        return lines.join(html ? "<br>" : "\\n");
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
        return this.id;
    }
}

export interface Team {
    id: string,
    name: string,
    club: Club | null,
    country: Country | null
}

export interface Club {
    id: string,
    name: string
}