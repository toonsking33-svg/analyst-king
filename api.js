// API-Football Integration - Fixed for Free Plan
// Free plan: seasons 2022-2024 only for standings
// Fixtures/today work fine with current date
const API_FOOTBALL = {
    baseURL: 'https://v3.football.api-sports.io',
    apiKey: '6c33cc89febaeebd137f00b8ecde62a2',
    
    // Free plan only allows seasons 2022-2024 for standings
    // But fixtures by date work without season restriction
    leagues: {
        'premier-league': { id: 39, name: 'Premier League' },
        'championship': { id: 40, name: 'Championship' },
        'laliga': { id: 140, name: 'LaLiga' },
        'bundesliga': { id: 78, name: 'Bundesliga' },
        'serie-a': { id: 135, name: 'Serie A' },
        'ligue1': { id: 61, name: 'Ligue 1' },
        'eredivisie': { id: 88, name: 'Eredivisie' },
        'liga-portugal': { id: 94, name: 'Liga Portugal' },
        'brasileirao': { id: 71, name: 'Brasileirão' },
        'liga-mx': { id: 262, name: 'Liga MX' },
        'mls': { id: 253, name: 'MLS' },
        'champions-league': { id: 2, name: 'Champions League' },
        'europa-league': { id: 3, name: 'Europa League' },
        'libertadores': { id: 13, name: 'Libertadores' },
        'sudamericana': { id: 14, name: 'Sudamericana' },
        'liga-argentina': { id: 128, name: 'Liga Argentina' },
        'copa-argentina': { id: 129, name: 'Copa Argentina' },
        'fa-cup': { id: 45, name: 'FA Cup' },
        'brasileirao-b': { id: 72, name: 'Brasileirão B' },
        'veikkausliiga': { id: 244, name: 'Veikkausliiga' },
        'eliteserien': { id: 103, name: 'Eliteserien' },
        'northern-championship': { id: 104, name: 'Norwegian 1st Division' }
    },

    headers: { 'x-apisports-key': '6c33cc89febaeebd137f00b8ecde62a2' },

    // Standings season (free plan: max 2024)
    getStandingsSeason(leagueId) {
        // Use 2024 for all leagues (last available on free plan)
        return 2024;
    },

    async fetchAPI(url, retries = 2) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, { headers: this.headers, mode: 'cors' });
                if (response.status === 429) {
                    await new Promise(r => setTimeout(r, (attempt + 1) * 5000));
                    continue;
                }
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (data.errors && Object.keys(data.errors).length > 0) {
                    const errMsg = Object.values(data.errors).join(', ');
                    if (errMsg.includes('Free plans do not have access')) {
                        throw new Error('FREE_PLAN_LIMIT');
                    }
                    throw new Error(errMsg);
                }
                return data;
            } catch (error) {
                if (attempt === retries) throw error;
                await new Promise(r => setTimeout(r, 1500));
            }
        }
    },

    // ========== STANDINGS (season 2024 for free plan) ==========
    async getStandings(leagueId) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');
        const season = this.getStandingsSeason(leagueId);
        const data = await this.fetchAPI(
            `${this.baseURL}/standings?league=${league.id}&season=${season}`
        );
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

    // ========== FIXTURES (by date - works without season) ==========
    async getFixtures(leagueId, date = null) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');
        const d = date || new Date().toISOString().split('T')[0];
        const data = await this.fetchAPI(
            `${this.baseURL}/fixtures?league=${league.id}&date=${d}`
        );
        return this.formatFixtures(data.response || []);
    },

    async getTodayMatches() {
        const today = new Date().toISOString().split('T')[0];
        const data = await this.fetchAPI(`${this.baseURL}/fixtures?date=${today}`);
        return this.formatFixtures(data.response || []);
    },

    async getLiveMatches() {
        const data = await this.fetchAPI(`${this.baseURL}/fixtures?live=all`);
        return this.formatFixtures(data.response || []);
    },

    // Get fixtures for specific league from today's matches
    getFixturesForLeague(matches, leagueId) {
        const league = this.leagues[leagueId];
        if (!league) return [];
        return matches.filter(m => m.league.id === league.id);
    },

    // Get all matches grouped by league for today
    async getTodayMatchesByLeague() {
        const matches = await this.getTodayMatches();
        const grouped = {};
        for (const match of matches) {
            const leagueName = match.league.name;
            if (!grouped[leagueName]) grouped[leagueName] = [];
            grouped[leagueName].push(match);
        }
        return grouped;
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

    // ========== TOP SCORERS (2024 for free plan) ==========
    async getTopScorers(leagueId) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');
        const data = await this.fetchAPI(
            `${this.baseURL}/players/topscorers?league=${league.id}&season=2024`
        );
        return this.formatPlayers(data.response || []);
    },

    async getTopAssists(leagueId) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');
        const data = await this.fetchAPI(
            `${this.baseURL}/players/topassists?league=${league.id}&season=2024`
        );
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
        const data = await this.fetchAPI(
            `${this.baseURL}/fixtures/headtohead?h2h=${team1Id}-${team2Id}&last=10`
        );
        return this.formatFixtures(data.response || []);
    },

    // ========== TEAM SEARCH ==========
    async searchTeams(query) {
        const data = await this.fetchAPI(
            `${this.baseURL}/teams?search=${encodeURIComponent(query)}`
        );
        if (!data.response) return [];
        return data.response.map(team => ({
            id: team.team.id,
            name: team.team.name,
            logo: team.team.logo,
            country: team.team.country
        }));
    },

    // ========== PREDICTIONS (for specific fixture) ==========
    async getPredictions(fixtureId) {
        try {
            const data = await this.fetchAPI(
                `${this.baseURL}/predictions?fixture=${fixtureId}`
            );
            return data.response || [];
        } catch (e) {
            return [];
        }
    },

    // ========== API STATUS ==========
    async checkStatus() {
        try {
            const data = await this.fetchAPI(`${this.baseURL}/status`);
            return {
                account: data.response.account,
                requests: data.response.requests,
                subscription: data.response.subscription
            };
        } catch (error) {
            return null;
        }
    }
};

window.API_FOOTBALL = API_FOOTBALL;
