// Main Application for Analyst King - Updated with Real API
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
        this.loadInitialData();
        this.setupChat();
    }

    async checkApiConnection() {
        try {
            const status = await API_FOOTBALL.checkStatus();
            if (status && status.account) {
                this.apiAvailable = true;
                this.updateApiStatus(true, status.requests);
                console.log('API connected:', status);
            }
        } catch (error) {
            console.error('API connection failed:', error);
            this.apiAvailable = false;
            this.updateApiStatus(false);
        }
    }

    updateApiStatus(connected, requests = null) {
        const statusEl = document.getElementById('apiStatus');
        if (connected) {
            const requestsText = requests ? ` (${requests.used}/${requests.limit_daily} hoy)` : '';
            statusEl.innerHTML = `<i class="fas fa-circle"></i><span>API Conectada${requestsText}</span>`;
            statusEl.classList.remove('disconnected');
        } else {
            statusEl.innerHTML = '<i class="fas fa-circle"></i><span>API Desconectada</span>';
            statusEl.classList.add('disconnected');
        }
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(item.dataset.section);
            });
        });

        // Mobile menu toggle
        document.getElementById('menuToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeSettings();
        });

        // API key toggle visibility
        document.getElementById('toggleApiKey').addEventListener('click', () => {
            this.toggleApiKeyVisibility();
        });

        // Save settings
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // AI Analyst
        document.getElementById('runAnalysis').addEventListener('click', () => {
            this.runCustomAnalysis();
        });

        document.getElementById('aiLeagueSelect').addEventListener('change', (e) => {
            this.updateTeamsForLeague(e.target.value);
        });

        // Chat
        document.getElementById('sendMessage').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chatInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                this.sendQuickAction(prompt);
            });
        });

        // League tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // League analysis generation
        document.getElementById('generateLeagueAnalysis').addEventListener('click', () => {
            this.generateLeagueAnalysis();
        });

        // Predictions filters
        document.querySelectorAll('.btn-filter[data-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-filter[data-filter]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterPredictions(btn.dataset.filter);
            });
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Close sidebar on outside click (mobile)
        document.addEventListener('click', (e) => {
            if (this.isSidebarOpen && !e.target.closest('.sidebar') && !e.target.closest('#menuToggle')) {
                this.toggleSidebar();
            }
        });

        // Close modal on outside click
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('settingsModal')) {
                this.closeSettings();
            }
        });
    }

    async loadInitialData() {
        this.populateLeaguesList();
        this.populateLeagueSelects();
        
        // Load real data from API
        if (this.apiAvailable) {
            await this.loadTodayMatches();
            await this.loadLiveMatches();
        } else {
            this.loadFallbackData();
        }
        
        this.loadInsights();
    }

    populateLeaguesList() {
        const container = document.getElementById('leaguesList');
        container.innerHTML = LEAGUES.map(league => `
            <div class="league-item" data-league="${league.id}">
                <span class="league-flag">${league.flag}</span>
                <span>${league.name}</span>
            </div>
        `).join('');

        // Bind click events
        container.querySelectorAll('.league-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openLeagueDetail(item.dataset.league);
            });
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
            const matches = await API_FOOTBALL.getTodayMatches();
            this.renderUpcomingMatches(matches.slice(0, 8));
            this.updateMatchCount(matches.length);
        } catch (error) {
            console.error('Error loading today matches:', error);
            this.loadFallbackMatches();
        }
    }

    async loadLiveMatches() {
        try {
            const liveMatches = await API_FOOTBALL.getLiveMatches();
            if (liveMatches.length > 0) {
                this.showNotification(`${liveMatches.length} partidos en vivo`, 'info');
            }
        } catch (error) {
            console.error('Error loading live matches:', error);
        }
    }

    renderUpcomingMatches(matches) {
        const container = document.getElementById('upcomingMatches');
        
        if (matches.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No hay partidos programados para hoy</p></div>';
            return;
        }

        container.innerHTML = matches.map(match => {
            const matchTime = new Date(match.date);
            const timeStr = matchTime.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            const isLive = match.status === '1H' || match.status === '2H' || match.status === 'HT' || match.status === 'LIVE';
            const isFinished = match.status === 'FT' || match.status === 'PST';
            
            let statusClass = 'upcoming';
            let statusText = timeStr;
            
            if (isLive) {
                statusClass = 'live';
                statusText = match.elapsed ? `${match.elapsed}'` : 'EN VIVO';
            } else if (isFinished) {
                statusClass = 'finished';
                statusText = 'Finalizado';
            }

            return `
                <div class="match-item">
                    <div class="match-teams">
                        <div class="match-team">
                            <img src="${match.home.logo}" alt="${match.home.name}" class="team-logo" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23374357%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2255%25%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22white%22>${match.home.name.substring(0,2)}</text></svg>'">
                            <span>${match.home.name}</span>
                        </div>
                        <div class="match-team">
                            <img src="${match.away.logo}" alt="${match.away.name}" class="team-logo" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23374357%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2255%25%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22white%22>${match.away.name.substring(0,2)}</text></svg>'">
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

    loadFallbackData() {
        this.loadFallbackMatches();
    }

    loadFallbackMatches() {
        const container = document.getElementById('upcomingMatches');
        container.innerHTML = SAMPLE_MATCHES.slice(0, 6).map(match => {
            const league = getLeagueById(match.league);
            return `
                <div class="match-item">
                    <div class="match-teams">
                        <div class="match-team">
                            <span class="team-logo">${match.home.substring(0, 2).toUpperCase()}</span>
                            <span>${match.home}</span>
                        </div>
                        <div class="match-team">
                            <span class="team-logo">${match.away.substring(0, 2).toUpperCase()}</span>
                            <span>${match.away}</span>
                        </div>
                    </div>
                    <div class="match-info">
                        <div class="match-time">${match.time}</div>
                        <div class="match-league">${league ? league.flag : ''} ${match.date}</div>
                        <span class="match-status ${match.status}">${match.time}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadInsights() {
        const container = document.getElementById('aiInsights');
        container.innerHTML = SAMPLE_INSIGHTS.map(insight => `
            <div class="insight-item">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-text">${insight.text}</div>
                <span class="insight-tag ${insight.priority}">${insight.priority === 'high' ? 'Alta Prioridad' : insight.priority === 'medium' ? 'Media' : 'Informativo'}</span>
            </div>
        `).join('');
    }

    navigateToSection(section) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        // Update content sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        this.currentSection = section;

        // Close sidebar on mobile
        if (this.isSidebarOpen) {
            this.toggleSidebar();
        }
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
        document.getElementById('sidebar').classList.toggle('active', this.isSidebarOpen);
    }

    openSettings() {
        document.getElementById('settingsModal').classList.add('active');
        
        // Load current settings
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
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    saveSettings() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        const model = document.getElementById('aiModelSelect').value;
        const language = document.getElementById('languageSelect').value;
        const tone = document.getElementById('toneSelect').value;

        geminiAI.setApiKey(apiKey);
        geminiAI.setModel(model);
        geminiAI.setLanguage(language);
        geminiAI.setTone(tone);

        this.closeSettings();
        
        this.showNotification('Configuración guardada correctamente', 'success');
    }

    async openLeagueDetail(leagueId) {
        const league = getLeagueById(leagueId);
        if (!league) return;

        this.currentLeague = leagueId;

        // Update header
        document.getElementById('leagueDetailTitle').textContent = league.name;
        document.getElementById('leagueDetailSubtitle').textContent = `${league.country} - ${league.teams.length} equipos`;

        // Navigate to league detail
        this.navigateToSection('league-detail');

        // Update active league in sidebar
        document.querySelectorAll('.league-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.league === leagueId) {
                item.classList.add('active');
            }
        });

        // Reset to standings tab
        this.switchTab('standings');

        // Load real standings from API
        if (this.apiAvailable) {
            await this.loadLeagueStandings(leagueId);
        } else {
            this.loadFallbackStandings(leagueId);
        }
    }

    async loadLeagueStandings(leagueId) {
        this.showLoading();
        
        try {
            const standings = await API_FOOTBALL.getStandings(leagueId);
            this.renderStandings(standings);
            this.cachedData[leagueId] = { standings };
        } catch (error) {
            console.error('Error loading standings:', error);
            this.loadFallbackStandings(leagueId);
        } finally {
            this.hideLoading();
        }
    }

    renderStandings(standings) {
        const tbody = document.getElementById('standingsBody');
        
        if (!standings || standings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="text-center">No hay datos de clasificación disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = standings.map(team => `
            <tr>
                <td>${team.pos}</td>
                <td>
                    <div class="table-team">
                        <img src="${team.logo}" alt="${team.team}" class="table-team-logo" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23374357%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2255%25%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22white%22>${team.team.substring(0,2)}</text></svg>'">
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
                        ${team.form.map(f => `<span class="form-badge ${f.toLowerCase()}">${f}</span>`).join('')}
                    </div>
                </td>
            </tr>
        `).join('');

        // Load fixtures and stats
        this.loadLeagueFixturesFromAPI(this.currentLeague);
        this.loadLeagueStatsFromAPI(this.currentLeague);
    }

    loadFallbackStandings(leagueId) {
        let standings = getStandings(leagueId);
        
        if (standings.length === 0) {
            standings = generateStandings(leagueId);
            STANDINGS_DATA[leagueId] = standings;
        }

        this.renderStandings(standings);
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

        let html = '<div class="fixture-date">Próximos Partidos</div>';
        
        fixtures.slice(0, 10).forEach(match => {
            const matchTime = new Date(match.date);
            const timeStr = matchTime.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
            const dateStr = matchTime.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' });
            
            html += `
                <div class="fixture-item">
                    <div class="fixture-time">${timeStr}</div>
                    <div class="fixture-teams">
                        <div class="fixture-team">
                            <img src="${match.home.logo}" alt="${match.home.name}" class="team-logo" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23374357%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2255%25%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22white%22>${match.home.name.substring(0,2)}</text></svg>'">
                            <span>${match.home.name}</span>
                        </div>
                        <div class="fixture-score">vs</div>
                        <div class="fixture-team away">
                            <img src="${match.away.logo}" alt="${match.away.name}" class="team-logo" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23374357%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2255%25%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22white%22>${match.away.name.substring(0,2)}</text></svg>'">
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
        
        for (let i = 0; i < teams.length; i += 2) {
            if (i + 1 < teams.length) {
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
        
        container.innerHTML = `
            <div class="stat-box">
                <h3><i class="fas fa-crosshairs"></i> Goleadores Líderes</h3>
                <div class="stat-list">
                    ${topScorers.slice(0, 5).map(player => `
                        <div class="stat-list-item">
                            <div class="player">
                                <img src="${player.photo}" alt="${player.name}" class="player-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle fill=%22%233b82f6%22 cx=%2250%22 cy=%2250%22 r=%2250%22/><text x=%2250%25%22 y=%2255%25%22 font-size=%2230%22 text-anchor=%22middle%22 fill=%22white%22>${player.name.substring(0,2)}</text></svg>'">
                                <span>${player.name}</span>
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
                                <img src="${player.photo}" alt="${player.name}" class="player-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle fill=%22%238b5cf6%22 cx=%2250%22 cy=%2250%22 r=%2250%22/><text x=%2250%25%22 y=%2255%25%22 font-size=%2230%22 text-anchor=%22middle%22 fill=%22white%22>${player.name.substring(0,2)}</text></svg>'">
                                <span>${player.name}</span>
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
                    <div class="stat-list-item">
                        <div class="player">
                            <div class="player-avatar">MB</div>
                            <span>Mbappé</span>
                        </div>
                        <div class="value">24</div>
                    </div>
                    <div class="stat-list-item">
                        <div class="player">
                            <div class="player-avatar">LB</div>
                            <span>L. Martínez</span>
                        </div>
                        <div class="value">22</div>
                    </div>
                    <div class="stat-list-item">
                        <div class="player">
                            <div class="player-avatar">HV</div>
                            <span>H. Kane</span>
                        </div>
                        <div class="value">21</div>
                    </div>
                </div>
            </div>
            <div class="stat-box">
                <h3><i class="fas fa-hands-helping"></i> Asistentes Líderes</h3>
                <div class="stat-list">
                    <div class="stat-list-item">
                        <div class="player">
                            <div class="player-avatar">KB</div>
                            <span>K. De Bruyne</span>
                        </div>
                        <div class="value">16</div>
                    </div>
                    <div class="stat-list-item">
                        <div class="player">
                            <div class="player-avatar">TB</div>
                            <span>T. Bernardo</span>
                        </div>
                        <div class="value">14</div>
                    </div>
                    <div class="stat-list-item">
                        <div class="player">
                            <div class="player-avatar">PD</div>
                            <span>P. Foden</span>
                        </div>
                        <div class="value">12</div>
                    </div>
                </div>
            </div>
        `;
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
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

        const options = league.teams.map(team => 
            `<option value="${team}">${team}</option>`
        ).join('');

        homeSelect.innerHTML = '<option value="">Seleccionar equipo...</option>' + options;
        awaySelect.innerHTML = '<option value="">Seleccionar equipo...</option>' + options;
    }

    async runCustomAnalysis() {
        const leagueId = document.getElementById('aiLeagueSelect').value;
        const analysisType = document.getElementById('analysisType').value;
        const homeTeam = document.getElementById('homeTeam').value;
        const awayTeam = document.getElementById('awayTeam').value;

        if (!geminiAI.isConfigured()) {
            this.showNotification('Por favor, configura tu API key de Gemini en la configuración', 'error');
            return;
        }

        // Gather real data if available
        let contextData = '';
        if (this.apiAvailable && leagueId) {
            try {
                const standings = await API_FOOTBALL.getStandings(leagueId);
                const fixtures = await API_FOOTBALL.getFixtures(leagueId);
                contextData = `\n\nDatos actuales de la liga:\nClasificación:\n${standings.slice(0, 10).map(t => `${t.pos}. ${t.team} - ${t.pts}pts (${t.g}G ${t.e}E ${t.p}P)`).join('\n')}\n\nPartidos programados:\n${fixtures.slice(0, 5).map(m => `${m.home.name} vs ${m.away.name}`).join('\n')}`;
            } catch (error) {
                console.error('Error gathering context:', error);
            }
        }

        this.showLoading();

        try {
            let response;
            
            switch (analysisType) {
                case 'match':
                    if (!homeTeam || !awayTeam) {
                        this.showNotification('Selecciona ambos equipos para análisis de partido', 'error');
                        this.hideLoading();
                        return;
                    }
                    response = await geminiAI.analyzeMatch(homeTeam, awayTeam, leagueId);
                    break;
                case 'team':
                    if (!homeTeam) {
                        this.showNotification('Selecciona un equipo para análisis de equipo', 'error');
                        this.hideLoading();
                        return;
                    }
                    response = await geminiAI.analyzeTeam(homeTeam, leagueId);
                    break;
                case 'player':
                    if (!homeTeam) {
                        this.showNotification('Selecciona un equipo para análisis de jugador', 'error');
                        this.hideLoading();
                        return;
                    }
                    response = await geminiAI.analyzePlayer('jugador destacado', homeTeam, leagueId);
                    break;
                case 'trends':
                    response = await geminiAI.analyzeTrends(leagueId);
                    break;
                case 'predictions':
                    response = await geminiAI.sendMessage('Genera predicciones detalladas para los próximos partidos de esta liga', { league: leagueId, analysisType: 'predictions' });
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

    setupChat() {
        // Initial AI message is already in HTML
    }

    addAIMessage(content) {
        const container = document.getElementById('chatMessages');
        const formattedContent = geminiAI.formatResponse(content);
        
        const messageHTML = `
            <div class="message ai-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    ${formattedContent}
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', messageHTML);
        container.scrollTop = container.scrollHeight;
        
        this.chatMessages.push({ role: 'ai', content });
    }

    addUserMessage(content) {
        const container = document.getElementById('chatMessages');
        
        const messageHTML = `
            <div class="message user-message">
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-content">
                    <p>${content}</p>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', messageHTML);
        container.scrollTop = container.scrollHeight;
        
        this.chatMessages.push({ role: 'user', content });
    }

    addTypingIndicator() {
        const container = document.getElementById('chatMessages');
        
        const typingHTML = `
            <div class="message ai-message" id="typingIndicator">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', typingHTML);
        container.scrollTop = container.scrollHeight;
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        if (!geminiAI.isConfigured()) {
            this.showNotification('Por favor, configura tu API key de Gemini en la configuración', 'error');
            return;
        }

        this.addUserMessage(message);
        input.value = '';
        
        this.addTypingIndicator();
        
        try {
            // Gather real data for context
            let contextData = '';
            if (this.apiAvailable) {
                try {
                    const todayMatches = await API_FOOTBALL.getTodayMatches();
                    contextData = `\n\nPartidos de hoy:\n${todayMatches.slice(0, 10).map(m => `${m.home.name} vs ${m.away.name} (${m.league.name})`).join('\n')}`;
                } catch (error) {
                    console.error('Error gathering context:', error);
                }
            }

            const context = {
                league: this.currentLeague,
                analysisType: 'general'
            };
            
            const response = await geminiAI.sendMessage(message + contextData, context);
            this.removeTypingIndicator();
            this.addAIMessage(response);
        } catch (error) {
            this.removeTypingIndicator();
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    async sendQuickAction(prompt) {
        if (!geminiAI.isConfigured()) {
            this.showNotification('Por favor, configura tu API key de Gemini en la configuración', 'error');
            return;
        }

        // Navigate to AI analyst section if not there
        if (this.currentSection !== 'ai-analyst') {
            this.navigateToSection('ai-analyst');
        }

        this.addUserMessage(prompt);
        this.addTypingIndicator();
        
        try {
            // Gather real data for context
            let contextData = '';
            if (this.apiAvailable) {
                try {
                    const todayMatches = await API_FOOTBALL.getTodayMatches();
                    const liveMatches = await API_FOOTBALL.getLiveMatches();
                    contextData = `\n\nPartidos de hoy (${todayMatches.length} total, ${liveMatches.length} en vivo):\n${todayMatches.slice(0, 15).map(m => `${m.home.name} vs ${m.away.name} [${m.league.name}] ${m.status === 'FT' ? m.home.score + '-' + m.away.score : ''}`).join('\n')}`;
                } catch (error) {
                    console.error('Error gathering context:', error);
                }
            }

            let type = 'today';
            if (prompt.includes('semanal')) type = 'weekly';
            else if (prompt.includes('goleadores')) type = 'scorers';
            else if (prompt.includes('sorpresas')) type = 'surprises';
            
            const response = await geminiAI.sendMessage(prompt + contextData, { league: this.currentLeague });
            this.removeTypingIndicator();
            this.addAIMessage(response);
        } catch (error) {
            this.removeTypingIndicator();
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    async generateLeagueAnalysis() {
        if (!this.currentLeague) {
            this.showNotification('Selecciona una liga primero', 'error');
            return;
        }

        if (!geminiAI.isConfigured()) {
            this.showNotification('Por favor, configura tu API key de Gemini en la configuración', 'error');
            return;
        }

        this.showLoading();
        
        try {
            // Gather real data for context
            let contextData = '';
            if (this.apiAvailable) {
                try {
                    const standings = await API_FOOTBALL.getStandings(this.currentLeague);
                    const fixtures = await API_FOOTBALL.getFixtures(this.currentLeague);
                    const topScorers = await API_FOOTBALL.getTopScorers(this.currentLeague);
                    
                    contextData = `\n\nDatos actuales de la liga:\n\nClasificación:\n${standings.slice(0, 15).map(t => `${t.pos}. ${t.team} - ${t.pts}pts (${t.g}G ${t.e}E ${t.p}P) GF:${t.gf} GC:${t.gc}`).join('\n')}\n\nGoleadores:\n${topScorers.slice(0, 5).map(p => `${p.name} (${p.team}) - ${p.goals} goles`).join('\n')}\n\nPartidos programados:\n${fixtures.slice(0, 8).map(m => `${m.home.name} vs ${m.away.name}`).join('\n')}`;
                } catch (error) {
                    console.error('Error gathering context:', error);
                }
            }

            const response = await geminiAI.sendMessage('Realiza un análisis completo y detallado de esta liga' + contextData, { league: this.currentLeague, analysisType: 'predictions' });
            document.getElementById('leagueAnalysisContent').innerHTML = geminiAI.formatResponse(response);
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    filterPredictions(filter) {
        // This would normally filter by date
        const cards = document.querySelectorAll('.prediction-card');
        cards.forEach(card => {
            card.style.display = 'block';
        });
    }

    handleSearch(query) {
        if (!query) return;
        
        // Simple search through leagues and teams
        const results = LEAGUES.filter(league => 
            league.name.toLowerCase().includes(query.toLowerCase()) ||
            league.country.toLowerCase().includes(query.toLowerCase()) ||
            league.teams.some(team => team.toLowerCase().includes(query.toLowerCase()))
        );
        
        // Highlight matching league items
        document.querySelectorAll('.league-item').forEach(item => {
            const league = getLeagueById(item.dataset.league);
            if (league && results.some(r => r.id === league.id)) {
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
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            background: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
            color: white;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 5000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AnalystKingApp();
});
