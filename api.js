// API-Football Integration - Calls our backend proxy
// Backend handles caching and rate limiting
const API_FOOTBALL = {
    // Backend proxy URL (same origin in production)
    baseURL: window.location.origin + '/api/football',

    // 10 major leagues only (reduced from 22 to save API quota)
    leagues: {
        'premier-league': { id: 39, name: 'Premier League' },
        'laliga': { id: 140, name: 'LaLiga' },
        'bundesliga': { id: 78, name: 'Bundesliga' },
        'serie-a': { id: 135, name: 'Serie A' },
        'ligue1': { id: 61, name: 'Ligue 1' },
        'champions-league': { id: 2, name: 'Champions League' },
        'brasileirao': { id: 71, name: 'Brasileirao' },
        'liga-argentina': { id: 128, name: 'Liga Argentina' },
        'eredivisie': { id: 88, name: 'Eredivisie' },
        'liga-portugal': { id: 94, name: 'Liga Portugal' }
    },

    async fetchAPI(endpoint, params = {}) {
        const qs = new URLSearchParams(params).toString();
        const url = `${this.baseURL}/${endpoint}?${qs}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
    },

    // ========== STANDINGS (season 2024 for free plan) ==========
    async getStandings(leagueId) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');
        const data = await this.fetchAPI('standings', { league: league.id, season: 2024 });
        return this.formatStandings(data.response || []);
    },

    formatStandings(response) {
        if (!response?.[0]?.league?.standings?.[0]) return [];
        return response[0].league.standings[0].map(team => ({
            pos: team.rank,
            team: team.team.name,
            teamId: team.team.id,
            logo: team.team.logo,
            pj: team.all.played,
            g: team.all.win,
            e: team.all.draw,
            p: team.all.lose,
            gf: team.all.goals.for,
            gc: team.all.goals.against,
            dif: team.goalsDiff,
            pts: team.points,
            form: this.parseForm(team.form)
        }));
    },

    parseForm(formString) {
        if (!formString) return [];
        return formString.split('').slice(-5);
    },

    // ========== FIXTURES ==========
    async getFixtures(leagueId, date = null) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');
        const d = date || new Date().toISOString().split('T')[0];
        const data = await this.fetchAPI('fixtures', { league: league.id, date: d });
        return this.formatFixtures(data.response || []);
    },

    async getTodayMatches() {
        const today = new Date().toISOString().split('T')[0];
        const data = await this.fetchAPI('fixtures', { date: today });
        return this.formatFixtures(data.response || []);
    },

    async getLiveMatches() {
        const data = await this.fetchAPI('fixtures', { live: 'all' });
        return this.formatFixtures(data.response || []);
    },

    getFixturesForLeague(matches, leagueId) {
        const league = this.leagues[leagueId];
        if (!league) return [];
        return matches.filter(m => m.league.id === league.id);
    },

    formatFixtures(response) {
        if (!Array.isArray(response)) return [];
        return response.map(match => ({
            id: match.fixture.id,
            date: match.fixture.date,
            timestamp: match.fixture.timestamp,
            status: match.fixture.status.short,
            statusLong: match.fixture.status.long,
            elapsed: match.fixture.status.elapsed,
            referee: match.fixture.referee,
            venue: match.fixture.venue?.name || '',
            league: {
                id: match.league.id,
                name: match.league.name,
                country: match.league.country,
                logo: match.league.logo,
                round: match.league.round
            },
            home: {
                id: match.teams.home.id,
                name: match.teams.home.name,
                logo: match.teams.home.logo,
                score: match.goals.home,
                winner: match.teams.home.winner
            },
            away: {
                id: match.teams.away.id,
                name: match.teams.away.name,
                logo: match.teams.away.logo,
                score: match.goals.away,
                winner: match.teams.away.winner
            }
        }));
    },

    // ========== TOP SCORERS ==========
    async getTopScorers(leagueId) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');
        const data = await this.fetchAPI('players/topscorers', { league: league.id, season: 2024 });
        return this.formatPlayers(data.response || []);
    },

    formatPlayers(response) {
        if (!Array.isArray(response)) return [];
        return response.slice(0, 15).map((player, index) => ({
            pos: index + 1,
            name: player.player.name,
            photo: player.player.photo,
            age: player.player.age,
            team: player.statistics[0].team.name,
            teamLogo: player.statistics[0].team.logo,
            goals: player.statistics[0].goals.total || 0,
            assists: player.statistics[0].goals.assists || 0,
            matches: player.statistics[0].games.appearences || 0,
            minutes: player.statistics[0].games.minutes || 0
        }));
    },

    // ========== HEAD TO HEAD ==========
    async getHeadToHead(team1Id, team2Id) {
        const data = await this.fetchAPI('fixtures/headtohead', { h2h: `${team1Id}-${team2Id}`, last: 10 });
        return this.formatFixtures(data.response || []);
    },

    // ========== TEAM SEARCH ==========
    async searchTeams(query) {
        const data = await this.fetchAPI('teams', { search: query });
        if (!data.response) return [];
        return data.response.map(team => ({
            id: team.team.id,
            name: team.team.name,
            logo: team.team.logo,
            country: team.team.country
        }));
    },

    // ========== API STATUS ==========
    async checkStatus() {
        try {
            const data = await this.fetchAPI('status');
            return {
                account: data.response?.account,
                requests: data.response?.requests,
                subscription: data.response?.subscription
            };
        } catch (error) {
            return null;
        }
    }
};

window.API_FOOTBALL = API_FOOTBALL;
