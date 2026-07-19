const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = '6c33cc89febaeebd137f00b8ecde62a2';
const API_BASE = 'https://v3.football.api-sports.io';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// In-memory cache
const cache = {};
function getCached(key, ttlMs) {
    const entry = cache[key];
    if (entry && Date.now() - entry.time < ttlMs) return entry.data;
    return null;
}
function setCache(key, data) {
    cache[key] = { data, time: Date.now() };
}

// Proxy endpoint for API-Football
app.get('/api/football/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const qs = new URLSearchParams(req.query).toString();
    const cacheKey = `${endpoint}?${qs}`;

    // Cache durations (aggressive to stay within 100 req/day)
    const ttl = {
        'status': 3600000,         // 1 hour
        'standings': 1800000,      // 30 min
        'fixtures': 300000,        // 5 min (today's matches change)
        'players/topscorers': 1800000, // 30 min
        'players/topassists': 1800000, // 30 min
        'teams': 3600000,          // 1 hour
        'predictions': 600000,     // 10 min
    };
    const ttlMs = ttl[endpoint] || 300000;

    const cached = getCached(cacheKey, ttlMs);
    if (cached) return res.json(cached);

    try {
        const url = `${API_BASE}/${endpoint}?${qs}`;
        const response = await fetch(url, {
            headers: { 'x-apisports-key': API_KEY }
        });
        if (!response.ok) {
            return res.status(response.status).json({ error: `API-Football HTTP ${response.status}` });
        }
        const data = await response.json();
        setCache(cacheKey, data);

        // Log remaining requests
        if (data.response?.requests) {
            console.log(`API Usage: ${data.response.requests.used}/${data.response.requests.limit_daily}`);
        }
        res.json(data);
    } catch (err) {
        console.error('API Proxy Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Analyst King running on port ${PORT}`);
});
