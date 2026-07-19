// Gemini AI Integration for Analyst King
class GeminiAI {
    constructor() {
        this.apiKey = localStorage.getItem('geminiApiKey') || '';
        this.model = localStorage.getItem('geminiModel') || 'gemini-2.0-flash';
        this.language = localStorage.getItem('aiLanguage') || 'es';
        this.tone = localStorage.getItem('aiTone') || 'professional';
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
        this.conversationHistory = [];
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('geminiApiKey', key);
    }

    setModel(model) {
        this.model = model;
        localStorage.setItem('geminiModel', model);
    }

    setLanguage(lang) {
        this.language = lang;
        localStorage.setItem('aiLanguage', lang);
    }

    setTone(tone) {
        this.tone = tone;
        localStorage.setItem('aiTone', tone);
    }

    isConfigured() {
        return this.apiKey && this.apiKey.length > 0;
    }

    getSystemPrompt() {
        const languageNames = {
            'es': 'Español',
            'en': 'English',
            'pt': 'Português',
            'fr': 'Français',
            'de': 'Deutsch'
        };

        const toneDescriptions = {
            'professional': 'profesional y analítico',
            'casual': 'amigable y casual',
            'technical': 'técnico y detallado con estadísticas'
        };

        return `Eres Analyst King, un asistente de análisis deportivo de élite especializado en fútbol. 
Tu función es proporcionar análisis precisos, predicciones informadas y estadísticas detalladas 
de las principales ligas de fútbol del mundo.

Ligas que cubres:
- Ligue 1 (Francia)
- Brasileirão Betano (Brasil)
- VriendenLoterij Eredivisie (Países Bajos)
- Liga Portugal Betclic (Portugal)
- Liga Profesional de Fútbol (Argentina)
- Copa Argentina
- UEFA Europa League
- CONMEBOL Libertadores
- CONMEBOL Sudamericana
- FA Cup (Inglaterra)
- Brasileirão Série B (Brasil)
- Veikkausliiga (Finlandia)
- Liga MX, Apertura (México)
- Eliteserien (Noruega)
- Norwegian 1st Division (Noruega)
- UEFA Champions League
- Premier League (Inglaterra)
- Championship (Inglaterra)
- LaLiga (España)
- Bundesliga (Alemania)
- Serie A (Italia)
- MLS (Estados Unidos)

Idioma de respuesta: ${languageNames[this.language] || 'Español'}
Estilo de comunicación: ${toneDescriptions[this.tone] || 'profesional y analítico'}

Capacidades:
1. Análisis de partidos con estadísticas clave
2. Predicciones basadas en datos históricos y forma actual
3. Análisis de tendencias y patrones de juego
4. Comparativas entre equipos
5. Identificación de valor en mercados de apuestas
6. Resúmenes de jornadas y torneos
7. Análisis de jugadores y rendimiento
8. Noticias y actualizaciones relevantes

Directrices:
- Proporciona análisis fundamentados con datos cuando sea posible
- Sé honesto sobre la incertidumbre en predicciones
- Incluye estadísticas relevantes para respaldar tu análisis
- Usa formato claro con viñetas y negritas para facilitar la lectura
- Responde en el idioma seleccionado
- Mantén un tono ${toneDescriptions[this.tone] || 'profesional'}
- Cuando no tengas datos específicos, indica que es una estimación basada en tendencias generales`;
    }

    async sendMessage(message, context = {}) {
        if (!this.isConfigured()) {
            throw new Error('API key no configurada. Por favor, configura tu API key de Gemini en la configuración.');
        }

        const systemPrompt = this.getSystemPrompt();
        
        // Build context message
        let contextMessage = '';
        if (context.league) {
            const league = getLeagueById(context.league);
            if (league) {
                contextMessage += `\nLiga seleccionada: ${league.name} (${league.country})`;
                contextMessage += `\nEquipos: ${league.teams.join(', ')}`;
                
                const standings = getStandings(context.league);
                if (standings.length > 0) {
                    contextMessage += `\n\nClasificación actual:`;
                    standings.slice(0, 10).forEach(team => {
                        contextMessage += `\n${team.pos}. ${team.team} - ${team.pts}pts (${team.g}G ${team.e}E ${team.p}P) GF:${team.gf} GC:${team.gc}`;
                    });
                }
            }
        }
        
        if (context.homeTeam && context.awayTeam) {
            contextMessage += `\n\nPartido específico: ${context.homeTeam} vs ${context.awayTeam}`;
        }
        
        if (context.analysisType) {
            const analysisTypes = {
                'match': 'Análisis de partido específico',
                'team': 'Análisis de equipo',
                'player': 'Análisis de jugador',
                'trends': 'Análisis de tendencias',
                'predictions': 'Predicciones y pronósticos'
            };
            contextMessage += `\nTipo de análisis solicitado: ${analysisTypes[context.analysisType] || context.analysisType}`;
        }

        const fullMessage = message + contextMessage;

        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: fullMessage
        });

        try {
            const response = await fetch(`${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{
                            text: systemPrompt
                        }]
                    },
                    contents: this.conversationHistory.slice(-10).map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    })),
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Error HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                
                // Add AI response to history
                this.conversationHistory.push({
                    role: 'assistant',
                    content: aiResponse
                });
                
                return aiResponse;
            } else {
                throw new Error('Respuesta inválida de la API');
            }
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    async generateQuickAnalysis(type, leagueId = null) {
        const prompts = {
            'weekly': 'Haz un resumen completo de los partidos más importantes de esta semana en todas las ligas que cubres. Incluye los favoritos, posibles sorpresas y los mejores jugadores en racha.',
            'scorers': 'Analiza los goleadores líderes en todas las ligas principales. ¿Quiénes tienen más oportunidades de anotar en los próximos partidos? Incluye estadísticas de minutos por gol, xG y forma reciente.',
            'surprises': 'Identifica los equipos con mejor rendimiento reciente que podrían causar sorpresas. Analiza tendencias, lesiones y factores clave que podrían influir en resultados inesperados.',
            'today': 'Dame un análisis completo de los partidos de hoy. Incluye pronósticos, estadísticas clave, valor en mercados y factores a considerar para cada encuentro.'
        };

        let context = {};
        if (leagueId) {
            context.league = leagueId;
        }

        return this.sendMessage(prompts[type] || prompts['today'], context);
    }

    async analyzeMatch(homeTeam, awayTeam, leagueId) {
        const prompt = `Realiza un análisis exhaustivo del partido ${homeTeam} vs ${awayTeam}. 
Incluye:
1. Forma reciente de ambos equipos (últimos 5-10 partidos)
2. Historial de enfrentamientos directos
3. Estadísticas clave (goles marcados/concedidos, localía/visitante)
4. Jugadores clave y posibles ausencias
5. Tácticas esperadas
6. Predicción con porcentajes de probabilidad
7. Valor en mercados de apuestas (ganador, goles, ambos equipos anotan)`;

        return this.sendMessage(prompt, { league: leagueId, homeTeam, awayTeam, analysisType: 'match' });
    }

    async analyzeTeam(teamName, leagueId) {
        const prompt = `Realiza un análisis completo del ${teamName}. 
Incluye:
1. Rendimiento en la temporada actual
2. Estadísticas ofensivas y defensivas
3. Jugadores destacados y sus contribuciones
4. Fortalezas y debilidades
5. Tácticas y estilo de juego
6. Próximos partidos y dificultad
7. Predicción para el resto de la temporada`;

        return this.sendMessage(prompt, { league: leagueId, analysisType: 'team' });
    }

    async analyzePlayer(playerName, teamName, leagueId) {
        const prompt = `Realiza un análisis detallado del jugador ${playerName} de ${teamName}.
Incluye:
1. Estadísticas de la temporada (goles, asistencias, minutos jugados)
2. Rendimiento comparado con su posición
3. Forma reciente y tendencias
4. Fortalezas y áreas de mejora
5. Impacto en el equipo
6. Potencial de mercado
7. Comparación con jugadores similares`;

        return this.sendMessage(prompt, { league: leagueId, analysisType: 'player' });
    }

    async analyzeTrends(leagueId) {
        const prompt = `Analiza las tendencias y patrones más importantes en la liga actual.
Incluye:
1. Equipos en racha ascendente/descendente
2. Tendencias goleadoras (más/menos goles)
3. Resultados en local vs visitante
4. Rendimiento en segundos tiempos
5. Impacto de lesiones y suspensiones
6. Factores externos (clima, calendario, etc.)
7. Predicciones basadas en tendencias`;

        return this.sendMessage(prompt, { league: leagueId, analysisType: 'trends' });
    }

    async generateLeagueAnalysis(leagueId) {
        const league = getLeagueById(leagueId);
        if (!league) return 'Liga no encontrada';

        const prompt = `Realiza un análisis completo y detallado de la ${league.name} (${league.country}).
Incluye:
1. Resumen general de la temporada
2. Análisis de los principales candidatos al título
3. Equipos en lucha por la clasificación a competiciones europeas
4. Equipos en peligro de descenso
5. Rendimiento general de la liga en comparación con otras
6. Jugadores destacados y candidatos a premios
7. Tendencias tácticas de la liga
8. Predicciones para el final de la temporada

Equipos participantes: ${league.teams.join(', ')}`;

        return this.sendMessage(prompt, { league: leagueId, analysisType: 'predictions' });
    }

    formatResponse(text) {
        // Convert markdown-like formatting to HTML
        let formatted = text
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Lists
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        // Wrap list items
        formatted = formatted.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        // Remove nested ul
        formatted = formatted.replace(/<\/ul>\s*<ul>/g, '');
        
        return `<p>${formatted}</p>`;
    }
}

// Create global instance
const geminiAI = new GeminiAI();
