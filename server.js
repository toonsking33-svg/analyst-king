const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = '6c33cc89febaeebd137f00b8ecde62a2';
const API_BASE = '/v3.football.api-sports.io';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// In-memory cache
const cache = {};
function cached(key, ttlMs) {
    const e = cache[key];
    if (e && Date.now() - e.t < ttlMs) return e.d;
    return null;
}
function setCache(key, data) {
    cache[key] = { d: data, t: Date.now() };
}

// Simple https fetch (works in all Node versions)
function httpsGet(endpoint, qs) {
    return new Promise((resolve, reject) => {
        const url = `${API_BASE}/${endpoint}?${qs}`;
        const opts = {
            hostname: 'v3.football.api-sports.io',
            path: `/${endpoint}?${qs}`,
            method: 'GET',
            headers: { 'x-apisports-key': API_KEY }
        };
        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

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
    if (hit) return res.json(hit);

    try {
        const result = await httpsGet(endpoint, qs);
        if (result.status !== 200) {
            return res.status(result.status).json({ error: `API HTTP ${result.status}` });
        }
        if (result.body.errors && Object.keys(result.body.errors).length > 0) {
            const errMsg = Object.values(result.body.errors).join(', ');
            return res.status(400).json({ error: errMsg });
        }
        setCache(cacheKey, result.body);
        res.json(result.body);
    } catch (err) {
        console.error('API Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', cacheEntries: Object.keys(cache).length });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Analyst King running on port ${PORT}`);
});
