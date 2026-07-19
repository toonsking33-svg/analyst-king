// API-Football - Calls backend proxy
const API_FOOTBALL = {
    baseURL: window.location.origin + '/api/football',

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

    async getStandings(leagueId) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');
        const data = await this.fetchAPI('standings', { league: league.id, season: 2024 });
        return this.formatStandings(data.response || []);
    },

    formatStandings(response) {
        if (!response?.[0]?.league?.standings?.[0]) return [];
        return response[0].league.standings[0].map(team => ({
            pos: team.rank, team: team.team.name, teamId: team.team.id,
            logo: team.team.logo, pj: team.all.played, g: team.all.win,
            e: team.all.draw, p: team.all.lose, gf: team.all.goals.for,
            gc: team.all.goals.against, dif: team.goalsDiff, pts: team.points,
            form: (team.form || '').split('').slice(-5)
        }));
    },

    async getTodayMatches() {
        const today = new Date().toISOString().split('T')[0];
        const promises = Object.values(this.leagues).map(league =>
            this.fetchAPI('fixtures', { league: league.id, date: today })
                .then(data => this.formatFixtures(data.response || []))
                .catch(() => [])
        );
        const results = await Promise.all(promises);
        return results.flat();
    },

    async getFixturesForDate(date) {
        const data = await this.fetchAPI('fixtures', { date });
        return this.formatFixtures(data.response || []);
    },

    async getFixturesByLeague(leagueId, date = null) {
        const league = this.leagues[leagueId];
        if (!league) return [];
        const d = date || new Date().toISOString().split('T')[0];
        const data = await this.fetchAPI('fixtures', { league: league.id, date: d });
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
            referee: match.fixture.referee,
            venue: match.fixture.venue?.name || '',
            league: {
                id: match.league.id, name: match.league.name,
                country: match.league.country, logo: match.league.logo, round: match.league.round
            },
            home: {
                id: match.teams.home.id, name: match.teams.home.name,
                logo: match.teams.home.logo, score: match.goals.home,
                winner: match.teams.home.winner,
                scoreHT: match.score?.halftime?.home ?? null
            },
            away: {
                id: match.teams.away.id, name: match.teams.away.name,
                logo: match.teams.away.logo, score: match.goals.away,
                winner: match.teams.away.winner,
                scoreHT: match.score?.halftime?.away ?? null
            }
        }));
    },

    // ========== PREDICTIONS (O/U, BTTS, etc.) ==========
    async getPredictions(fixtureId) {
        const data = await this.fetchAPI('predictions', { fixture: fixtureId });
        const r = data.response?.[0];
        if (!r) return null;
        return this.formatPredictions(r);
    },

    formatPredictions(pred) {
        const ou = {};
        if (pred.predictions?.over_under) {
            pred.predictions.over_under.forEach(item => {
                const val = parseFloat(item.value);
                ou[val] = { under: parseFloat(item.under), over: parseFloat(item.over) };
            });
        }

        return {
            advice: pred.predictions?.advice || '',
            homeWin: pred.predictions?.percent?.home || '0%',
            draw: pred.predictions?.percent?.draw || '0%',
            awayWin: pred.predictions?.percent?.away || '0%',
            btts: pred.predictions?.btts || '',
            overUnder: ou,
            goals: {
                home: pred.predictions?.goals?.home || '',
                away: pred.predictions?.goals?.away || ''
            },
            comparison: {
                form: pred.comparison?.form || {},
                h2h: pred.comparison?.h2h || {},
                attitude: pred.comparison?.attitude || {}
            }
        };
    },

    // ========== FIXTURE STATISTICS (corners, shots, etc.) ==========
    async getFixtureStatistics(fixtureId) {
        const data = await this.fetchAPI('fixtures/statistics', { fixture: fixtureId });
        if (!data.response || data.response.length < 2) return null;
        return this.formatStatistics(data.response);
    },

    formatStatistics(response) {
        const extractStats = (statsArray) => {
            const stats = {};
            statsArray.forEach(s => {
                const key = s.type.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
                stats[key] = s.value;
            });
            return stats;
        };

        const home = extractStats(response[0]?.statistics || []);
        const away = extractStats(response[1]?.statistics || []);

        return {
            home, away,
            summary: {
                shotsOnGoal: { home: home.shots_on_goal || 0, away: away.shots_on_goal || 0 },
                shotsOffGoal: { home: home.shots_off_goal || 0, away: away.shots_off_goal || 0 },
                totalShots: { home: home.total_shots || 0, away: away.total_shots || 0 },
                cornerKicks: { home: home.corner_kicks || 0, away: away.corner_kicks || 0 },
                offsides: { home: home.offsides || 0, away: away.offsides || 0 },
                ballPossession: { home: home.ball_possession || '0%', away: away.ball_possession || '0%' },
                yellowCards: { home: home.yellow_cards || 0, away: away.yellow_cards || 0 },
                redCards: { home: home.red_cards || 0, away: away.red_cards || 0 },
                goalKicks: { home: home.goal_kicks || 0, away: away.goal_kicks || 0 },
                attacks: { home: home.attacks || 0, away: away.attacks || 0 },
                dangerousAttacks: { home: home.dangerous_attacks || 0, away: away.dangerous_attacks || 0 }
            }
        };
    },

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
