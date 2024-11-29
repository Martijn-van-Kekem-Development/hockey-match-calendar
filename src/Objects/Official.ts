export interface Official {
    role: string;
    name: string;
    country?: string;
}

export interface MatchOfficials {
    matchId: string;
    officials: Official[];
}