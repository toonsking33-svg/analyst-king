// Analyst King - Betting Focused App
class AnalystKingApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentMatch = null;
        this.isSidebarOpen = false;
        this.apiAvailable = false;
        this.todayMatches = [];
        this.analyzedCount = 0;
        this.init();
    }

    async init() {
        this.bindEvents();
        this.populateLeagues();
        this.populateLeagueSelects();
        await this.checkApiConnection();
        if (this.apiAvailable) {
            await this.loadTodayMatches();
        } else {
            this.showEmpty('matchesList', 'Sin conexion con API-Football');
        }
        document.getElementById('totalLeagues').textContent = LEAGUES.length;
    }

    async checkApiConnection() {
        try {
            const status = await API_FOOTBALL.checkStatus();
            if (status?.account) {
                this.apiAvailable = true;
                this.updateApiStatus(true, status.requests);
                return;
            }
        } catch (e) { console.error('API check:', e); }
        this.apiAvailable = false;
        this.updateApiStatus(false);
    }

    updateApiStatus(connected, req = null) {
        const el = document.getElementById('apiStatus');
        if (connected) {
            const t = req ? ` (${req.used}/${req.limit_daily})` : '';
            el.innerHTML = `<i class="fas fa-circle"></i><span>API OK${t}</span>`;
            el.classList.remove('disconnected');
        } else {
            el.innerHTML = '<i class="fas fa-circle"></i><span>Sin conexion</span>';
            el.classList.add('disconnected');
        }
    }

    bindEvents() {
        document.querySelectorAll('.nav-item[data-section]').forEach(i => {
            i.addEventListener('click', e => { e.preventDefault(); this.navigateTo(i.dataset.section); });
        });
        document.getElementById('menuToggle').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeModal').addEventListener('click', () => this.closeSettings());
        document.getElementById('toggleApiKey').addEventListener('click', () => this.toggleApiKeyVis());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('sendMessage').addEventListener('click', () => this.sendChat());
        document.getElementById('chatInput').addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendChat(); }
        });
        document.querySelectorAll('.quick-action').forEach(b => {
            b.addEventListener('click', () => this.sendQuick(b.dataset.prompt));
        });
        document.getElementById('backToDashboard').addEventListener('click', () => this.navigateTo('dashboard'));
        document.getElementById('analyzeMatchBtn').addEventListener('click', () => this.analyzeCurrentMatch());
        document.getElementById('generatePredictions').addEventListener('click', () => this.generatePredictions());
        document.getElementById('refreshMatches').addEventListener('click', () => this.loadTodayMatches());
        document.getElementById('predictionLeagueFilter').addEventListener('change', () => this.loadPredictionCards());
        document.getElementById('searchInput').addEventListener('input', e => this.handleSearch(e.target.value));
        document.getElementById('settingsModal').addEventListener('click', e => {
            if (e.target === document.getElementById('settingsModal')) this.closeSettings();
        });
        document.addEventListener('click', e => {
            if (this.isSidebarOpen && !e.target.closest('.sidebar') && !e.target.closest('#menuToggle')) this.toggleSidebar();
        });
    }

    // ========== MATCHES ==========
    async loadTodayMatches() {
        this.showLoading();
        try {
            const trackedIds = new Set(Object.values(API_FOOTBALL.leagues).map(l => l.id));
            let matches = [];
            let matchedDate = null;
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                const data = i === 0 ? await API_FOOTBALL.getTodayMatches() : await API_FOOTBALL.getFixturesForDate(dateStr);
                const filtered = data.filter(m => trackedIds.has(m.league.id));
                if (filtered.length > 0) { matches = filtered; matchedDate = dateStr; break; }
            }
            this.todayMatches = matches;
            this.hideLoading();
            this.renderMatches(this.todayMatches);
            this.updateCount('totalMatches', this.todayMatches.length);
            this.updateCount('liveCount', this.todayMatches.filter(m => ['1H','2H','HT','LIVE','ET','P','BT'].includes(m.status)).length);
            const displayDate = matchedDate ? new Date(matchedDate).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Hoy';
            document.getElementById('dashboardSubtitle').textContent = `${displayDate} - ${this.todayMatches.length} partidos en tus ligas`;
            this.populateLeagueFilters();
        } catch (e) {
            console.error('Error loading matches:', e);
            this.hideLoading();
            this.showEmpty('matchesList', 'Error cargando partidos. Verifica la consola (F12).');
        }
    }

    populateLeagueFilters() {
        const leagueCounts = {};
        this.todayMatches.forEach(m => {
            if (!leagueCounts[m.league.id]) leagueCounts[m.league.id] = { name: m.league.name, count: 0 };
            leagueCounts[m.league.id].count++;
        });
        const select = document.getElementById('predictionLeagueFilter');
        select.innerHTML = '<option value="all">Todas las Ligas</option>' +
            Object.entries(leagueCounts).map(([id, l]) =>
                `<option value="${id}">${l.name} (${l.count})</option>`
            ).join('');
    }

    renderMatches(matches) {
        const c = document.getElementById('matchesList');
        if (!matches || matches.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-day"></i><p>No hay partidos hoy en tus ligas</p><small style="color:var(--text-muted)">Julio es temporada baja en Europa. Prob\u00e1 las ligas de verano: Amistosos, Allsvenskan, Liga MX.</small></div>';
            return;
        }
        const dl = this.defaultLogo();
        c.innerHTML = matches.map(m => {
            const t = new Date(m.date);
            const time = t.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            const isLive = ['1H','2H','HT','LIVE','ET','P','BT'].includes(m.status);
            const isDone = ['FT','AET','PEN','WO'].includes(m.status);
            let cls = 'upcoming', txt = time;
            if (isLive) { cls = 'live'; txt = m.elapsed ? `${m.elapsed}'` : 'LIVE'; }
            else if (isDone) { cls = 'finished'; txt = 'FT'; }

            const scoreHTML = (isLive || isDone) ? `<div class="match-score">${m.home.score ?? '-'} - ${m.away.score ?? '-'}</div>` : '';
            const htHTML = (isLive || isDone) && m.home.scoreHT != null ? `<div class="match-ht">HT: ${m.home.scoreHT} - ${m.away.scoreHT}</div>` : '';

            return `
                <div class="match-item clickable" data-id="${m.id}" onclick="app.openMatch(${m.id})">
                    <div class="match-league-tag">${m.league.name}</div>
                    <div class="match-teams">
                        <div class="match-team">
                            <img src="${m.home.logo || dl}" class="team-logo" onerror="this.src='${dl}'">
                            <span>${m.home.name}</span>
                        </div>
                        <div class="match-center">
                            ${scoreHTML}
                            ${htHTML}
                            <span class="match-status ${cls}">${txt}</span>
                        </div>
                        <div class="match-team">
                            <img src="${m.away.logo || dl}" class="team-logo" onerror="this.src='${dl}'">
                            <span>${m.away.name}</span>
                        </div>
                    </div>
                    <div class="match-actions">
                        <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); app.openMatch(${m.id})">
                            <i class="fas fa-chart-bar"></i> Detalle
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); app.quickAnalyze(${m.id})">
                            <i class="fas fa-robot"></i> IA
                        </button>
                    </div>
                </div>`;
        }).join('');
    }

    // ========== MATCH DETAIL ==========
    async openMatch(fixtureId) {
        const match = this.todayMatches.find(m => m.id === fixtureId);
        if (!match) return;
        this.currentMatch = match;
        this.navigateTo('match-detail');

        const dl = this.defaultLogo();
        const isLive = ['1H','2H','HT','LIVE','ET','P','BT'].includes(match.status);
        const isDone = ['FT','AET','PEN','WO'].includes(match.status);

        document.getElementById('matchDetailTitle').textContent = `${match.home.name} vs ${match.away.name}`;
        document.getElementById('matchDetailHero').innerHTML = `
            <div class="hero-match">
                <div class="hero-team">
                    <img src="${match.home.logo || dl}" class="hero-logo" onerror="this.src='${dl}'">
                    <span>${match.home.name}</span>
                </div>
                <div class="hero-center">
                    ${(isLive || isDone) ? `<div class="hero-score">${match.home.score ?? '-'} - ${match.away.score ?? '-'}</div>` : '<div class="hero-vs">VS</div>'}
                    ${match.home.scoreHT != null ? `<div class="hero-ht">HT: ${match.home.scoreHT} - ${match.away.scoreHT}</div>` : ''}
                    <div class="hero-info">${match.league.name} | ${new Date(match.date).toLocaleString('es')}</div>
                </div>
                <div class="hero-team">
                    <img src="${match.away.logo || dl}" class="hero-logo" onerror="this.src='${dl}'">
                    <span>${match.away.name}</span>
                </div>
            </div>`;

        // Load stats and predictions
        document.getElementById('goalsStats').innerHTML = '<div class="loading-mini">Cargando...</div>';
        document.getElementById('cornersStats').innerHTML = '<div class="loading-mini">Cargando...</div>';
        document.getElementById('overUnderStats').innerHTML = '<div class="loading-mini">Cargando...</div>';
        document.getElementById('bttsStats').innerHTML = '<div class="loading-mini">Cargando...</div>';
        document.getElementById('matchStatistics').innerHTML = '<div class="loading-mini">Cargando...</div>';
        document.getElementById('matchAIAnalysis').innerHTML = '<p class="text-muted">Haz clic en "Analizar con IA" para obtener un analisis.</p>';

        this.loadMatchStats(fixtureId);
        this.loadMatchPredictions(fixtureId);
    }

    async loadMatchStats(fixtureId) {
        try {
            const stats = await API_FOOTBALL.getFixtureStatistics(fixtureId);
            if (!stats) {
                document.getElementById('goalsStats').innerHTML = '<p class="text-muted">Sin datos</p>';
                document.getElementById('cornersStats').innerHTML = '<p class="text-muted">Sin datos</p>';
                document.getElementById('matchStatistics').innerHTML = '<p class="text-muted">Estadisticas no disponibles</p>';
                return;
            }
            const s = stats.summary;
            const match = this.currentMatch;

            // Goals
            const totalGoals = (match.home.score ?? 0) + (match.away.score ?? 0);
            const htGoals = match.home.scoreHT != null ? (match.home.scoreHT + match.away.scoreHT) : '-';
            document.getElementById('goalsStats').innerHTML = `
                <div class="stat-row"><span>Goles Totales</span><strong>${totalGoals}</strong></div>
                <div class="stat-row"><span>Goles 1er Tiempo</span><strong>${htGoals}</strong></div>
                <div class="stat-row"><span>Goles Local</span><strong>${match.home.score ?? 0}</strong></div>
                <div class="stat-row"><span>Goles Visitante</span><strong>${match.away.score ?? 0}</strong></div>`;

            // Corners
            const totalCorners = (s.cornerKicks.home || 0) + (s.cornerKicks.away || 0);
            document.getElementById('cornersStats').innerHTML = `
                <div class="stat-row"><span>Corners Totales</span><strong>${totalCorners}</strong></div>
                <div class="stat-row"><span>Corners Local</span><strong>${s.cornerKicks.home || 0}</strong></div>
                <div class="stat-row"><span>Corners Visitante</span><strong>${s.cornerKicks.away || 0}</strong></div>
                <div class="stat-row"><span>Tiros Totales</span><strong>${(s.totalShots.home||0) + (s.totalShots.away||0)}</strong></div>`;

            // Full statistics
            document.getElementById('matchStatistics').innerHTML = this.renderStatsComparison([
                { label: 'Posesion', home: s.ballPossession.home, away: s.ballPossession.away, type: 'text' },
                { label: 'Tiros Totales', home: s.totalShots.home, away: s.totalShots.away },
                { label: 'Tiros a Puerta', home: s.shotsOnGoal.home, away: s.shotsOnGoal.away },
                { label: 'Tiros Fuera', home: s.shotsOffGoal.home, away: s.shotsOffGoal.away },
                { label: 'Corners', home: s.cornerKicks.home, away: s.cornerKicks.away },
                { label: 'Fueras de Juego', home: s.offsides.home, away: s.offsides.away },
                { label: 'Tarjetas Amarillas', home: s.yellowCards.home, away: s.yellowCards.away },
                { label: 'Tarjetas Rojas', home: s.redCards.home, away: s.redCards.away },
                { label: 'Ataques', home: s.attacks.home, away: s.attacks.away },
                { label: 'Ataques Peligrosos', home: s.dangerousAttacks.home, away: s.dangerousAttacks.away },
            ]);
        } catch (e) {
            console.error('Stats error:', e);
            document.getElementById('matchStatistics').innerHTML = '<p class="text-muted">Error cargando estadisticas</p>';
            document.getElementById('goalsStats').innerHTML = '<p class="text-muted">Sin datos</p>';
            document.getElementById('cornersStats').innerHTML = '<p class="text-muted">Sin datos</p>';
        }
    }

    async loadMatchPredictions(fixtureId) {
        try {
            const pred = await API_FOOTBALL.getPredictions(fixtureId);
            if (!pred) {
                document.getElementById('overUnderStats').innerHTML = '<p class="text-muted">Predicciones no disponibles</p>';
                document.getElementById('bttsStats').innerHTML = '<p class="text-muted">Predicciones no disponibles</p>';
                return;
            }

            // Over/Under
            let ouHTML = '';
            const lines = [0.5, 1.5, 2.5, 3.5, 4.5];
            lines.forEach(line => {
                const data = pred.overUnder[line];
                if (data) {
                    const is25 = line === 2.5;
                    ouHTML += `
                        <div class="stat-row ${is25 ? 'highlight' : ''}">
                            <span>Over ${line}</span>
                            <strong class="text-success">${data.over}%</strong>
                            <span>/</span>
                            <strong class="text-danger">${data.under}%</strong>
                            <span>Under ${line}</span>
                        </div>`;
                }
            });
            document.getElementById('overUnderStats').innerHTML = ouHTML || '<p class="text-muted">Sin datos O/U</p>';

            // BTTS
            const bttsYes = pred.btts === 'yes' || pred.btts === 'Yes';
            document.getElementById('bttsStats').innerHTML = `
                <div class="stat-row">
                    <span>BTTS Si</span>
                    <strong class="${bttsYes ? 'text-success' : ''}">${bttsYes ? 'Si' : 'No'}</strong>
                </div>
                <div class="stat-row">
                    <span>Prob. Local Anota</span>
                    <strong>${pred.goals.home || '-'}</strong>
                </div>
                <div class="stat-row">
                    <span>Prob. Visitante Anota</span>
                    <strong>${pred.goals.away || '-'}</strong>
                </div>
                <div class="stat-row">
                    <span>1X2</span>
                    <strong>${pred.homeWin} / ${pred.draw} / ${pred.awayWin}</strong>
                </div>
                <div class="stat-row advice">
                    <span>Consejo IA</span>
                    <strong>${pred.advice}</strong>
                </div>`;

        } catch (e) {
            console.error('Predictions error:', e);
            document.getElementById('overUnderStats').innerHTML = '<p class="text-muted">Error cargando predicciones</p>';
            document.getElementById('bttsStats').innerHTML = '<p class="text-muted">Error cargando predicciones</p>';
        }
    }

    renderStatsComparison(items) {
        return `<div class="stats-comparison">` + items.map(item => {
            const homeVal = item.type === 'text' ? item.home : (item.home || 0);
            const awayVal = item.type === 'text' ? item.away : (item.away || 0);
            const homeNum = typeof homeVal === 'string' ? parseFloat(homeVal) : homeVal;
            const awayNum = typeof awayVal === 'string' ? parseFloat(awayVal) : awayVal;
            const homeWins = homeNum > awayNum;
            const awayWins = awayNum > homeNum;
            return `
                <div class="comparison-row">
                    <span class="comp-home ${homeWins ? 'comp-winner' : ''}">${homeVal}</span>
                    <span class="comp-label">${item.label}</span>
                    <span class="comp-away ${awayWins ? 'comp-winner' : ''}">${awayVal}</span>
                </div>`;
        }).join('') + '</div>';
    }

    // ========== AI ANALYSIS ==========
    async analyzeCurrentMatch() {
        if (!this.currentMatch) return;
        if (!geminiAI.isConfigured()) {
            this.showNotification('Configura tu API key de Gemini', 'error');
            return;
        }
        const m = this.currentMatch;
        const btn = document.getElementById('analyzeMatchBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analizando...';

        try {
            const stats = await API_FOOTBALL.getFixtureStatistics(m.id);
            const pred = await API_FOOTBALL.getPredictions(m.id);

            let context = `Partido: ${m.home.name} vs ${m.away.name}\nLiga: ${m.league.name}\nFecha: ${m.date}\n`;
            if (m.home.score != null) context += `Resultado: ${m.home.score} - ${m.away.score}\n`;
            if (m.home.scoreHT != null) context += `HT: ${m.home.scoreHT} - ${m.away.scoreHT}\n`;
            if (stats) {
                const s = stats.summary;
                context += `\nEstadisticas:\n`;
                context += `Posesion: ${s.ballPossession.home} vs ${s.ballPossession.away}\n`;
                context += `Corners: ${s.cornerKicks.home} vs ${s.cornerKicks.away}\n`;
                context += `Tiros a puerta: ${s.shotsOnGoal.home} vs ${s.shotsOnGoal.away}\n`;
                context += `Tiros totales: ${s.totalShots.home} vs ${s.totalShots.away}\n`;
                context += `Fueras de juego: ${s.offsides.home} vs ${s.offsides.away}\n`;
                context += `Tarjetas amarillas: ${s.yellowCards.home} vs ${s.yellowCards.away}\n`;
                context += `Ataques peligrosos: ${s.dangerousAttacks.home} vs ${s.dangerousAttacks.away}\n`;
            }
            if (pred) {
                context += `\nPredicciones API:\n`;
                context += `1X2: ${pred.homeWin} / ${pred.draw} / ${pred.awayWin}\n`;
                context += `BTTS: ${pred.btts}\n`;
                context += `Over 2.5: ${pred.overUnder[2.5]?.over || '?'}% | Under: ${pred.overUnder[2.5]?.under || '?'}%\n`;
                context += `Consejo: ${pred.advice}\n`;
            }

            const prompt = `Analiza este partido para apuestas con los datos reales que te doy. Dame:\n1. Goles esperados total y 1er tiempo\n2. Corners esperados total\n3. Over/Under 2.5 goles - recomendacion con confianza 1-5\n4. BTTS si/no - con confianza 1-5\n5. Over 9.5 corners si/no - con confianza 1-5\n6. Value bets si las hay\n7. Riesgos\n\nDatos del partido:\n${context}`;

            this.navigateTo('ai-analyst');
            this.addUserMessage(`Analiza ${m.home.name} vs ${m.away.name}`);
            this.addTyping();
            const response = await geminiAI.sendMessage(prompt);
            this.removeTyping();
            this.addAI(response);
            this.analyzedCount++;
            this.updateCount('analyzedCount', this.analyzedCount);
        } catch (e) {
            this.removeTyping();
            this.showNotification(e.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-robot"></i> Analizar con IA';
        }
    }

    async quickAnalyze(fixtureId) {
        const match = this.todayMatches.find(m => m.id === fixtureId);
        if (!match) return;
        this.currentMatch = match;
        await this.analyzeCurrentMatch();
    }

    // ========== PREDICTIONS ==========
    async loadPredictionCards() {
        const filter = document.getElementById('predictionLeagueFilter').value;
        let matches = this.todayMatches.filter(m => ['NS','TBD'].includes(m.status) || ['1H','2H','HT','LIVE'].includes(m.status));
        if (filter !== 'all') matches = matches.filter(m => m.league.id == filter);

        const c = document.getElementById('predictionsGrid');
        if (matches.length === 0) {
            c.innerHTML = '<div class="empty-state"><p>No hay partidos para predicciones</p></div>';
            return;
        }
        const dl = this.defaultLogo();
        c.innerHTML = matches.map(m => {
            const t = new Date(m.date);
            const time = t.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="prediction-card">
                    <div class="prediction-header">
                        <span class="prediction-league">${m.league.name}</span>
                        <span style="font-size:12px;color:var(--text-muted)">${time}</span>
                    </div>
                    <div class="prediction-teams">
                        <div class="prediction-team"><img src="${m.home.logo||dl}" class="team-logo-sm" onerror="this.style.display='none'"> ${m.home.name}</div>
                        <div class="prediction-vs">VS</div>
                        <div class="prediction-team"><img src="${m.away.logo||dl}" class="team-logo-sm" onerror="this.style.display='none'"> ${m.away.name}</div>
                    </div>
                    <div style="text-align:center;margin-top:12px">
                        <button class="btn btn-sm btn-primary" onclick="app.quickAnalyze(${m.id})"><i class="fas fa-robot"></i> Analizar</button>
                    </div>
                </div>`;
        }).join('');
    }

    async generatePredictions() {
        if (!geminiAI.isConfigured()) {
            this.showNotification('Configura Gemini API key', 'error');
            return;
        }

        const filter = document.getElementById('predictionLeagueFilter').value;
        let matches = this.todayMatches.filter(m => ['NS','TBD'].includes(m.status));
        if (filter !== 'all') matches = matches.filter(m => m.league.id == filter);

        if (matches.length === 0) {
            this.showNotification('No hay partidos programados para analizar', 'info');
            return;
        }

        this.showLoading();
        this.navigateTo('ai-analyst');

        const matchList = matches.slice(0, 8).map(m => `${m.home.name} vs ${m.away.name} [${m.league.name}]`).join('\n');
        const prompt = `Genera predicciones de apuestas para estos partidos de hoy. Para cada uno dame:\n- Over/Under 2.5 recomendado con confianza 1-5\n- BTTS si/no con confianza 1-5\n- Over 9.5 corners si/no con confianza 1-5\n- Ganador con confianza 1-5\n- Value si lo hay\n\nPartidos:\n${matchList}`;

        this.addUserMessage('Genera predicciones del dia');
        this.addTyping();
        try {
            const r = await geminiAI.sendMessage(prompt);
            this.removeTyping();
            this.addAI(r);
        } catch (e) {
            this.removeTyping();
            this.showNotification(e.message, 'error');
        }
        this.hideLoading();
    }

    // ========== CHAT ==========
    async sendChat() {
        const input = document.getElementById('chatInput');
        const msg = input.value.trim();
        if (!msg) return;
        if (!geminiAI.isConfigured()) {
            this.showNotification('Configura Gemini API key', 'error');
            return;
        }
        this.addUserMessage(msg);
        input.value = '';
        this.addTyping();

        let ctx = '';
        if (this.todayMatches.length > 0) {
            const trackedMatches = this.todayMatches.slice(0, 20);
            ctx = `\n\nPartidos de hoy (${trackedMatches.length}):\n` +
                trackedMatches.map(m => {
                    let line = `${m.home.name} vs ${m.away.name} [${m.league.name}]`;
                    if (m.status === 'FT') line += ` ${m.home.score}-${m.away.score}`;
                    else if (['1H','2H','HT','LIVE'].includes(m.status)) line += ` EN VIVO ${m.home.score ?? 0}-${m.away.score ?? 0}`;
                    return line;
                }).join('\n');
        }

        try {
            const r = await geminiAI.sendMessage(msg + ctx);
            this.removeTyping();
            this.addAI(r);
        } catch (e) {
            this.removeTyping();
            this.showNotification(e.message, 'error');
        }
    }

    async sendQuick(prompt) {
        if (!geminiAI.isConfigured()) { this.showNotification('Configura Gemini API key', 'error'); return; }
        this.navigateTo('ai-analyst');
        this.addUserMessage(prompt);
        this.addTyping();

        let ctx = '';
        if (this.todayMatches.length > 0) {
            ctx = `\n\nPartidos de hoy:\n${this.todayMatches.slice(0, 15).map(m => {
                let line = `${m.home.name} vs ${m.away.name} [${m.league.name}]`;
                if (m.status === 'FT') line += ` ${m.home.score}-${m.away.score}`;
                return line;
            }).join('\n')}`;
        }

        try {
            const r = await geminiAI.sendMessage(prompt + ctx);
            this.removeTyping();
            this.addAI(r);
        } catch (e) {
            this.removeTyping();
            this.showNotification(e.message, 'error');
        }
    }

    // ========== UI ==========
    populateLeagues() {
        const c = document.getElementById('leaguesList');
        c.innerHTML = LEAGUES.map(l => `
            <div class="league-item" data-league="${l.id}">
                <span class="league-flag">${l.flag}</span><span>${l.name}</span>
            </div>
        `).join('');
        c.querySelectorAll('.league-item').forEach(i => {
            i.addEventListener('click', () => {
                document.getElementById('predictionLeagueFilter').value = i.dataset.league;
                this.navigateTo('dashboard');
                // Filter matches visually
                const matches = this.todayMatches.filter(m => m.league.id === i.dataset.league);
                this.renderMatches(matches);
            });
        });
    }

    populateLeagueSelects() {
        const opts = LEAGUES.map(l => `<option value="${l.id}">${l.flag} ${l.name}</option>`).join('');
        document.getElementById('predictionLeagueFilter').innerHTML = '<option value="all">Todas las Ligas</option>' + opts;
    }

    navigateTo(section) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.section === section));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        this.currentSection = section;
        if (this.isSidebarOpen) this.toggleSidebar();
        if (section === 'predictions') this.loadPredictionCards();
        if (section === 'dashboard') this.renderMatches(this.todayMatches);
    }

    toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; document.getElementById('sidebar').classList.toggle('active', this.isSidebarOpen); }

    openSettings() { document.getElementById('settingsModal').classList.add('active'); document.getElementById('apiKeyInput').value = geminiAI.apiKey || ''; document.getElementById('aiModelSelect').value = geminiAI.model; }
    closeSettings() { document.getElementById('settingsModal').classList.remove('active'); }
    toggleApiKeyVis() { const i = document.getElementById('apiKeyInput'); const icon = document.querySelector('#toggleApiKey i'); if (i.type === 'password') { i.type = 'text'; icon.classList.replace('fa-eye','fa-eye-slash'); } else { i.type = 'password'; icon.classList.replace('fa-eye-slash','fa-eye'); } }
    saveSettings() { geminiAI.setApiKey(document.getElementById('apiKeyInput').value.trim()); geminiAI.setModel(document.getElementById('aiModelSelect').value); this.closeSettings(); this.showNotification('Configuracion guardada', 'success'); }

    defaultLogo() { return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374357" width="100" height="100"/><text x="50%" y="55%" font-size="30" text-anchor="middle" fill="white">&#9917;</text></svg>'); }

    addAI(content) {
        const c = document.getElementById('chatMessages');
        c.insertAdjacentHTML('beforeend', `<div class="message ai-message"><div class="message-avatar"><i class="fas fa-robot"></i></div><div class="message-content">${geminiAI.formatResponse(content)}</div></div>`);
        c.scrollTop = c.scrollHeight;
    }
    addUserMessage(content) {
        const c = document.getElementById('chatMessages');
        c.insertAdjacentHTML('beforeend', `<div class="message user-message"><div class="message-avatar"><i class="fas fa-user"></i></div><div class="message-content"><p>${content}</p></div></div>`);
        c.scrollTop = c.scrollHeight;
    }
    addTyping() {
        document.getElementById('chatMessages').insertAdjacentHTML('beforeend', `<div class="message ai-message" id="typingIndicator"><div class="message-avatar"><i class="fas fa-robot"></i></div><div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div></div>`);
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    }
    removeTyping() { const e = document.getElementById('typingIndicator'); if (e) e.remove(); }
    showEmpty(id, msg) { document.getElementById(id).innerHTML = `<div class="empty-state"><p>${msg}</p></div>`; }
    updateCount(id, n) { document.getElementById(id).textContent = n; }
    showLoading() { document.getElementById('loadingOverlay').classList.add('active'); }
    hideLoading() { document.getElementById('loadingOverlay').classList.remove('active'); }
    handleSearch(q) {
        if (!q) { this.renderMatches(this.todayMatches); return; }
        const filtered = this.todayMatches.filter(m =>
            m.home.name.toLowerCase().includes(q.toLowerCase()) ||
            m.away.name.toLowerCase().includes(q.toLowerCase()) ||
            m.league.name.toLowerCase().includes(q.toLowerCase())
        );
        this.renderMatches(filtered);
    }
    showNotification(msg, type = 'info') {
        const colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6' };
        const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
        const n = document.createElement('div');
        n.style.cssText = `position:fixed;top:20px;right:20px;padding:16px 20px;background:${colors[type]};color:white;border-radius:10px;display:flex;align-items:center;gap:10px;z-index:5000;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:400px;`;
        n.innerHTML = `<i class="fas fa-${icons[type]}"></i><span>${msg}</span>`;
        document.body.appendChild(n);
        setTimeout(() => { n.style.opacity = '0'; n.style.transition = 'opacity 0.3s'; setTimeout(() => n.remove(), 300); }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new AnalystKingApp(); });
