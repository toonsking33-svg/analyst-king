// Analyst King App - Fixed Version
class AnalystKingApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentLeague = null;
        this.currentTab = 'standings';
        this.isSidebarOpen = false;
        this.apiAvailable = false;
        this.todayMatches = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.checkApiConnection();
        await this.loadInitialData();
    }

    async checkApiConnection() {
        try {
            const status = await API_FOOTBALL.checkStatus();
            if (status?.account) {
                this.apiAvailable = true;
                const r = status.requests;
                this.updateApiStatus(true, r);
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
            el.innerHTML = '<i class="fas fa-circle"></i><span>Sin conexión</span>';
            el.classList.add('disconnected');
        }
    }

    bindEvents() {
        document.querySelectorAll('.nav-item[data-section]').forEach(i => {
            i.addEventListener('click', e => { e.preventDefault(); this.navigateToSection(i.dataset.section); });
        });
        document.getElementById('menuToggle').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeModal').addEventListener('click', () => this.closeSettings());
        document.getElementById('toggleApiKey').addEventListener('click', () => this.toggleApiKeyVis());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('runAnalysis').addEventListener('click', () => this.runAnalysis());
        document.getElementById('aiLeagueSelect').addEventListener('change', e => this.updateTeams(e.target.value));
        document.getElementById('sendMessage').addEventListener('click', () => this.sendChat());
        document.getElementById('chatInput').addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendChat(); }
        });
        document.querySelectorAll('.quick-action').forEach(b => {
            b.addEventListener('click', () => this.sendQuick(b.dataset.prompt));
        });
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.addEventListener('click', () => this.switchTab(b.dataset.tab));
        });
        document.getElementById('generateLeagueAnalysis').addEventListener('click', () => this.genAnalysis());
        document.querySelectorAll('.btn-filter[data-filter]').forEach(b => {
            b.addEventListener('click', () => {
                document.querySelectorAll('.btn-filter[data-filter]').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                this.loadPredictions(b.dataset.filter);
            });
        });
        document.getElementById('searchInput').addEventListener('input', e => this.handleSearch(e.target.value));
        document.addEventListener('click', e => {
            if (this.isSidebarOpen && !e.target.closest('.sidebar') && !e.target.closest('#menuToggle')) this.toggleSidebar();
        });
        document.getElementById('settingsModal').addEventListener('click', e => {
            if (e.target === document.getElementById('settingsModal')) this.closeSettings();
        });
    }

    async loadInitialData() {
        this.populateLeagues();
        this.populateLeagueSelects();
        if (this.apiAvailable) {
            await this.loadTodayMatches();
            await this.loadLiveCount();
        } else {
            this.showEmpty('upcomingMatches', 'Conecta API-Football para ver partidos');
        }
        this.showEmpty('aiInsights', 'Selecciona una liga para ver análisis');
    }

    populateLeagues() {
        const c = document.getElementById('leaguesList');
        c.innerHTML = LEAGUES.map(l => `
            <div class="league-item" data-league="${l.id}">
                <span class="league-flag">${l.flag}</span><span>${l.name}</span>
            </div>
        `).join('');
        c.querySelectorAll('.league-item').forEach(i => {
            i.addEventListener('click', () => this.openLeague(i.dataset.league));
        });
    }

    populateLeagueSelects() {
        const opts = LEAGUES.map(l => `<option value="${l.id}">${l.flag} ${l.name}</option>`).join('');
        document.getElementById('aiLeagueSelect').innerHTML = '<option value="">Seleccionar liga...</option>' + opts;
        document.getElementById('predictionLeagueFilter').innerHTML = '<option value="all">Todas las Ligas</option>' + opts;
    }

    async loadTodayMatches() {
        this.showLoading();
        try {
            this.todayMatches = await API_FOOTBALL.getTodayMatches();
            this.hideLoading();
            this.renderTodayMatches(this.todayMatches);
            this.updateCount('totalMatches', this.todayMatches.length);
        } catch (e) {
            console.error('Error loading matches:', e);
            this.hideLoading();
            this.showEmpty('upcomingMatches', 'Error cargando partidos. Intenta más tarde.');
        }
    }

    async loadLiveCount() {
        try {
            const live = await API_FOOTBALL.getLiveMatches();
            if (live.length > 0) {
                this.showNotification(`${live.length} partidos en vivo ahora`, 'info');
            }
        } catch (e) { /* ok */ }
    }

    renderTodayMatches(matches) {
        const c = document.getElementById('upcomingMatches');
        if (!matches || matches.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-day"></i><p>No hay partidos hoy en tus ligas</p></div>';
            return;
        }

        // Show first 10 matches
        const defaultLogo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374357" width="100" height="100"/><text x="50%" y="55%" font-size="30" text-anchor="middle" fill="white">⚽</text></svg>');

        c.innerHTML = matches.slice(0, 10).map(m => {
            const t = new Date(m.date);
            const time = t.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            const isLive = ['1H','2H','HT','LIVE','ET','P','BT'].includes(m.status);
            const isDone = ['FT','AET','PEN','WO'].includes(m.status);

            let cls = 'upcoming', txt = time;
            if (isLive) { cls = 'live'; txt = m.elapsed ? `${m.elapsed}'` : 'LIVE'; }
            else if (isDone) { cls = 'finished'; txt = 'Finalizado'; }

            return `
                <div class="match-item">
                    <div class="match-teams">
                        <div class="match-team">
                            <img src="${m.home.logo || defaultLogo}" class="team-logo" onerror="this.src='${defaultLogo}'">
                            <span>${m.home.name}</span>
                        </div>
                        <div class="match-team">
                            <img src="${m.away.logo || defaultLogo}" class="team-logo" onerror="this.src='${defaultLogo}'">
                            <span>${m.away.name}</span>
                        </div>
                    </div>
                    <div class="match-info">
                        ${(isLive || isDone) ? `<div class="match-score">${m.home.score ?? '-'} - ${m.away.score ?? '-'}</div>` : ''}
                        <span class="match-status ${cls}">${txt}</span>
                        <div class="match-league">${m.league.name}</div>
                    </div>
                </div>`;
        }).join('');

        if (matches.length > 10) {
            c.innerHTML += `<div style="text-align:center;padding:12px;color:var(--text-muted);font-size:13px">+ ${matches.length - 10} partidos más hoy</div>`;
        }
    }

    // ========== PREDICTIONS ==========
    async loadPredictions(filter = 'all') {
        if (!this.apiAvailable) {
            this.showEmpty('predictionsGrid', 'API-Football no conectada');
            return;
        }

        this.showLoading();
        try {
            let matches = this.todayMatches;
            if (matches.length === 0) {
                matches = await API_FOOTBALL.getTodayMatches();
            }

            // Filter by selected league if not 'all'
            if (filter !== 'all') {
                matches = API_FOOTBALL.getFixturesForLeague(matches, filter);
            }

            // Only upcoming/scheduled matches for predictions
            const upcoming = matches.filter(m =>
                ['NS', 'TBD', '1H', '2H', 'HT', 'LIVE'].includes(m.status) ||
                !['FT', 'AET', 'PEN', 'WO', 'PST', 'CANC'].includes(m.status)
            );

            this.hideLoading();
            this.renderPredictions(upcoming);
        } catch (e) {
            this.hideLoading();
            this.showEmpty('predictionsGrid', 'Error cargando predicciones');
        }
    }

    renderPredictions(matches) {
        const c = document.getElementById('predictionsGrid');
        if (!matches || matches.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-chart-line"></i><p>No hay partidos programados para predicciones</p></div>';
            return;
        }

        const defaultLogo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374357" width="100" height="100"/><text x="50%" y="55%" font-size="30" text-anchor="middle" fill="white">⚽</text></svg>');

        c.innerHTML = matches.slice(0, 20).map(m => {
            const t = new Date(m.date);
            const time = t.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            const date = t.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });

            return `
                <div class="prediction-card" data-league="${m.league.id}">
                    <div class="prediction-header">
                        <span class="prediction-league">${m.league.name}</span>
                        <span class="prediction-confidence medium" style="font-size:12px">${date} ${time}</span>
                    </div>
                    <div class="prediction-teams">
                        <div class="prediction-team">${m.home.name}</div>
                        <div class="prediction-vs">VS</div>
                        <div class="prediction-team">${m.away.name}</div>
                    </div>
                    <div style="text-align:center;margin-top:12px">
                        <button class="btn btn-sm btn-outline" onclick="app.analyzeMatch('${m.home.name}','${m.away.name}')">
                            <i class="fas fa-robot"></i> Analizar con IA
                        </button>
                    </div>
                </div>`;
        }).join('');
    }

    async analyzeMatch(home, away) {
        if (!geminiAI.isConfigured()) {
            this.showNotification('Configura tu API key de Gemini primero', 'error');
            return;
        }
        if (this.currentSection !== 'ai-analyst') this.navigateToSection('ai-analyst');
        document.getElementById('chatInput').value = `Analiza ${home} vs ${away} para apuestas: forma, H2H, goles, BTTS, Over/Under, valor. Confianza 1-5.`;
        this.sendChat();
    }

    // ========== LEAGUE DETAIL ==========
    async openLeague(leagueId) {
        const league = getLeagueById(leagueId);
        if (!league) return;
        this.currentLeague = leagueId;
        document.getElementById('leagueDetailTitle').textContent = league.name;
        document.getElementById('leagueDetailSubtitle').textContent = league.country;
        this.navigateToSection('league-detail');
        document.querySelectorAll('.league-item').forEach(i => i.classList.toggle('active', i.dataset.league === leagueId));
        this.switchTab('standings');
        await this.loadLeagueData(leagueId);
    }

    async loadLeagueData(leagueId) {
        this.showLoading();
        try {
            const standings = await API_FOOTBALL.getStandings(leagueId);
            this.renderStandings(standings);
        } catch (e) {
            console.error('Standings error:', e);
            document.getElementById('standingsBody').innerHTML =
                '<tr><td colspan="11" class="text-center" style="padding:40px"><i class="fas fa-info-circle" style="font-size:24px;color:var(--accent-primary);display:block;margin-bottom:10px"></i>Clasificación de temporada 2024<br><small style="color:var(--text-muted)">Datos históricos (plan free limitado a 2022-2024)</small></td></tr>';
        }

        try {
            // Get today's matches for this league
            const today = new Date().toISOString().split('T')[0];
            const fixtures = await API_FOOTBALL.getFixtures(leagueId, today);
            if (fixtures.length > 0) {
                this.renderFixtures(fixtures);
            } else {
                document.getElementById('fixturesList').innerHTML = '<div class="empty-state"><p>No hay partidos hoy en esta liga</p></div>';
            }
        } catch (e) {
            document.getElementById('fixturesList').innerHTML = '<div class="empty-state"><p>Error cargando partidos</p></div>';
        }

        try {
            const scorers = await API_FOOTBALL.getTopScorers(leagueId);
            this.renderStats(scorers);
        } catch (e) {
            this.renderStats([]);
        }

        this.hideLoading();
    }

    renderStandings(standings) {
        const tbody = document.getElementById('standingsBody');
        if (!standings || standings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="text-center">Sin datos de clasificación</td></tr>';
            return;
        }
        const dl = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374357" width="100" height="100"/><text x="50%" y="55%" font-size="30" text-anchor="middle" fill="white">⚽</text></svg>');

        tbody.innerHTML = standings.map(t => `
            <tr>
                <td>${t.pos}</td>
                <td><div class="table-team"><img src="${t.logo || dl}" class="table-team-logo" onerror="this.src='${dl}'"><span>${t.team}</span></div></td>
                <td>${t.pj}</td><td>${t.g}</td><td>${t.e}</td><td>${t.p}</td>
                <td>${t.gf}</td><td>${t.gc}</td><td>${t.dif > 0 ? '+' : ''}${t.dif}</td>
                <td><strong>${t.pts}</strong></td>
                <td><div class="form-badges">${(t.form||[]).map(f => `<span class="form-badge ${f.toLowerCase()}">${f}</span>`).join('')}</div></td>
            </tr>`).join('');
    }

    renderFixtures(fixtures) {
        const c = document.getElementById('fixturesList');
        if (!fixtures.length) { c.innerHTML = '<div class="empty-state"><p>Sin partidos hoy</p></div>'; return; }
        const dl = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374357" width="100" height="100"/><text x="50%" y="55%" font-size="30" text-anchor="middle" fill="white">⚽</text></svg>');

        c.innerHTML = '<div class="fixture-date">Hoy</div>' + fixtures.map(m => {
            const t = new Date(m.date);
            const time = t.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            const isDone = ['FT','AET','PEN'].includes(m.status);
            const score = isDone ? `${m.home.score ?? '-'} - ${m.away.score ?? '-'}` : 'vs';
            return `
                <div class="fixture-item">
                    <div class="fixture-time">${time}</div>
                    <div class="fixture-teams">
                        <div class="fixture-team">
                            <img src="${m.home.logo||dl}" class="team-logo" onerror="this.src='${dl}'">
                            <span>${m.home.name}</span>
                        </div>
                        <div class="fixture-score">${score}</div>
                        <div class="fixture-team away">
                            <img src="${m.away.logo||dl}" class="team-logo" onerror="this.src='${dl}'">
                            <span>${m.away.name}</span>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    renderStats(scorers) {
        const c = document.getElementById('leagueStats');
        if (!scorers || scorers.length === 0) {
            c.innerHTML = '<div class="stat-box"><h3>Goleadores</h3><p style="color:var(--text-muted)">No hay datos disponibles</p></div>';
            return;
        }
        const da = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle fill="%233b82f6" cx="50" cy="50" r="50"/><text x="50%" y="55%" font-size="30" text-anchor="middle" fill="white">⚽</text></svg>');

        c.innerHTML = `
            <div class="stat-box">
                <h3><i class="fas fa-crosshairs"></i> Goleadores Líderes (2024)</h3>
                <div class="stat-list">${scorers.slice(0, 5).map(p => `
                    <div class="stat-list-item">
                        <div class="player">
                            <img src="${p.photo||da}" class="player-avatar" onerror="this.src='${da}'">
                            <span>${p.name} <small style="color:var(--text-muted)">(${p.team})</small></span>
                        </div>
                        <div class="value">${p.goals}</div>
                    </div>`).join('')}
                </div>
            </div>
            <div class="stat-box">
                <h3><i class="fas fa-hands-helping"></i> Asistentes (2024)</h3>
                <div class="stat-list">${scorers.sort((a,b)=>(b.assists||0)-(a.assists||0)).slice(0, 5).map(p => `
                    <div class="stat-list-item">
                        <div class="player">
                            <img src="${p.photo||da}" class="player-avatar" onerror="this.src='${da}'">
                            <span>${p.name} <small style="color:var(--text-muted)">(${p.team})</small></span>
                        </div>
                        <div class="value">${p.assists||0}</div>
                    </div>`).join('')}
                </div>
            </div>`;
    }

    // ========== AI ANALYST ==========
    updateTeams(leagueId) {
        const h = document.getElementById('homeTeam');
        const a = document.getElementById('awayTeam');
        if (!leagueId) {
            h.innerHTML = '<option value="">Seleccionar equipo...</option>';
            a.innerHTML = '<option value="">Seleccionar equipo...</option>';
            return;
        }
        const league = getLeagueById(leagueId);
        if (!league) return;
        const opts = league.teams.map(t => `<option value="${t}">${t}</option>`).join('');
        h.innerHTML = '<option value="">Seleccionar equipo...</option>' + opts;
        a.innerHTML = '<option value="">Seleccionar equipo...</option>' + opts;
    }

    async runAnalysis() {
        const leagueId = document.getElementById('aiLeagueSelect').value;
        const type = document.getElementById('analysisType').value;
        const home = document.getElementById('homeTeam').value;
        const away = document.getElementById('awayTeam').value;

        if (!geminiAI.isConfigured()) {
            this.showNotification('Configura Gemini API key en Configuración', 'error');
            return;
        }

        try {
            let ctx = '';
            if (this.apiAvailable) {
                try {
                    if (type === 'match' && home && away) {
                        ctx = `\nPartido: ${home} vs ${away}`;
                    }
                    // Add today's matches as context
                    if (this.todayMatches.length > 0) {
                        ctx += `\n\nPartidos de hoy:\n${this.todayMatches.slice(0, 10).map(m => `${m.home.name} vs ${m.away.name} [${m.league.name}]`).join('\n')}`;
                    }
                } catch (e) { /* ok */ }
            }

            const prompts = {
                match: `Analiza ${home} vs ${away} para apuestas. Forma, H2H, goles, BTTS, Over/Under, valor. Confianza 1-5.${ctx}`,
                team: `Analiza a ${home} para apuestas: forma, localía, goles, mercados con valor.${ctx}`,
                trends: `Tendencias de esta liga para apuestas: Over/Under, BTTS, valor, sorpresas.${ctx}`,
                predictions: `Predicciones para los próximos partidos. Over/Under 2.5, BTTS, ganador, confianza 1-5.${ctx}`
            };

            this.addUserMessage(prompts[type] || prompts.match);
            this.addTyping();
            const response = await geminiAI.sendMessage(prompts[type] || prompts.match, { league: leagueId });
            this.removeTyping();
            this.addAI(response);
        } catch (e) {
            this.removeTyping();
            this.showNotification(e.message, 'error');
        }
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
        try {
            let ctx = '';
            if (this.todayMatches.length > 0) {
                ctx = `\n\nPartidos de hoy:\n${this.todayMatches.slice(0, 15).map(m => `${m.home.name} vs ${m.away.name} [${m.league.name}] ${m.status==='FT'?(m.home.score+'-'+m.away.score):''}`).join('\n')}`;
            }
            const r = await geminiAI.sendMessage(msg + ctx, { league: this.currentLeague });
            this.removeTyping();
            this.addAI(r);
        } catch (e) {
            this.removeTyping();
            this.showNotification(e.message, 'error');
        }
    }

    async sendQuick(prompt) {
        if (!geminiAI.isConfigured()) { this.showNotification('Configura Gemini API key', 'error'); return; }
        if (this.currentSection !== 'ai-analyst') this.navigateToSection('ai-analyst');
        this.addUserMessage(prompt);
        this.addTyping();
        try {
            let ctx = '';
            if (this.todayMatches.length > 0) {
                ctx = `\n\nPartidos de hoy (${this.todayMatches.length}):\n${this.todayMatches.slice(0, 20).map(m => `${m.home.name} vs ${m.away.name} [${m.league.name}] ${m.status==='FT'?(m.home.score+'-'+m.away.score):''}`).join('\n')}`;
            }
            const r = await geminiAI.sendMessage(prompt + ctx, { league: this.currentLeague });
            this.removeTyping();
            this.addAI(r);
        } catch (e) {
            this.removeTyping();
            this.showNotification(e.message, 'error');
        }
    }

    async genAnalysis() {
        if (!this.currentLeague) { this.showNotification('Selecciona una liga', 'error'); return; }
        if (!geminiAI.isConfigured()) { this.showNotification('Configura Gemini API key', 'error'); return; }
        this.showLoading();
        try {
            let ctx = '';
            if (this.apiAvailable) {
                try {
                    const s = await API_FOOTBALL.getStandings(this.currentLeague);
                    if (s.length > 0) ctx += `\n\nClasificación 2024:\n${s.map(t => `${t.pos}. ${t.team} - ${t.pts}pts`).join('\n')}`;
                } catch (e) { /* ok */ }
            }
            const r = await geminiAI.sendMessage('Análisis completo de esta liga para apuestas.' + ctx, { league: this.currentLeague });
            document.getElementById('leagueAnalysisContent').innerHTML = geminiAI.formatResponse(r);
        } catch (e) {
            this.showNotification(e.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // ========== NAVIGATION ==========
    navigateToSection(section) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.section === section));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        this.currentSection = section;
        if (this.isSidebarOpen) this.toggleSidebar();
        // Auto-load predictions when switching to predictions section
        if (section === 'predictions') this.loadPredictions();
    }

    toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; document.getElementById('sidebar').classList.toggle('active', this.isSidebarOpen); }
    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tab).classList.add('active');
        this.currentTab = tab;
    }

    // ========== SETTINGS ==========
    openSettings() {
        document.getElementById('settingsModal').classList.add('active');
        document.getElementById('apiKeyInput').value = geminiAI.apiKey || '';
        document.getElementById('aiModelSelect').value = geminiAI.model;
    }
    closeSettings() { document.getElementById('settingsModal').classList.remove('active'); }
    toggleApiKeyVis() {
        const i = document.getElementById('apiKeyInput');
        const icon = document.querySelector('#toggleApiKey i');
        if (i.type === 'password') { i.type = 'text'; icon.classList.replace('fa-eye','fa-eye-slash'); }
        else { i.type = 'password'; icon.classList.replace('fa-eye-slash','fa-eye'); }
    }
    saveSettings() {
        geminiAI.setApiKey(document.getElementById('apiKeyInput').value.trim());
        geminiAI.setModel(document.getElementById('aiModelSelect').value);
        this.closeSettings();
        this.showNotification('Configuración guardada', 'success');
        this.checkApiConnection();
    }

    // ========== UI HELPERS ==========
    addAI(content) {
        const c = document.getElementById('chatMessages');
        c.insertAdjacentHTML('beforeend', `
            <div class="message ai-message">
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-content">${geminiAI.formatResponse(content)}</div>
            </div>`);
        c.scrollTop = c.scrollHeight;
    }
    addUserMessage(content) {
        const c = document.getElementById('chatMessages');
        c.insertAdjacentHTML('beforeend', `
            <div class="message user-message">
                <div class="message-avatar"><i class="fas fa-user"></i></div>
                <div class="message-content"><p>${content}</p></div>
            </div>`);
        c.scrollTop = c.scrollHeight;
    }
    addTyping() {
        document.getElementById('chatMessages').insertAdjacentHTML('beforeend', `
            <div class="message ai-message" id="typingIndicator">
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
            </div>`);
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    }
    removeTyping() { const e = document.getElementById('typingIndicator'); if (e) e.remove(); }
    showEmpty(id, msg) { document.getElementById(id).innerHTML = `<div class="empty-state"><p>${msg}</p></div>`; }
    updateCount(id, n) { document.getElementById(id).textContent = n; }
    showLoading() { document.getElementById('loadingOverlay').classList.add('active'); }
    hideLoading() { document.getElementById('loadingOverlay').classList.remove('active'); }
    handleSearch(q) {
        if (!q) return;
        document.querySelectorAll('.league-item').forEach(i => {
            const l = getLeagueById(i.dataset.league);
            i.style.background = l && (l.name.toLowerCase().includes(q.toLowerCase()) || l.country.toLowerCase().includes(q.toLowerCase()) || l.teams.some(t => t.toLowerCase().includes(q.toLowerCase()))) ? 'rgba(59,130,246,0.2)' : '';
        });
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
