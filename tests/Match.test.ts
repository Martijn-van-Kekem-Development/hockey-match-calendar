import {describe, test, expect} from "vitest";
import {Match} from "../src/Match.js";

describe("Match tests", () => {
    test("Match ID - ID set", () => {
        const match = new Match();
        match.setID("1");
        expect(match.getMatchID()).toBe("1");
    });

    test("Match ID - ID not set", () => {
        const match = new Match();
        match.setHomeTeam("home1");
        match.setAwayTeam("AWAY%$#2");
        match.setMatchDate(new Date(1));
        expect(match.getMatchID()).toBe("1-home1-away2");
    })
})