// Main Application for Analyst King - Fixed Version
class AnalystKingApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentLeague = null;
        this.currentTab = 'standings';
        this.chatMessages = [];
        this.isSidebarOpen = false;
        this.apiAvailable = false;
        this.cachedData = {};
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.checkApiConnection();
        await this.loadInitialData();
        this.setupChat();
    }

    async checkApiConnection() {
        try {
            const status = await API_FOOTBALL.checkStatus();
            if (status && status.account) {
                this.apiAvailable = true;
                this.updateApiStatus(true, status.requests);
                console.log('API connected:', status);
                return;
            }
        } catch (error) {
            console.error('API check error:', error);
        }
        this.apiAvailable = false;
        this.updateApiStatus(false);
    }

    updateApiStatus(connected, requests = null) {
        const statusEl = document.getElementById('apiStatus');
        if (connected) {
            const requestsText = requests ? ` (${requests.used}/${requests.limit_daily})` : '';
            statusEl.innerHTML = `<i class="fas fa-circle"></i><span>API OK${requestsText}</span>`;
            statusEl.classList.remove('disconnected');
        } else {
            statusEl.innerHTML = '<i class="fas fa-circle"></i><span>API Sin conexión</span>';
            statusEl.classList.add('disconnected');
        }
    }

    bindEvents() {
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(item.dataset.section);
            });
        });

        document.getElementById('menuToggle').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeModal').addEventListener('click', () => this.closeSettings());
        document.getElementById('toggleApiKey').addEventListener('click', () => this.toggleApiKeyVisibility());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('runAnalysis').addEventListener('click', () => this.runCustomAnalysis());
        document.getElementById('aiLeagueSelect').addEventListener('change', (e) => this.updateTeamsForLeague(e.target.value));

        document.getElementById('sendMessage').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });

        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', () => this.sendQuickAction(btn.dataset.prompt));
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        document.getElementById('generateLeagueAnalysis').addEventListener('click', () => this.generateLeagueAnalysis());

        document.querySelectorAll('.btn-filter[data-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-filter[data-filter]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));

        document.addEventListener('click', (e) => {
            if (this.isSidebarOpen && !e.target.closest('.sidebar') && !e.target.closest('#menuToggle')) {
                this.toggleSidebar();
            }
        });

        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('settingsModal')) this.closeSettings();
        });
    }

    async loadInitialData() {
        this.populateLeaguesList();
        this.populateLeagueSelects();
        this.loadInsights();
        
        if (this.apiAvailable) {
            await this.loadTodayMatches();
        } else {
            this.loadFallbackMatches();
        }
    }

    populateLeaguesList() {
        const container = document.getElementById('leaguesList');
        container.innerHTML = LEAGUES.map(league => `
            <div class="league-item" data-league="${league.id}">
                <span class="league-flag">${league.flag}</span>
                <span>${league.name}</span>
            </div>
        `).join('');

        container.querySelectorAll('.league-item').forEach(item => {
            item.addEventListener('click', () => this.openLeagueDetail(item.dataset.league));
        });
    }

    populateLeagueSelects() {
        const aiSelect = document.getElementById('aiLeagueSelect');
        const predictionFilter = document.getElementById('predictionLeagueFilter');
        
        const options = LEAGUES.map(league => 
            `<option value="${league.id}">${league.flag} ${league.name}</option>`
        ).join('');
        
        aiSelect.innerHTML = '<option value="">Seleccionar liga...</option>' + options;
        predictionFilter.innerHTML = '<option value="all">Todas las Ligas</option>' + options;
    }

    async loadTodayMatches() {
        try {
            this.showLoading();
            const matches = await API_FOOTBALL.getTodayMatches();
            this.hideLoading();
            
            if (matches && matches.length > 0) {
                this.renderUpcomingMatches(matches.slice(0, 8));
                this.updateMatchCount(matches.length);
            } else {
                this.loadFallbackMatches();
            }
        } catch (error) {
            console.error('Error loading today matches:', error);
            this.hideLoading();
            this.loadFallbackMatches();
        }
    }

    renderUpcomingMatches(matches) {
        const container = document.getElementById('upcomingMatches');
        
        if (!matches || matches.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No hay partidos programados para hoy</p></div>';
            return;
        }

        container.innerHTML = matches.map(match => {
            const matchTime = new Date(match.date);
            const timeStr = matchTime.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            const isLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'P', 'BT'].includes(match.status);
            const isFinished = ['FT', 'PST', 'AET', 'PEN', 'WO'].includes(match.status);
            
            let statusClass = 'upcoming';
            let statusText = timeStr;
            
            if (isLive) {
                statusClass = 'live';
                statusText = match.elapsed ? `${match.elapsed}'` : 'EN VIVO';
            } else if (isFinished) {
                statusClass = 'finished';
                statusText = 'Finalizado';
            }

            const defaultLogo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374357" width="100" height="100"/><text x="50%" y="55%" font-size="40" text-anchor="middle" fill="white">⚽</text></svg>');

            return `
                <div class="match-item">
                    <div class="match-teams">
                        <div class="match-team">
                            <img src="${match.home.logo || defaultLogo}" alt="" class="team-logo" onerror="this.src='${defaultLogo}'">
                            <span>${match.home.name}</span>
                        </div>
                        <div class="match-team">
                            <img src="${match.away.logo || defaultLogo}" alt="" class="team-logo" onerror="this.src='${defaultLogo}'">
                            <span>${match.away.name}</span>
                        </div>
                    </div>
                    <div class="match-info">
                        ${isLive || isFinished ? `<div class="match-score">${match.home.score ?? '-'} - ${match.away.score ?? '-'}</div>` : ''}
                        <span class="match-status ${statusClass}">${statusText}</span>
                        <div class="match-league">${match.league.name}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateMatchCount(count) {
        document.getElementById('totalMatches').textContent = count;
    }

    loadFallbackMatches() {
        const container = document.getElementById('upcomingMatches');
        if (this.apiAvailable) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-sync-alt"></i><p>Cargando partidos reales de API-Football...</p><p style="font-size:12px;color:var(--text-muted)">Si no aparecen, verifica tu conexión o la API key</p></div>';
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>API-Football no conectada</p><p style="font-size:12px;color:var(--text-muted)">Verifica tu conexión a internet</p></div>';
        }
        this.updateMatchCount(0);
    }

    loadInsights() {
        const container = document.getElementById('aiInsights');
        if (this.apiAvailable) {
            container.innerHTML = '<div class="empty-state"><p>Los insights se cargan cuando seleccionas una liga</p></div>';
        } else {
            container.innerHTML = '<div class="empty-state"><p>Conecta API-Football para ver insights</p></div>';
        }
    }

    navigateToSection(section) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) item.classList.add('active');
        });

        document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(section).classList.add('active');

        this.currentSection = section;
        if (this.isSidebarOpen) this.toggleSidebar();
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
        document.getElementById('sidebar').classList.toggle('active', this.isSidebarOpen);
    }

    openSettings() {
        document.getElementById('settingsModal').classList.add('active');
        document.getElementById('apiKeyInput').value = geminiAI.apiKey || '';
        document.getElementById('aiModelSelect').value = geminiAI.model;
        document.getElementById('languageSelect').value = geminiAI.language;
        document.getElementById('toneSelect').value = geminiAI.tone;
    }

    closeSettings() {
        document.getElementById('settingsModal').classList.remove('active');
    }

    toggleApiKeyVisibility() {
        const input = document.getElementById('apiKeyInput');
        const icon = document.querySelector('#toggleApiKey i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }

    saveSettings() {
        geminiAI.setApiKey(document.getElementById('apiKeyInput').value.trim());
        geminiAI.setModel(document.getElementById('aiModelSelect').value);
        geminiAI.setLanguage(document.getElementById('languageSelect').value);
        geminiAI.setTone(document.getElementById('toneSelect').value);
        this.closeSettings();
        this.showNotification('Configuración guardada', 'success');
    }

    async openLeagueDetail(leagueId) {
        const league = getLeagueById(leagueId);
        if (!league) return;

        this.currentLeague = leagueId;
        document.getElementById('leagueDetailTitle').textContent = league.name;
        document.getElementById('leagueDetailSubtitle').textContent = `${league.country} - ${league.teams.length} equipos`;

        this.navigateToSection('league-detail');

        document.querySelectorAll('.league-item').forEach(item => {
            item.classList.toggle('active', item.dataset.league === leagueId);
        });

        this.switchTab('standings');
        await this.loadLeagueStandings(leagueId);
    }

    async loadLeagueStandings(leagueId) {
        this.showLoading();
        
        try {
            if (this.apiAvailable) {
                const standings = await API_FOOTBALL.getStandings(leagueId);
                if (standings && standings.length > 0) {
                    this.renderStandings(standings);
                    this.cachedData[leagueId] = { standings };
                    await this.loadLeagueFixturesFromAPI(leagueId);
                    await this.loadLeagueStatsFromAPI(leagueId);
                    this.hideLoading();
                    return;
                }
            }
        } catch (error) {
            console.error('Error loading standings from API:', error);
        }
        
        // Fallback to local data
        this.loadFallbackStandings(leagueId);
        this.hideLoading();
    }

    renderStandings(standings) {
        const tbody = document.getElementById('standingsBody');
        
        if (!standings || standings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="text-center">No hay datos disponibles</td></tr>';
            return;
        }

        const defaultLogo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374357" width="100" height="100"/><text x="50%" y="55%" font-size="30" text-anchor="middle" fill="white">⚽</text></svg>');

        tbody.innerHTML = standings.map(team => `
            <tr>
                <td>${team.pos}</td>
                <td>
                    <div class="table-team">
                        <img src="${team.logo || defaultLogo}" alt="" class="table-team-logo" onerror="this.src='${defaultLogo}'">
                        <span>${team.team}</span>
                    </div>
                </td>
                <td>${team.pj}</td>
                <td>${team.g}</td>
                <td>${team.e}</td>
                <td>${team.p}</td>
                <td>${team.gf}</td>
                <td>${team.gc}</td>
                <td>${team.dif > 0 ? '+' : ''}${team.dif}</td>
                <td><strong>${team.pts}</strong></td>
                <td>
                    <div class="form-badges">
                        ${(team.form || []).map(f => `<span class="form-badge ${f.toLowerCase()}">${f}</span>`).join('')}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    loadFallbackStandings(leagueId) {
        const tbody = document.getElementById('standingsBody');
        tbody.innerHTML = '<tr><td colspan="11" class="text-center" style="padding:40px"><i class="fas fa-exclamation-triangle" style="font-size:24px;color:var(--accent-warning);display:block;margin-bottom:10px"></i>No se pudieron cargar los datos de clasificación<br><small style="color:var(--text-muted)">Verifica tu conexión o intenta más tarde</small></td></tr>';
        document.getElementById('fixturesList').innerHTML = '<div class="empty-state"><p>No hay datos de fixtures disponibles</p></div>';
        this.loadFallbackStats();
    }

    async loadLeagueFixturesFromAPI(leagueId) {
        try {
            const fixtures = await API_FOOTBALL.getFixtures(leagueId);
            this.renderFixtures(fixtures);
        } catch (error) {
            console.error('Error loading fixtures:', error);
            this.loadFallbackFixtures(leagueId);
        }
    }

    renderFixtures(fixtures) {
        const container = document.getElementById('fixturesList');
        
        if (!fixtures || fixtures.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No hay partidos programados</p></div>';
            return;
        }

        const defaultLogo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374357" width="100" height="100"/><text x="50%" y="55%" font-size="30" text-anchor="middle" fill="white">⚽</text></svg>');

        let html = '<div class="fixture-date">Partidos</div>';
        
        fixtures.slice(0, 15).forEach(match => {
            const matchTime = new Date(match.date);
            const timeStr = matchTime.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            
            const isLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'P', 'BT'].includes(match.status);
            const isFinished = ['FT', 'PST', 'AET', 'PEN', 'WO'].includes(match.status);
            let scoreDisplay = 'vs';
            if (isLive || isFinished) {
                scoreDisplay = `${match.home.score ?? '-'} - ${match.away.score ?? '-'}`;
            }
            
            html += `
                <div class="fixture-item">
                    <div class="fixture-time">${timeStr}</div>
                    <div class="fixture-teams">
                        <div class="fixture-team">
                            <img src="${match.home.logo || defaultLogo}" alt="" class="team-logo" onerror="this.src='${defaultLogo}'">
                            <span>${match.home.name}</span>
                        </div>
                        <div class="fixture-score">${scoreDisplay}</div>
                        <div class="fixture-team away">
                            <img src="${match.away.logo || defaultLogo}" alt="" class="team-logo" onerror="this.src='${defaultLogo}'">
                            <span>${match.away.name}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    loadFallbackFixtures(leagueId) {
        const league = getLeagueById(leagueId);
        if (!league) return;

        const container = document.getElementById('fixturesList');
        const teams = league.teams.slice(0, 10);
        
        let html = '<div class="fixture-date">Próximos Partidos</div>';
        
        for (let i = 0; i < teams.length - 1; i += 2) {
            const time = `${Math.floor(Math.random() * 12) + 14}:${Math.random() > 0.5 ? '00' : '30'}`;
            html += `
                <div class="fixture-item">
                    <div class="fixture-time">${time}</div>
                    <div class="fixture-teams">
                        <div class="fixture-team">
                            <span class="team-logo">${teams[i].substring(0, 2).toUpperCase()}</span>
                            <span>${teams[i]}</span>
                        </div>
                        <div class="fixture-score">vs</div>
                        <div class="fixture-team away">
                            <span class="team-logo">${teams[i+1].substring(0, 2).toUpperCase()}</span>
                            <span>${teams[i+1]}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    async loadLeagueStatsFromAPI(leagueId) {
        try {
            const topScorers = await API_FOOTBALL.getTopScorers(leagueId);
            this.renderLeagueStats(topScorers);
        } catch (error) {
            console.error('Error loading stats:', error);
            this.loadFallbackStats();
        }
    }

    renderLeagueStats(topScorers) {
        const container = document.getElementById('leagueStats');
        
        if (!topScorers || topScorers.length === 0) {
            this.loadFallbackStats();
            return;
        }

        const defaultAvatar = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle fill="%233b82f6" cx="50" cy="50" r="50"/><text x="50%" y="55%" font-size="30" text-anchor="middle" fill="white">⚽</text></svg>');

        container.innerHTML = `
            <div class="stat-box">
                <h3><i class="fas fa-crosshairs"></i> Goleadores Líderes</h3>
                <div class="stat-list">
                    ${topScorers.slice(0, 5).map(player => `
                        <div class="stat-list-item">
                            <div class="player">
                                <img src="${player.photo || defaultAvatar}" alt="" class="player-avatar" onerror="this.src='${defaultAvatar}'">
                                <span>${player.name} <small style="color: var(--text-muted)">(${player.team})</small></span>
                            </div>
                            <div class="value">${player.goals}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="stat-box">
                <h3><i class="fas fa-hands-helping"></i> Asistentes Líderes</h3>
                <div class="stat-list">
                    ${topScorers.sort((a, b) => (b.assists || 0) - (a.assists || 0)).slice(0, 5).map(player => `
                        <div class="stat-list-item">
                            <div class="player">
                                <img src="${player.photo || defaultAvatar}" alt="" class="player-avatar" onerror="this.src='${defaultAvatar}'">
                                <span>${player.name} <small style="color: var(--text-muted)">(${player.team})</small></span>
                            </div>
                            <div class="value">${player.assists || 0}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    loadFallbackStats() {
        const container = document.getElementById('leagueStats');
        container.innerHTML = `
            <div class="stat-box">
                <h3><i class="fas fa-crosshairs"></i> Goleadores Líderes</h3>
                <div class="stat-list">
                    <div class="stat-list-item"><div class="player"><div class="player-avatar">MB</div><span>Mbappé</span></div><div class="value">24</div></div>
                    <div class="stat-list-item"><div class="player"><div class="player-avatar">LB</div><span>L. Martínez</span></div><div class="value">22</div></div>
                    <div class="stat-list-item"><div class="player"><div class="player-avatar">HV</div><span>H. Kane</span></div><div class="value">21</div></div>
                </div>
            </div>
            <div class="stat-box">
                <h3><i class="fas fa-hands-helping"></i> Asistentes Líderes</h3>
                <div class="stat-list">
                    <div class="stat-list-item"><div class="player"><div class="player-avatar">KB</div><span>K. De Bruyne</span></div><div class="value">16</div></div>
                    <div class="stat-list-item"><div class="player"><div class="player-avatar">TB</div><span>T. Bernardo</span></div><div class="value">14</div></div>
                    <div class="stat-list-item"><div class="player"><div class="player-avatar">PD</div><span>P. Foden</span></div><div class="value">12</div></div>
                </div>
            </div>
        `;
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tab).classList.add('active');
        this.currentTab = tab;
    }

    updateTeamsForLeague(leagueId) {
        const homeSelect = document.getElementById('homeTeam');
        const awaySelect = document.getElementById('awayTeam');
        
        if (!leagueId) {
            homeSelect.innerHTML = '<option value="">Seleccionar equipo...</option>';
            awaySelect.innerHTML = '<option value="">Seleccionar equipo...</option>';
            return;
        }

        const league = getLeagueById(leagueId);
        if (!league) return;

        const options = league.teams.map(team => `<option value="${team}">${team}</option>`).join('');
        homeSelect.innerHTML = '<option value="">Seleccionar equipo...</option>' + options;
        awaySelect.innerHTML = '<option value="">Seleccionar equipo...</option>' + options;
    }

    async runCustomAnalysis() {
        const leagueId = document.getElementById('aiLeagueSelect').value;
        const analysisType = document.getElementById('analysisType').value;
        const homeTeam = document.getElementById('homeTeam').value;
        const awayTeam = document.getElementById('awayTeam').value;

        if (!geminiAI.isConfigured()) {
            this.showNotification('Configura tu API key de Gemini en Configuración', 'error');
            return;
        }

        this.showLoading();

        try {
            let contextData = '';
            if (this.apiAvailable && leagueId) {
                try {
                    const standings = await API_FOOTBALL.getStandings(leagueId);
                    const fixtures = await API_FOOTBALL.getFixtures(leagueId);
                    contextData = `\n\nDatos actuales:\nClasificación:\n${standings.slice(0, 10).map(t => `${t.pos}. ${t.team} - ${t.pts}pts`).join('\n')}\n\nPróximos partidos:\n${fixtures.slice(0, 5).map(m => `${m.home.name} vs ${m.away.name}`).join('\n')}`;
                } catch (e) { /* use empty context */ }
            }

            let response;
            switch (analysisType) {
                case 'match':
                    if (!homeTeam || !awayTeam) { this.showNotification('Selecciona ambos equipos', 'error'); this.hideLoading(); return; }
                    response = await geminiAI.analyzeMatch(homeTeam, awayTeam, leagueId);
                    break;
                case 'team':
                    if (!homeTeam) { this.showNotification('Selecciona un equipo', 'error'); this.hideLoading(); return; }
                    response = await geminiAI.analyzeTeam(homeTeam, leagueId);
                    break;
                case 'trends':
                    response = await geminiAI.analyzeTrends(leagueId);
                    break;
                case 'predictions':
                    response = await geminiAI.sendMessage('Genera predicciones detalladas para los próximos partidos de esta liga' + contextData, { league: leagueId });
                    break;
                default:
                    response = await geminiAI.sendMessage('Realiza un análisis general de esta liga' + contextData, { league: leagueId });
            }

            this.addAIMessage(response);
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    setupChat() {}

    addAIMessage(content) {
        const container = document.getElementById('chatMessages');
        const formattedContent = geminiAI.formatResponse(content);
        
        container.insertAdjacentHTML('beforeend', `
            <div class="message ai-message">
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-content">${formattedContent}</div>
            </div>
        `);
        container.scrollTop = container.scrollHeight;
        this.chatMessages.push({ role: 'ai', content });
    }

    addUserMessage(content) {
        const container = document.getElementById('chatMessages');
        container.insertAdjacentHTML('beforeend', `
            <div class="message user-message">
                <div class="message-avatar"><i class="fas fa-user"></i></div>
                <div class="message-content"><p>${content}</p></div>
            </div>
        `);
        container.scrollTop = container.scrollHeight;
        this.chatMessages.push({ role: 'user', content });
    }

    addTypingIndicator() {
        document.getElementById('chatMessages').insertAdjacentHTML('beforeend', `
            <div class="message ai-message" id="typingIndicator">
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
            </div>
        `);
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    }

    removeTypingIndicator() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;
        
        if (!geminiAI.isConfigured()) {
            this.showNotification('Configura tu API key de Gemini en Configuración', 'error');
            return;
        }

        this.addUserMessage(message);
        input.value = '';
        this.addTypingIndicator();
        
        try {
            let contextData = '';
            if (this.apiAvailable) {
                try {
                    const todayMatches = await API_FOOTBALL.getTodayMatches();
                    contextData = `\n\nPartidos de hoy (${todayMatches.length}):\n${todayMatches.slice(0, 15).map(m => `${m.home.name} vs ${m.away.name} [${m.league.name}]`).join('\n')}`;
                } catch (e) { /* proceed without context */ }
            }

            const response = await geminiAI.sendMessage(message + contextData, { league: this.currentLeague });
            this.removeTypingIndicator();
            this.addAIMessage(response);
        } catch (error) {
            this.removeTypingIndicator();
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    async sendQuickAction(prompt) {
        if (!geminiAI.isConfigured()) {
            this.showNotification('Configura tu API key de Gemini en Configuración', 'error');
            return;
        }

        if (this.currentSection !== 'ai-analyst') this.navigateToSection('ai-analyst');

        this.addUserMessage(prompt);
        this.addTypingIndicator();
        
        try {
            let contextData = '';
            if (this.apiAvailable) {
                try {
                    const todayMatches = await API_FOOTBALL.getTodayMatches();
                    const liveMatches = await API_FOOTBALL.getLiveMatches();
                    contextData = `\n\nPartidos de hoy (${todayMatches.length} total, ${liveMatches.length} en vivo):\n${todayMatches.slice(0, 15).map(m => `${m.home.name} vs ${m.away.name} [${m.league.name}] ${m.status === 'FT' ? (m.home.score + '-' + m.away.score) : ''}`).join('\n')}`;
                } catch (e) { /* proceed without context */ }
            }
            
            const response = await geminiAI.sendMessage(prompt + contextData, { league: this.currentLeague });
            this.removeTypingIndicator();
            this.addAIMessage(response);
        } catch (error) {
            this.removeTypingIndicator();
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    async generateLeagueAnalysis() {
        if (!this.currentLeague) { this.showNotification('Selecciona una liga primero', 'error'); return; }
        if (!geminiAI.isConfigured()) { this.showNotification('Configura tu API key de Gemini', 'error'); return; }

        this.showLoading();
        
        try {
            let contextData = '';
            if (this.apiAvailable) {
                try {
                    const standings = await API_FOOTBALL.getStandings(this.currentLeague);
                    const topScorers = await API_FOOTBALL.getTopScorers(this.currentLeague);
                    contextData = `\n\nClasificación:\n${standings.slice(0, 15).map(t => `${t.pos}. ${t.team} - ${t.pts}pts (${t.g}G ${t.e}E ${t.p}P)`).join('\n')}\n\nGoleadores:\n${topScorers.slice(0, 5).map(p => `${p.name} (${p.team}) - ${p.goals} goles`).join('\n')}`;
                } catch (e) { /* proceed without context */ }
            }

            const response = await geminiAI.sendMessage('Realiza un análisis completo de esta liga' + contextData, { league: this.currentLeague });
            document.getElementById('leagueAnalysisContent').innerHTML = geminiAI.formatResponse(response);
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    handleSearch(query) {
        if (!query) return;
        document.querySelectorAll('.league-item').forEach(item => {
            const league = getLeagueById(item.dataset.league);
            if (league && (
                league.name.toLowerCase().includes(query.toLowerCase()) ||
                league.country.toLowerCase().includes(query.toLowerCase()) ||
                league.teams.some(t => t.toLowerCase().includes(query.toLowerCase()))
            )) {
                item.style.background = 'rgba(59, 130, 246, 0.2)';
            } else {
                item.style.background = '';
            }
        });
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6' };
        const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
        
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 16px 20px;
            background: ${colors[type] || colors.info}; color: white; border-radius: 10px;
            display: flex; align-items: center; gap: 10px; z-index: 5000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `<i class="fas fa-${icons[type] || icons.info}"></i><span>${message}</span>`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new AnalystKingApp();
});
