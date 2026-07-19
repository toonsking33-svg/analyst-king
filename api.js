// API-Football Integration - Optimized for Sports Betting Analysis
// July 2026 - Correct seasons for current data
const API_FOOTBALL = {
    baseURL: 'https://v3.football.api-sports.io',
    apiKey: '6c33cc89febaeebd137f00b8ecde62a2',
    
    // League IDs with correct current seasons
    // European leagues 2025/2026 season = season 2025
    // Calendar-year leagues = season 2026
    leagues: {
        'premier-league': { id: 39, season: 2025, name: 'Premier League' },
        'championship': { id: 40, season: 2025, name: 'Championship' },
        'laliga': { id: 140, season: 2025, name: 'LaLiga' },
        'bundesliga': { id: 78, season: 2025, name: 'Bundesliga' },
        'serie-a': { id: 135, season: 2025, name: 'Serie A' },
        'ligue1': { id: 61, season: 2025, name: 'Ligue 1' },
        'eredivisie': { id: 88, season: 2025, name: 'Eredivisie' },
        'liga-portugal': { id: 94, season: 2025, name: 'Liga Portugal' },
        'brasileirao': { id: 71, season: 2026, name: 'Brasileirão' },
        'liga-mx': { id: 262, season: 2025, name: 'Liga MX' },
        'mls': { id: 253, season: 2026, name: 'MLS' },
        'champions-league': { id: 2, season: 2025, name: 'Champions League' },
        'europa-league': { id: 3, season: 2025, name: 'Europa League' },
        'libertadores': { id: 13, season: 2026, name: 'Libertadores' },
        'sudamericana': { id: 14, season: 2026, name: 'Sudamericana' },
        'liga-argentina': { id: 128, season: 2026, name: 'Liga Argentina' },
        'copa-argentina': { id: 129, season: 2026, name: 'Copa Argentina' },
        'fa-cup': { id: 45, season: 2025, name: 'FA Cup' },
        'brasileirao-b': { id: 72, season: 2026, name: 'Brasileirão B' },
        'veikkausliiga': { id: 244, season: 2026, name: 'Veikkausliiga' },
        'eliteserien': { id: 103, season: 2026, name: 'Eliteserien' },
        'northern-championship': { id: 104, season: 2026, name: 'Norwegian 1st Division' }
    },

    headers: {
        'x-apisports-key': '6c33cc89febaeebd137f00b8ecde62a2'
    },

    // Generic fetch with retry and rate limit handling
    async fetchAPI(url, retries = 2) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, { 
                    headers: this.headers,
                    mode: 'cors'
                });
                
                if (response.status === 429) {
                    const waitTime = (attempt + 1) * 3000;
                    console.warn(`Rate limited. Waiting ${waitTime}ms...`);
                    await new Promise(r => setTimeout(r, waitTime));
                    continue;
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.errors && Object.keys(data.errors).length > 0) {
                    throw new Error(JSON.stringify(data.errors));
                }
                
                return data;
            } catch (error) {
                console.error(`API attempt ${attempt + 1} failed:`, error.message);
                if (attempt === retries) throw error;
                await new Promise(r => setTimeout(r, 1500));
            }
        }
    },

    // Try multiple seasons for a league (fallback)
    async fetchWithSeasonFallback(leagueId, endpoint) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error(`Liga '${leagueId}' no encontrada`);

        // Try current season first, then previous
        const seasonsToTry = [league.season, league.season - 1];
        
        for (const season of seasonsToTry) {
            try {
                const data = await this.fetchAPI(
                    `${this.baseURL}/${endpoint}?league=${league.id}&season=${season}`
                );
                if (data.response && data.response.length > 0) {
                    return { data: data.response, season };
                }
            } catch (e) {
                console.warn(`Season ${season} failed for ${leagueId}:`, e.message);
            }
        }
        
        throw new Error(`No hay datos disponibles para ${league.name}`);
    },

    // ========== STANDINGS ==========
    async getStandings(leagueId) {
        const { data } = await this.fetchWithSeasonFallback(leagueId, 'standings');
        return this.formatStandings(data);
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
            form: this.parseForm(team.form),
            description: team.description || '',
            // Betting-relevant stats
            homePj: team.home?.played || 0,
            homeG: team.home?.win || 0,
            homePts: team.home?.points || 0,
            awayPj: team.away?.played || 0,
            awayG: team.away?.win || 0,
            awayPts: team.away?.points || 0
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

        let url = `${this.baseURL}/fixtures?league=${league.id}&season=${league.season}`;
        url += date ? `&date=${date}` : `&date=${new Date().toISOString().split('T')[0]}`;

        const data = await this.fetchAPI(url);
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

    async getNextFixtures(leagueId, next = 5) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');
        
        const data = await this.fetchAPI(
            `${this.baseURL}/fixtures?league=${league.id}&season=${league.season}&next=${next}`
        );
        return this.formatFixtures(data.response || []);
    },

    async getLastResults(leagueId, last = 5) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');
        
        const data = await this.fetchAPI(
            `${this.baseURL}/fixtures?league=${league.id}&season=${league.season}&last=${last}`
        );
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
            },
            // Betting-relevant: half-time scores
            ht: {
                home: match.score?.halftime?.home,
                away: match.score?.halftime?.away
            }
        }));
    },

    // ========== TEAM STATISTICS (Critical for betting) ==========
    async getTeamStatistics(teamId, leagueId) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');

        const data = await this.fetchAPI(
            `${this.baseURL}/teams/statistics?team=${teamId}&league=${league.id}&season=${league.season}`
        );
        return data.response || {};
    },

    // ========== TOP SCORERS ==========
    async getTopScorers(leagueId) {
        const { data } = await this.fetchWithSeasonFallback(leagueId, 'players/topscorers');
        return this.formatPlayers(data);
    },

    async getTopAssists(leagueId) {
        const { data } = await this.fetchWithSeasonFallback(leagueId, 'players/topassists');
        return this.formatPlayers(data);
    },

    formatPlayers(response) {
        if (!Array.isArray(response)) return [];
        return response.slice(0, 15).map((player, index) => ({
            pos: index + 1,
            name: player.player.name,
            photo: player.player.photo,
            age: player.player.age,
            nationality: player.player.nationality,
            position: player.player.position,
            team: player.statistics[0].team.name,
            teamLogo: player.statistics[0].team.logo,
            goals: player.statistics[0].goals.total || 0,
            assists: player.statistics[0].goals.assists || 0,
            matches: player.statistics[0].games.appearences || 0,
            minutes: player.statistics[0].games.minutes || 0,
            rating: player.statistics[0].games.rating || '0',
            shotsTotal: player.statistics[0].shots.total || 0,
            shotsOn: player.statistics[0].shots.on || 0,
            passesKey: player.statistics[0].passes.key || 0,
            tackles: player.statistics[0].tackles.total || 0
        }));
    },

    // ========== HEAD TO HEAD (Crucial for betting) ==========
    async getHeadToHead(team1Id, team2Id) {
        const data = await this.fetchAPI(
            `${this.baseURL}/fixtures/headtohead?h2h=${team1Id}-${team2Id}&last=10`
        );
        return this.formatFixtures(data.response || []);
    },

    // ========== TEAM FIXTURES ==========
    async getTeamLastFixtures(teamId, last = 5) {
        const data = await this.fetchAPI(
            `${this.baseURL}/fixtures?team=${teamId}&last=${last}`
        );
        return this.formatFixtures(data.response || []);
    },

    async getTeamNextFixtures(teamId, next = 5) {
        const data = await this.fetchAPI(
            `${this.baseURL}/fixtures?team=${teamId}&next=${next}`
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
            country: team.team.country,
            founded: team.team.founded,
            venue: team.venue?.name || ''
        }));
    },

    // ========== ODDS (If available in free plan) ==========
    async getMatchOdds(fixtureId) {
        try {
            const data = await this.fetchAPI(
                `${this.baseURL}/odds?fixture=${fixtureId}`
            );
            return data.response || [];
        } catch (e) {
            console.warn('Odds not available:', e.message);
            return [];
        }
    },

    // ========== PREDICTIONS ==========
    async getPredictions(fixtureId) {
        try {
            const data = await this.fetchAPI(
                `${this.baseURL}/predictions?fixture=${fixtureId}`
            );
            return data.response || [];
        } catch (e) {
            console.warn('Predictions not available:', e.message);
            return [];
        }
    },

    // ========== INJURIES ==========
    async getTeamInjuries(teamId, leagueId) {
        try {
            const league = this.leagues[leagueId];
            const data = await this.fetchAPI(
                `${this.baseURL}/injuries?team=${teamId}&league=${league.id}&season=${league.season}`
            );
            return data.response || [];
        } catch (e) {
            return [];
        }
    },

    // ========== STANDINGS (Full with home/away splits) ==========
    async getHomeStandings(leagueId) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');

        const data = await this.fetchAPI(
            `${this.baseURL}/standings?league=${league.id}&season=${league.season}`
        );
        
        if (!data.response?.[0]?.league?.standings) return [];
        
        // home standings are index 1
        const homeStanding = data.response[0].league.standings[1] || data.response[0].league.standings[0];
        return this.formatStandings([{ league: { standings: [homeStanding] } }]);
    },

    async getAwayStandings(leagueId) {
        const league = this.leagues[leagueId];
        if (!league) throw new Error('Liga no encontrada');

        const data = await this.fetchAPI(
            `${this.baseURL}/standings?league=${league.id}&season=${league.season}`
        );
        
        if (!data.response?.[0]?.league?.standings) return [];
        
        // away standings are index 2
        const awayStanding = data.response[0].league.standings[2] || data.response[0].league.standings[0];
        return this.formatStandings([{ league: { standings: [awayStanding] } }]);
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
            console.error('API status check failed:', error);
            return null;
        }
    }
};

window.API_FOOTBALL = API_FOOTBALL;
