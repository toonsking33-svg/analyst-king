// Gemini AI Integration for Analyst King - Betting Analysis Optimized
class GeminiAI {
    constructor() {
        this.apiKey = localStorage.getItem('geminiApiKey') || '';
        this.model = localStorage.getItem('geminiModel') || 'gemini-2.0-flash';
        this.language = localStorage.getItem('aiLanguage') || 'es';
        this.tone = localStorage.getItem('aiTone') || 'professional';
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
        this.conversationHistory = [];
    }

    setApiKey(key) { this.apiKey = key; localStorage.setItem('geminiApiKey', key); }
    setModel(model) { this.model = model; localStorage.setItem('geminiModel', model); }
    setLanguage(lang) { this.language = lang; localStorage.setItem('aiLanguage', lang); }
    setTone(tone) { this.tone = tone; localStorage.setItem('aiTone', tone); }
    isConfigured() { return this.apiKey && this.apiKey.length > 0; }

    getSystemPrompt() {
        return `Eres **Analyst King**, un experto en análisis deportivo y apuestas de fútbol profesional. Tu función principal es ayudar al usuario a tomar decisiones informadas en sus apuestas deportivas.

IMPORTANTE: Eres una herramienta de análisis, NO das consejos de apuestas directos. Siempre analizas datos y probabilidades.

**METODOLOGÍA DE ANÁLISIS (siempre usa estos pasos):**

1. **Forma reciente (últimos 5-10 partidos):** Calcular % victorias, goles promedio, clean sheets
2. **Localía vs Visitante:** Diferencia clave - muchos equipos rinden muy diferente de local/visitante
3. **H2H (Head to Head):** Historial directo últimos 5-10 enfrentamientos
4. **Goles:** Promedio de goles por partido, BTTS (both teams to score), Over/Under 2.5
5. **Lesiones y suspensiones:** Jugadores clave ausentes
6. **Motivación:** Lucha por título, descenso, clasificación europea, etc.
7. **Valor estadístico:** Comparar probabilidad real vs cuotas del mercado

**MERCADOS QUE ANALIZAS:**
- **1X2** (Ganador/Empate/Perdedor)
- **Over/Under** (Más/Menos goles - líneas 1.5, 2.5, 3.5)
- **BTTS** (Ambos equipos anotan - Sí/No)
- **Handicap** (Asian y Europeo)
- **Marcador exacto**
- **Doble oportunidad** (1X, X2, 12)
- **Primera/Segunda mitad**
- **Goles por equipo**

**FORMATO DE ANÁLISIS (usa siempre):**
Para cada partido analiza:
📊 **ESTADÍSTICAS CLAVE**
- Forma reciente (últimos 5)
- Promedio goles local/visitante
- H2H reciente

⚽ **ANÁLISIS DEL PARTIDO**
- Factores favorables local
- Factores favorables visitante
- Riesgos a considerar

🎯 **VALOR ESTADÍSTICO**
- Probabilidad estimada por resultado
- Mercados con más valor
- Confianza del análisis (1-5 estrellas)

⚠️ **RIESGO**
- Nivel de confianza general
- Factores impredecibles

**REGLAS ESTRICTAS:**
1. NUNCA digas "apuesta por X" - di "el valor estadístico favorece a X"
2. SIEMPRE indica el nivel de confianza
3. SIEMPRE menciona los riesgos
4. Usa datos reales cuando estén disponibles en el contexto
5. Sé honesto cuando no tengas suficientes datos
6. Recuerda: el fútbol es impredecible, NINGÚN análisis garantiza resultado
7. Enfócate en encontrar VALUE BETS (cuando la probabilidad real > probabilidad implícita de la cuota)

Ligas que cubres: Premier League, LaLiga, Bundesliga, Serie A, Ligue 1, Eredivisie, Liga Portugal, Brasileirão, Liga MX, MLS, Champions League, Europa League, Libertadores, Sudamericana, Liga Argentina, FA Cup, Championship, y más.

Idioma: ${this.language === 'es' ? 'Español' : this.language === 'pt' ? 'Português' : this.language === 'fr' ? 'Français' : 'English'}`;
    }

    async sendMessage(message, context = {}) {
        if (!this.isConfigured()) {
            throw new Error('API key de Gemini no configurada. Ve a Configuración.');
        }

        const systemPrompt = this.getSystemPrompt();
        
        let contextMessage = '';
        if (context.league) {
            const league = getLeagueById(context.league);
            if (league) contextMessage += `\n\nLiga: ${league.name} (${league.country})`;
        }
        if (context.standings) {
            contextMessage += `\n\nClasificación actual:\n${context.standings}`;
        }
        if (context.fixtures) {
            contextMessage += `\n\nPartidos:\n${context.fixtures}`;
        }
        if (context.h2h) {
            contextMessage += `\n\nHistorial directo:\n${context.h2h}`;
        }
        if (context.teamStats) {
            contextMessage += `\n\nEstadísticas del equipo:\n${context.teamStats}`;
        }

        const fullMessage = message + contextMessage;

        this.conversationHistory.push({ role: 'user', content: fullMessage });

        try {
            const response = await fetch(`${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
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
                throw new Error(errorData.error?.message || `Error HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                this.conversationHistory.push({ role: 'assistant', content: aiResponse });
                return aiResponse;
            }
            
            throw new Error('Respuesta inválida de la API');
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    clearHistory() { this.conversationHistory = []; }

    async analyzeMatch(homeTeam, awayTeam, leagueId) {
        return this.sendMessage(
            `Analiza el partido ${homeTeam} vs ${awayTeam} para apuestas deportivas. 
             Incluye: forma reciente, H2H, goles promedio, BTTS probable, Over/Under, y valor estadístico en cada mercado.
             Dame niveles de confianza del 1 al 5.`,
            { league: leagueId }
        );
    }

    async analyzeTeam(teamName, leagueId) {
        return this.sendMessage(
            `Analiza al ${teamName} para apuestas. 
             Incluye: forma reciente, rendimiento local/visitante, tendencias de goles, jugadores clave, y mercados con más valor esta semana.`,
            { league: leagueId }
        );
    }

    async analyzeTrends(leagueId) {
        return this.sendMessage(
            `Analiza las tendencias de esta liga para apuestas: equipos en racha, tendencias de goles Over/Under, BTTS frecuentes, valores encontrados en el mercado, y posibles sorpresas.`,
            { league: leagueId }
        );
    }

    async generateQuickAnalysis(type) {
        const prompts = {
            'weekly': 'Analiza los partidos más importantes de esta semana en todas las ligas. Enfócate en: Over/Under 2.5, BTTS, y valor en cuotas. Dame picks con nivel de confianza.',
            'scorers': '¿Quiénes son los goleadores en mejor forma y tienen más probabilidad de anotar esta semana? Analiza sus promedios y fixture.',
            'surprises': 'Identifica posibles sorpresas esta semana: equipos en mal momento recibiendo rivales en racha, factores de localía, y valor en cuotas altas.',
            'today': 'Análisis completo de los partidos de hoy. Para cada uno: probabilidad de Over 2.5, BTTS, ganador, y nivel de confianza del 1-5.'
        };
        return this.sendMessage(prompts[type] || prompts['today']);
    }

    formatResponse(text) {
        let formatted = text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        formatted = formatted.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        formatted = formatted.replace(/<\/ul>\s*<ul>/g, '');
        
        return `<p>${formatted}</p>`;
    }
}

const geminiAI = new GeminiAI();
