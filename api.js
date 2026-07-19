// API-Football Integration Service
const API_FOOTBALL = {
    baseURL: 'https://v3.football.api-sports.io',
    apiKey: '6c33cc89febaeebd137f00b8ecde62a2',
    
    // League IDs mapping for API-Football
    leagues: {
        'premier-league': { id: 39, season: 2024 },
        'championship': { id: 40, season: 2024 },
        'la-liga': { id: 140, season: 2024 },
        'bundesliga': { id: 78, season: 2024 },
        'serie-a': { id: 135, season: 2024 },
        'ligue-1': { id: 61, season: 2024 },
        'eredivisie': { id: 88, season: 2024 },
        'liga-portugal': { id: 94, season: 2024 },
        'brasileirao': { id: 71, season: 2024 },
        'liga-mx': { id: 262, season: 2024 },
        'mls': { id: 253, season: 2024 },
        'champions-league': { id: 2, season: 2024 },
        'europa-league': { id: 3, season: 2024 },
        'copa-libertadores': { id: 13, season: 2024 },
        'copa-sudamericana': { id: 14, season: 2024 },
        'liga-argentina': { id: 128, season: 2024 },
        'copa-argentina': { id: 129, season: 2024 },
        'fa-cup': { id: 45, season: 2024 },
        'ligue-1-france': { id: 61, season: 2024 },
        'brasileirao-b': { id: 72, season: 2024 },
        'veikkausliiga': { id: 244, season: 2024 },
        'eliteserien': { id: 103, season: 2024 },
        'northern-championship': { id: 104, season: 2024 }
    },

    headers: {
        'x-apisports-key': '6c33cc89febaeebd137f00b8ecde62a2'
    },

    // Fetch standings for a league
    async getStandings(leagueId) {
        try {
            const league = this.leagues[leagueId];
            if (!league) throw new Error('Liga no encontrada');

            const response = await fetch(
                `${this.baseURL}/standings?league=${league.id}&season=${league.season}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

            const data = await response.json();
            return this.formatStandings(data.response, leagueId);
        } catch (error) {
            console.error('Error fetching standings:', error);
            throw error;
        }
    },

    // Format standings data
    formatStandings(response, leagueId) {
        if (!response || !response[0] || !response[0].league || !response[0].league.standings) {
            return [];
        }

        const standings = response[0].league.standings[0];
        return standings.map((team, index) => ({
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

    // Parse form string (e.g., "WWDLW") into array
    parseForm(formString) {
        if (!formString) return [];
        return formString.split('').slice(-5);
    },

    // Fetch fixtures for a league
    async getFixtures(leagueId, date = null) {
        try {
            const league = this.leagues[leagueId];
            if (!league) throw new Error('Liga no encontrada');

            let url = `${this.baseURL}/fixtures?league=${league.id}&season=${league.season}`;
            if (date) {
                url += `&date=${date}`;
            } else {
                // Get current date
                const today = new Date().toISOString().split('T')[0];
                url += `&date=${today}`;
            }

            const response = await fetch(url, { headers: this.headers });

            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

            const data = await response.json();
            return this.formatFixtures(data.response);
        } catch (error) {
            console.error('Error fetching fixtures:', error);
            throw error;
        }
    },

    // Format fixtures data
    formatFixtures(response) {
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
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(
                `${this.baseURL}/fixtures?date=${today}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

            const data = await response.json();
            return this.formatFixtures(data.response);
        } catch (error) {
            console.error('Error fetching today matches:', error);
            throw error;
        }
    },

    // Fetch live matches
    async getLiveMatches() {
        try {
            const response = await fetch(
                `${this.baseURL}/fixtures?live=all`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

            const data = await response.json();
            return this.formatFixtures(data.response);
        } catch (error) {
            console.error('Error fetching live matches:', error);
            throw error;
        }
    },

    // Fetch team statistics
    async getTeamStatistics(teamId, leagueId) {
        try {
            const league = this.leagues[leagueId];
            if (!league) throw new Error('Liga no encontrada');

            const response = await fetch(
                `${this.baseURL}/teams/statistics?team=${teamId}&league=${league.id}&season=${league.season}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

            const data = await response.json();
            return this.formatTeamStats(data.response);
        } catch (error) {
            console.error('Error fetching team statistics:', error);
            throw error;
        }
    },

    // Format team statistics
    formatTeamStats(response) {
        return {
            fixtures: response.fixtures,
            goals: response.goals,
            biggest: response.biggest,
            cleanSheet: response.clean_sheet,
            failedToScore: response.failed_to_score,
            lineups: response.lineups,
            cards: response.cards
        };
    },

    // Fetch top scorers for a league
    async getTopScorers(leagueId) {
        try {
            const league = this.leagues[leagueId];
            if (!league) throw new Error('Liga no encontrada');

            const response = await fetch(
                `${this.baseURL}/players/topscorers?league=${league.id}&season=${league.season}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

            const data = await response.json();
            return this.formatTopScorers(data.response);
        } catch (error) {
            console.error('Error fetching top scorers:', error);
            throw error;
        }
    },

    // Format top scorers
    formatTopScorers(response) {
        return response.slice(0, 10).map((player, index) => ({
            pos: index + 1,
            name: player.player.name,
            photo: player.player.photo,
            team: player.statistics[0].team.name,
            teamLogo: player.statistics[0].team.logo,
            goals: player.statistics[0].goals.total,
            assists: player.statistics[0].goals.assists,
            matches: player.statistics[0].games.appearences,
            minutes: player.statistics[0].games.minutes
        }));
    },

    // Fetch head to head
    async getHeadToHead(team1Id, team2Id) {
        try {
            const response = await fetch(
                `${this.baseURL}/fixtures/headtohead?h2h=${team1Id}-${team2Id}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

            const data = await response.json();
            return this.formatFixtures(data.response);
        } catch (error) {
            console.error('Error fetching head to head:', error);
            throw error;
        }
    },

    // Fetch team fixtures
    async getTeamFixtures(teamId, last = 5) {
        try {
            const response = await fetch(
                `${this.baseURL}/fixtures?team=${teamId}&last=${last}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

            const data = await response.json();
            return this.formatFixtures(data.response);
        } catch (error) {
            console.error('Error fetching team fixtures:', error);
            throw error;
        }
    },

    // Search teams
    async searchTeams(query) {
        try {
            const response = await fetch(
                `${this.baseURL}/teams?search=${encodeURIComponent(query)}`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

            const data = await response.json();
            return response.data.map(team => ({
                id: team.team.id,
                name: team.team.name,
                logo: team.team.logo,
                country: team.team.country,
                founded: team.team.founded
            }));
        } catch (error) {
            console.error('Error searching teams:', error);
            throw error;
        }
    },

    // Check API status
    async checkStatus() {
        try {
            const response = await fetch(
                `${this.baseURL}/status`,
                { headers: this.headers }
            );

            if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

            const data = await response.json();
            return {
                account: data.response.account,
                requests: data.response.requests,
                subscription: data.response.subscription
            };
        } catch (error) {
            console.error('Error checking API status:', error);
            throw error;
        }
    }
};

// Export for use in app
window.API_FOOTBALL = API_FOOTBALL;
