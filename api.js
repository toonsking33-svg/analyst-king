// API-Football Integration Service - Fixed Version
const API_FOOTBALL = {
    baseURL: 'https://v3.football.api-sports.io',
    apiKey: '6c33cc89febaeebd137f00b8ecde62a2',
    
    // League IDs mapping for API-Football (current season 2025)
    leagues: {
        'premier-league': { id: 39, season: 2025 },
        'championship': { id: 40, season: 2025 },
        'laliga': { id: 140, season: 2025 },
        'bundesliga': { id: 78, season: 2025 },
        'serie-a': { id: 135, season: 2025 },
        'ligue1': { id: 61, season: 2025 },
        'eredivisie': { id: 88, season: 2025 },
        'liga-portugal': { id: 94, season: 2025 },
        'brasileirao': { id: 71, season: 2025 },
        'liga-mx': { id: 262, season: 2025 },
        'mls': { id: 253, season: 2025 },
        'champions-league': { id: 2, season: 2025 },
        'europa-league': { id: 3, season: 2025 },
        'libertadores': { id: 13, season: 2025 },
        'sudamericana': { id: 14, season: 2025 },
        'liga-argentina': { id: 128, season: 2025 },
        'copa-argentina': { id: 129, season: 2025 },
        'fa-cup': { id: 45, season: 2025 },
        'brasileirao-b': { id: 72, season: 2025 },
        'veikkausliiga': { id: 244, season: 2025 },
        'eliteserien': { id: 103, season: 2025 },
        'northern-championship': { id: 104, season: 2025 }
    },

    headers: {
        'x-apisports-key': '6c33cc89febaeebd137f00b8ecde62a2'
    },

    // Generic fetch with retry
    async fetchWithRetry(url, retries = 2) {
        for (let i = 0; i <= retries; i++) {
            try {
                const response = await fetch(url, { 
                    headers: this.headers,
                    mode: 'cors'
                });
                
                if (response.status === 429) {
                    // Rate limited - wait and retry
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                return data;
            } catch (error) {
                if (i === retries) throw error;
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    },

    // Fetch standings for a league
    async getStandings(leagueId) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');

        const data = await this.fetchWithRetry(
            `${this.baseURL}/standings?league=${league.id}&season=${league.season}`
        );
        return this.formatStandings(data.response, leagueId);
    },

    formatStandings(response, leagueId) {
        if (!response || !response[0] || !response[0].league || !response[0].league.standings) {
            return [];
        }

        const standings = response[0].league.standings[0];
        if (!standings) return [];

        return standings.map((team) => ({
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
            form: this.parseForm(team.form),
            description: team.description || ''
        }));
    },

    parseForm(formString) {
        if (!formString) return [];
        return formString.split('').slice(-5);
    },

    // Fetch fixtures for a league
    async getFixtures(leagueId, date = null) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');

        let url = `${this.baseURL}/fixtures?league=${league.id}&season=${league.season}`;
        if (date) {
            url += `&date=${date}`;
        } else {
            const today = new Date().toISOString().split('T')[0];
            url += `&date=${today}`;
        }

        const data = await this.fetchWithRetry(url);
        return this.formatFixtures(data.response || []);
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
                score: match.goals.home
            },
            away: {
                id: match.teams.away.id,
                name: match.teams.away.name,
                logo: match.teams.away.logo,
                score: match.goals.away
            }
        }));
    },

    // Fetch today's matches across all leagues
    async getTodayMatches() {
        const today = new Date().toISOString().split('T')[0];
        const data = await this.fetchWithRetry(
            `${this.baseURL}/fixtures?date=${today}`
        );
        return this.formatFixtures(data.response || []);
    },

    // Fetch live matches
    async getLiveMatches() {
        const data = await this.fetchWithRetry(
            `${this.baseURL}/fixtures?live=all`
        );
        return this.formatFixtures(data.response || []);
    },

    // Fetch top scorers for a league
    async getTopScorers(leagueId) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');

        const data = await this.fetchWithRetry(
            `${this.baseURL}/players/topscorers?league=${league.id}&season=${league.season}`
        );
        return this.formatTopScorers(data.response || []);
    },

    formatTopScorers(response) {
        if (!Array.isArray(response)) return [];
        return response.slice(0, 10).map((player, index) => ({
            pos: index + 1,
            name: player.player.name,
            photo: player.player.photo,
            team: player.statistics[0].team.name,
            teamLogo: player.statistics[0].team.logo,
            goals: player.statistics[0].goals.total || 0,
            assists: player.statistics[0].goals.assists || 0,
            matches: player.statistics[0].games.appearences || 0,
            minutes: player.statistics[0].games.minutes || 0
        }));
    },

    // Search teams
    async searchTeams(query) {
        const data = await this.fetchWithRetry(
            `${this.baseURL}/teams?search=${encodeURIComponent(query)}`
        );
        if (!data.response) return [];
        return data.response.map(team => ({
            id: team.team.id,
            name: team.team.name,
            logo: team.team.logo,
            country: team.team.country,
            founded: team.team.founded
        }));
    },

    // Check API status
    async checkStatus() {
        try {
            const data = await this.fetchWithRetry(`${this.baseURL}/status`);
            return {
                account: data.response.account,
                requests: data.response.requests,
                subscription: data.response.subscription
            };
        } catch (error) {
            console.error('API status check failed:', error);
            return null;
        }
    }
};

window.API_FOOTBALL = API_FOOTBALL;
