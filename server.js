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

// Cache system
const cache = {};
function cached(key, ttlMs) {
    const e = cache[key];
    if (e && Date.now() - e.t < ttlMs) return e.d;
    return null;
}
function setCache(key, data) {
    cache[key] = { d: data, t: Date.now() };
}

// API-Football proxy
app.get('/api/football/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const qs = new URLSearchParams(req.query).toString();
    const cacheKey = `${endpoint}?${qs}`;

    const ttlMap = {
        'status': 3600000,
        'standings': 1800000,
        'fixtures': 300000,
        'predictions': 600000,
        'fixtures/statistics': 600000,
        'players/topscorers': 1800000
    };
    const ttl = ttlMap[endpoint] || 300000;

    const hit = cached(cacheKey, ttl);
    if (hit) {
        console.log(`CACHE HIT: ${cacheKey}`);
        return res.json(hit);
    }

    try {
        const url = `${API_BASE}/${endpoint}?${qs}`;
        console.log(`API CALL: ${url}`);
        const response = await fetch(url, {
            headers: { 'x-apisports-key': API_KEY }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `API-Football HTTP ${response.status}` });
        }

        const data = await response.json();

        if (data.errors && Object.keys(data.errors).length > 0) {
            const errMsg = Object.values(data.errors).join(', ');
            return res.status(400).json({ error: errMsg });
        }

        setCache(cacheKey, data);

        if (data.response?.requests) {
            const r = data.response.requests;
            console.log(`API Usage: ${r.used}/${r.limit_daily}`);
        }

        res.json(data);
    } catch (err) {
        console.error('API Proxy Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', cacheEntries: Object.keys(cache).length });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Analyst King running on port ${PORT}`);
});
