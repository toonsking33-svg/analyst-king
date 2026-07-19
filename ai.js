// Gemini AI Integration - Betting Analysis - Fixed Quota Handling
class GeminiAI {
    constructor() {
        this.apiKey = localStorage.getItem('geminiApiKey') || '';
        this.model = localStorage.getItem('geminiModel') || 'gemini-2.0-flash-lite';
        this.language = localStorage.getItem('aiLanguage') || 'es';
        this.tone = localStorage.getItem('aiTone') || 'professional';
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
        this.conversationHistory = [];
        this.lastRequestTime = 0;
        this.minInterval = 4000; // 4 seconds between requests to avoid rate limits
    }

    setApiKey(key) { this.apiKey = key; localStorage.setItem('geminiApiKey', key); }
    setModel(model) { this.model = model; localStorage.setItem('geminiModel', model); }
    setLanguage(lang) { this.language = lang; localStorage.setItem('aiLanguage', lang); }
    setTone(tone) { this.tone = tone; localStorage.setItem('aiTone', tone); }
    isConfigured() { return this.apiKey && this.apiKey.length > 0; }

    getSystemPrompt() {
        return `Eres **Analyst King**, un experto en análisis deportivo y apuestas de fútbol profesional.

**METODOLOGÍA:**
1. Forma reciente (últimos 5-10 partidos)
2. Localía vs Visitante
3. H2H (Head to Head)
4. Goles promedio, BTTS, Over/Under
5. Lesiones y suspenciones
6. Motivación del equipo

**MERCADOS:** 1X2, Over/Under, BTTS, Handicap, Doble Oportunidad, Primera/Segunda mitad

**FORMATO:**
📊 **ESTADÍSTICAS** - Forma, goles, H2H
⚽ **ANÁLISIS** - Factores favorables/riesgos
🎯 **VALOR** - Probabilidad y confianza 1-5 ⭐
⚠️ **RIESGO** - Factores impredecibles

**REGLAS:**
- NUNCA digas "apuesta por X" - di "el valor favorece a X"
- SIEMPRE indica confianza 1-5
- SIEMPRE menciona riesgos
- Sé honesto sin datos
- El fútbol es impredecible

Idioma: ${this.language === 'es' ? 'Español' : this.language === 'pt' ? 'Português' : 'English'}`;
    }

    async sendMessage(message, context = {}) {
        if (!this.apiKey) throw new Error('Configura tu API key de Gemini en Configuración');

        let contextMessage = '';
        if (context.league) {
            const league = getLeagueById(context.league);
            if (league) contextMessage += `\nLiga: ${league.name}`;
        }
        if (context.standings) contextMessage += `\n\nClasificación:\n${context.standings}`;
        if (context.fixtures) contextMessage += `\n\nPartidos:\n${context.fixtures}`;
        if (context.h2h) contextMessage += `\n\nH2H:\n${context.h2h}`;

        const fullMessage = message + contextMessage;
        this.conversationHistory.push({ role: 'user', content: fullMessage });

        const maxRetries = 3;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Rate limit protection between attempts
                const now = Date.now();
                const timeSinceLastRequest = now - this.lastRequestTime;
                if (timeSinceLastRequest < this.minInterval) {
                    await new Promise(r => setTimeout(r, this.minInterval - timeSinceLastRequest));
                }
                this.lastRequestTime = Date.now();

                const response = await fetch(`${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: this.getSystemPrompt() }] },
                        contents: this.conversationHistory.slice(-6).map(msg => ({
                            role: msg.role === 'assistant' ? 'model' : 'user',
                            parts: [{ text: msg.content }]
                        })),
                        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
                    })
                });

                if (response.status === 429 && attempt < maxRetries) {
                    const waitTime = Math.pow(2, attempt + 1) * 5000;
                    await new Promise(r => setTimeout(r, waitTime));
                    continue;
                }

                if (response.status === 429) {
                    throw new Error('Cuota de Gemini API agotada o muchas solicitudes. Espera 1 minuto o verifica tu plan en https://ai.google.dev/pricing');
                }

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    const msg = err.error?.message || `Error HTTP ${response.status}`;
                    if (msg.includes('quota') || msg.includes('Quota') || msg.includes('429')) {
                        throw new Error('Cuota de Gemini API agotada. Verifica tu plan en https://ai.google.dev');
                    }
                    throw new Error(msg);
                }

                const data = await response.json();
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const aiResponse = data.candidates[0].content.parts[0].text;
                    this.conversationHistory.push({ role: 'assistant', content: aiResponse });
                    return aiResponse;
                }

                throw new Error('Respuesta vacía de la API');
            } catch (error) {
                if (attempt >= maxRetries || (error.message && !error.message.includes('429') && !error.message.includes('rate') && !error.message.includes('limit'))) {
                    console.error('Gemini Error:', error);
                    throw error;
                }
                const waitTime = Math.pow(2, attempt + 1) * 5000;
                await new Promise(r => setTimeout(r, waitTime));
            }
        }
    }

    clearHistory() { this.conversationHistory = []; }

    async analyzeMatch(homeTeam, awayTeam, leagueId) {
        return this.sendMessage(
            `Analiza ${homeTeam} vs ${awayTeam} para apuestas: forma reciente, H2H, goles, BTTS, Over/Under, valor estadístico. Confianza 1-5.`,
            { league: leagueId }
        );
    }

    async analyzeTeam(teamName, leagueId) {
        return this.sendMessage(
            `Analiza ${teamName} para apuestas: forma, localía, goles, jugadores clave, mercados con valor.`,
            { league: leagueId }
        );
    }

    async analyzeTrends(leagueId) {
        return this.sendMessage(
            `Tendencias de esta liga para apuestas: equipos en racha, Over/Under, BTTS, valor en cuotas, sorpresas probables.`,
            { league: leagueId }
        );
    }

    async generateQuickAnalysis(type) {
        const prompts = {
            'weekly': 'Mejores picks de la semana: Over/Under 2.5, BTTS, valor en cuotas. Confianza 1-5.',
            'scorers': 'Goleadores en mejor racha esta semana. Promedio, fixture, probabilidad de anotar.',
            'surprises': 'Posibles sorpresas: equipos sobrevalorados, cuotas con valor, estadísticas probables.',
            'today': 'Análisis partidos de hoy: Over 2.5, BTTS, ganador, confianza 1-5.',
            'overunder': 'Mejores Over/Under 2.5 de hoy. Promedio goles, porcentaje Over últimos 10, confianza.',
            'btts': 'Partidos con más probabilidad BTTS hoy. Defensas, ataques, tendencias.'
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
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        formatted = formatted.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        formatted = formatted.replace(/<\/ul>\s*<ul>/g, '');
        return `<p>${formatted}</p>`;
    }
}

const geminiAI = new GeminiAI();
